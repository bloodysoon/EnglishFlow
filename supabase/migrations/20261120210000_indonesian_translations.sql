-- Indonesian (id) as a third translation language, next to ru and ro.
-- Hand-filled dictionary translations come from content/dictionary/translations.csv
-- (columns id, definition_id) → supabase/seed/dictionary.sql. Safe to run more than once.

alter table public.dictionary_entries
  add column if not exists translation_id text check (char_length(translation_id) <= 300),
  add column if not exists definition_id text check (char_length(definition_id) <= 500);

alter table public.word_translations drop constraint if exists word_translations_language_check;
alter table public.word_translations
  add constraint word_translations_language_check check (language in ('ru', 'ro', 'id'));

alter table public.profiles drop constraint if exists profiles_translation_language_check;
alter table public.profiles
  add constraint profiles_translation_language_check check (translation_language in ('ru', 'ro', 'id'));

alter table public.app_settings drop constraint if exists app_settings_default_translation_language_check;
alter table public.app_settings
  add constraint app_settings_default_translation_language_check
  check (default_translation_language in ('ru', 'ro', 'id'));

-- The two functions below are unchanged apart from accepting 'id'.

create or replace function public.add_dictionary_word(
  p_lemma text,
  p_known boolean,
  p_part_of_speech text default '',
  p_ipa text default null,
  p_definition text default null,
  p_example text default null,
  p_language text default null,
  p_translation text default null,
  p_alternatives text[] default '{}'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_entry public.dictionary_entries%rowtype;
  v_pos text;
  v_alternatives text[] := coalesce(p_alternatives, '{}');
  v_limit integer;
  v_word uuid;
  v_added integer;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select * into v_entry from public.dictionary_entries d where d.lemma = lower(btrim(p_lemma));
  if not found or p_known is null then
    raise exception 'invalid_word' using errcode = '22023';
  end if;

  v_pos := coalesce(nullif(btrim(p_part_of_speech), ''), v_entry.part_of_speech);
  if v_pos not in ('', 'noun', 'verb', 'adj', 'adv', 'prep', 'conj', 'pron', 'det', 'intj', 'num', 'phrase') then
    v_pos := v_entry.part_of_speech;
  end if;

  if char_length(coalesce(p_definition, '')) > 500
     or char_length(coalesce(p_example, '')) > 300
     or char_length(coalesce(p_ipa, '')) > 100
     or (p_translation is not null and (
       p_language not in ('ru', 'ro', 'id')
       or char_length(btrim(p_translation)) not between 1 and 200
       or cardinality(v_alternatives) > 5
       or exists (select 1 from unnest(v_alternatives) a where char_length(btrim(a)) not between 1 and 200)
     )) then
    raise exception 'invalid_word' using errcode = '22023';
  end if;

  if not p_known then
    v_limit := public.plan_new_words_limit(public.my_plan());
    -- A null limit (unlimited) makes the check null, so it never raises.
    if (
      select count(*) from public.user_words uw
      where uw.user_id = v_user and uw.introduced_on = current_date
    ) >= v_limit then
      raise exception 'daily_limit' using errcode = 'P0001';
    end if;
  end if;

  insert into public.words (lemma, part_of_speech, ipa, definition, example, source, owner_id, cefr_level, level_source)
  values (
    v_entry.lemma, v_pos, nullif(btrim(p_ipa), ''), nullif(btrim(p_definition), ''), nullif(btrim(p_example), ''),
    'wiktionary', v_user, v_entry.cefr_level, v_entry.level_source
  )
  on conflict (lemma, part_of_speech, owner_id) do update
    set cefr_level = excluded.cefr_level, level_source = excluded.level_source
  returning id into v_word;

  if p_translation is not null then
    insert into public.word_translations (word_id, language, translation, alternatives, source, reviewed)
    values (v_word, p_language, btrim(p_translation), array(select btrim(a) from unnest(v_alternatives) a), 'wiktionary', false)
    on conflict (word_id, language) do nothing;
  end if;

  if p_known then
    insert into public.user_words (user_id, word_id, due_on, known)
    values (v_user, v_word, null, true)
    on conflict (user_id, word_id) do nothing;
    get diagnostics v_added = row_count;
    if v_added > 0 then
      perform public.award_known_word_xp(v_user, v_word);
    end if;
  else
    insert into public.user_words (user_id, word_id, due_on, introduced_on, box)
    values (v_user, v_word, current_date, current_date, 1)
    on conflict (user_id, word_id) do nothing;
  end if;

  return v_word;
end;
$$;

create or replace function public.add_custom_word(
  p_lemma text,
  p_part_of_speech text,
  p_language text,
  p_translation text,
  p_alternatives text[] default '{}',
  p_example text default null,
  p_ipa text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_lemma text := lower(btrim(p_lemma));
  v_pos text := coalesce(btrim(p_part_of_speech), '');
  v_alternatives text[] := coalesce(p_alternatives, '{}');
  v_today_count integer;
  v_plan text := public.my_plan();
  v_custom_limit integer := public.plan_custom_words_limit(v_plan);
  v_new_limit integer := public.plan_new_words_limit(v_plan);
  v_word uuid;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  -- Same rules as customWordSchema in src/features/learning/custom-word.ts.
  if v_lemma is null or char_length(v_lemma) not between 1 and 60
     or v_lemma !~ '^[a-z]+([ ''-][a-z]+)*$' then
    raise exception 'invalid_word' using errcode = '22023';
  end if;
  if v_pos not in ('', 'noun', 'verb', 'adj', 'adv', 'prep', 'conj', 'pron', 'det', 'intj', 'num', 'phrase') then
    raise exception 'invalid_word' using errcode = '22023';
  end if;
  if p_language not in ('ru', 'ro', 'id') then
    raise exception 'invalid_word' using errcode = '22023';
  end if;
  if p_translation is null or char_length(btrim(p_translation)) not between 1 and 200
     or cardinality(v_alternatives) > 5
     or exists (select 1 from unnest(v_alternatives) a where char_length(btrim(a)) not between 1 and 200)
     or char_length(coalesce(p_example, '')) > 300
     or char_length(coalesce(p_ipa, '')) > 100 then
    raise exception 'invalid_word' using errcode = '22023';
  end if;

  select count(*) into v_today_count
  from public.words w
  -- Only words typed by the learner; dictionary words they sorted don't count.
  where w.owner_id = v_user and w.source = 'manual' and w.created_at >= current_date;
  -- A null limit (unlimited) makes the check null, so it never raises.
  if v_today_count >= v_custom_limit then
    raise exception 'daily_limit' using errcode = 'P0001';
  end if;

  -- An own word is a new word too, so it counts toward the daily new words.
  if (
    select count(*) from public.user_words uw
    where uw.user_id = v_user and uw.introduced_on = current_date
  ) >= v_new_limit then
    raise exception 'daily_limit' using errcode = 'P0001';
  end if;

  insert into public.words (lemma, part_of_speech, ipa, example, source, owner_id)
  values (v_lemma, v_pos, nullif(btrim(p_ipa), ''), nullif(btrim(p_example), ''), 'manual', v_user)
  on conflict (lemma, part_of_speech, owner_id) do update
    set ipa = coalesce(excluded.ipa, public.words.ipa),
        example = coalesce(excluded.example, public.words.example)
  returning id into v_word;

  insert into public.word_translations (word_id, language, translation, alternatives, source, reviewed)
  values (
    v_word,
    p_language,
    btrim(p_translation),
    array(select btrim(a) from unnest(v_alternatives) a),
    'manual',
    true
  )
  on conflict (word_id, language) do update
    set translation = excluded.translation, alternatives = excluded.alternatives;

  insert into public.user_words (user_id, word_id, due_on, introduced_on, box)
  values (v_user, v_word, current_date, current_date, 1)
  on conflict (user_id, word_id) do nothing;

  return v_word;
end;
$$;

-- Duels: an Indonesian prompt per round. Rounds made before this have none,
-- so they fall back to Russian.
alter table public.duel_rounds add column if not exists prompt_id text;

create or replace function public.duel_make_rounds(p_duel uuid, p_league text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  levels text[] := case p_league
    when 'beginner' then array['A1', 'A2']
    when 'intermediate' then array['B1', 'B2']
    else array['C1', 'C2']
  end;
  w record;
  n smallint := 0;
  wrong text[];
  correct smallint;
begin
  for w in
    select * from (
      (select e.*, 1 as part from public.dictionary_entries e
       where e.cefr_level = levels[1] and e.part_of_speech in ('noun', 'verb', 'adj', 'adv')
         and e.translation_ru is not null and e.translation_ro is not null and e.translation_id is not null
       order by random() limit 4)
      union all
      (select e.*, 2 as part from public.dictionary_entries e
       where e.cefr_level = levels[2] and e.part_of_speech in ('noun', 'verb', 'adj', 'adv')
         and e.translation_ru is not null and e.translation_ro is not null and e.translation_id is not null
       order by random() limit 6)
    ) picked
    order by part
  loop
    select array_agg(x.lemma) into wrong
    from (
      select o.lemma from public.dictionary_entries o
      where o.cefr_level = w.cefr_level and o.lemma <> w.lemma
        and o.translation_ru is not null and o.translation_ro is not null and o.translation_id is not null
        and not (public.duel_meanings(o.translation_ru) && public.duel_meanings(w.translation_ru))
        and not (public.duel_meanings(o.translation_ro) && public.duel_meanings(w.translation_ro))
        and not (public.duel_meanings(o.translation_id) && public.duel_meanings(w.translation_id))
      order by (o.part_of_speech = w.part_of_speech) desc, (o.topics && w.topics) desc, random()
      limit 3
    ) x;

    n := n + 1;
    correct := floor(random() * 4)::smallint;
    insert into public.duel_rounds (duel_id, round, lemma, prompt_ru, prompt_ro, prompt_id, options, correct)
    values (
      p_duel, n, w.lemma, w.translation_ru, w.translation_ro, w.translation_id,
      wrong[1:correct] || w.lemma || wrong[correct + 1:3],
      correct
    );
  end loop;

  if n < 10 then raise exception 'duel_no_words' using errcode = 'P0001'; end if;
end;
$$;

create or replace function public.duel_state(p_duel uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  d public.duels;
  them uuid;
  lang text;
begin
  if me is null then raise exception 'not authenticated'; end if;
  if not exists (select 1 from public.duels where id = p_duel and me in (challenger, opponent)) then
    return null;
  end if;

  perform public.duel_settle(p_duel);
  select * into d from public.duels where id = p_duel;
  them := case when d.challenger = me then d.opponent else d.challenger end;
  select translation_language into lang from public.profiles where id = me;

  return jsonb_build_object(
    'id', d.id,
    'league', d.league,
    'status', d.status,
    'is_challenger', d.challenger = me,
    'round', d.round,
    'answered', d.answered,
    'starts_at', d.round_starts_at,
    'ends_at', d.round_ends_at,
    'now', now(),
    'me', jsonb_build_object(
      'username', (select username from public.profiles where id = me),
      'score', case when d.challenger = me then d.challenger_score else d.opponent_score end
    ),
    'them', jsonb_build_object(
      'username', (select username from public.profiles where id = them),
      'score', case when d.challenger = me then d.opponent_score else d.challenger_score end
    ),
    'winner', case when d.winner is null then null when d.winner = me then 'me' else 'them' end,
    'question', (
      select jsonb_build_object('prompt', case lang when 'ro' then r.prompt_ro when 'id' then coalesce(r.prompt_id, r.prompt_ru) else r.prompt_ru end, 'options', r.options)
      from public.duel_rounds r
      where d.status = 'active' and r.duel_id = d.id and r.round = d.round
        and now() >= d.round_starts_at - interval '300 milliseconds'
    ),
    'my_choice', (
      select a.choice from public.duel_answers a
      where d.status = 'active' and a.duel_id = d.id and a.round = d.round and a.user_id = me
    ),
    'rounds', coalesce((
      select jsonb_agg(jsonb_build_object(
        'round', r.round,
        'prompt', case lang when 'ro' then r.prompt_ro when 'id' then coalesce(r.prompt_id, r.prompt_ru) else r.prompt_ru end,
        'options', r.options,
        'correct', r.correct,
        'my_choice', mine.choice,
        'my_points', coalesce(mine.points, 0),
        'their_choice', theirs.choice,
        'their_points', coalesce(theirs.points, 0)
      ) order by r.round)
      from public.duel_rounds r
      left join public.duel_answers mine on mine.duel_id = r.duel_id and mine.round = r.round and mine.user_id = me
      left join public.duel_answers theirs on theirs.duel_id = r.duel_id and theirs.round = r.round and theirs.user_id = them
      where r.duel_id = d.id
        and (r.round < d.round or (d.status = 'finished' and r.round = d.round))
    ), '[]'::jsonb)
  );
end;
$$;
