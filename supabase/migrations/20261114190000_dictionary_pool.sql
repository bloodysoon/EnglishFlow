-- Dictionary pool: the Learn page's word card draws random words from the
-- whole CEFR word list (CEFR-J + Octanove, ~8,800 words), not only from
-- word sets. Wiktionary details are fetched per word when the card shows;
-- a word is saved (as the learner's own copy, with its automatic,
-- unreviewed translation) only when they tap "I know it" or "Learn it".
-- Run after 20261114180000_word_triage.sql, then supabase/seed/dictionary.sql
-- (npm run words:dictionary). Safe to run more than once.

create table if not exists public.dictionary_entries (
  lemma text primary key,
  part_of_speech text not null default '',
  cefr_level text not null check (cefr_level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  level_source text not null check (level_source in ('cefr-j', 'octanove'))
);

alter table public.dictionary_entries enable row level security;

drop policy if exists "Signed-in users read the dictionary" on public.dictionary_entries;
create policy "Signed-in users read the dictionary"
  on public.dictionary_entries for select
  to authenticated
  using (true);

-- Replaced by pick_dictionary_words.
drop function if exists public.pick_new_words(integer);

-- ---------------------------------------------------------------------
-- pick_dictionary_words: random dictionary words I have neither learned
-- nor marked as known, from the easiest CEFR level I have not finished
-- (A1 first). Text order of the levels matches their difficulty.
-- shortcut: order by random() reads the level's open words; fine for this
-- list size, revisit if the pool grows a lot.
-- ---------------------------------------------------------------------

create or replace function public.pick_dictionary_words(p_count integer default 3)
returns table (lemma text, part_of_speech text, cefr_level text)
language sql
volatile
security invoker
set search_path = ''
as $$
  with mine as (
    select w.lemma
    from public.user_words uw
    join public.words w on w.id = uw.word_id
    where uw.user_id = (select auth.uid())
  ),
  open_words as (
    select d.lemma, d.part_of_speech, d.cefr_level
    from public.dictionary_entries d
    where not exists (select 1 from mine m where m.lemma = d.lemma)
  )
  select o.lemma, o.part_of_speech, o.cefr_level
  from open_words o
  where o.cefr_level = (select min(cefr_level) from open_words)
  order by random()
  limit least(greatest(coalesce(p_count, 3), 1), 20);
$$;

-- ---------------------------------------------------------------------
-- add_dictionary_word: save a dictionary word as my own copy and sort it:
-- known, or into today's reviews within the plan's daily limit. The level
-- comes from dictionary_entries (not the caller); the Wiktionary details
-- only ever land in my own copy, so they cannot reach other learners.
-- ---------------------------------------------------------------------

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
       p_language not in ('ru', 'ro')
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
  else
    insert into public.user_words (user_id, word_id, due_on, introduced_on, box)
    values (v_user, v_word, current_date, current_date, 1)
    on conflict (user_id, word_id) do nothing;
  end if;

  return v_word;
end;
$$;

revoke execute on function public.pick_dictionary_words(integer) from public, anon;
revoke execute on function public.add_dictionary_word(text, boolean, text, text, text, text, text, text, text[]) from public, anon;
grant execute on function public.pick_dictionary_words(integer) to authenticated;
grant execute on function public.add_dictionary_word(text, boolean, text, text, text, text, text, text, text[]) to authenticated;

-- ---------------------------------------------------------------------
-- add_custom_word: as in 20261114170000_subscriptions.sql, but the daily
-- own-word limit only counts words the learner typed (source 'manual'),
-- not dictionary words they sorted. Grants carry over.
-- ---------------------------------------------------------------------

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
  if p_language not in ('ru', 'ro') then
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
