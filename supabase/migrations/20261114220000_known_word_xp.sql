-- XP for "I know it": a word the learner already knows earns a small,
-- level-based amount the first time they mark it (base 2 × the CEFR
-- multiplier from xp_rules: A1 2, A2 2, B1 3, B2 4, C1 5, C2 6 by default).
-- Less than a review, so learning still pays more than skipping.
-- At most 50 such awards a day, so tapping "I know it" cannot be farmed.
-- Keep the numbers in sync with KNOWN_WORD_XP in src/features/leitner/xp.ts.
-- Run after 20261114210000_dictionary_translations.sql. Safe to run more than once.

alter table public.xp_events drop constraint if exists xp_events_reason_check;
alter table public.xp_events add constraint xp_events_reason_check
  check (reason in ('review_remembered', 'review_forgot', 'word_mastered', 'word_known'));

-- ---------------------------------------------------------------------
-- award_known_word_xp: internal, called by triage_word and
-- add_dictionary_word right after a word is newly marked as known.
-- ---------------------------------------------------------------------

create or replace function public.award_known_word_xp(p_user uuid, p_word_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_level text;
  v_rules public.xp_rules%rowtype;
  v_multiplier numeric;
  v_xp integer;
begin
  if (
    select count(*) from public.xp_events x
    where x.user_id = p_user and x.reason = 'word_known' and x.created_at >= current_date
  ) >= 50 then
    return 0;
  end if;

  select w.cefr_level into v_level from public.words w where w.id = p_word_id;
  select * into v_rules from public.xp_rules r where r.id;

  v_multiplier := coalesce(case v_level
    when 'A1' then v_rules.multiplier_a1
    when 'A2' then v_rules.multiplier_a2
    when 'B1' then v_rules.multiplier_b1
    when 'B2' then v_rules.multiplier_b2
    when 'C1' then v_rules.multiplier_c1
    when 'C2' then v_rules.multiplier_c2
    else v_rules.multiplier_a1
  end, 1);

  v_xp := round(2 * v_multiplier);

  insert into public.xp_events (user_id, word_id, reason, amount)
  values (p_user, p_word_id, 'word_known', v_xp);

  return v_xp;
end;
$$;

-- Not callable by clients: only the functions below award it.
revoke execute on function public.award_known_word_xp(uuid, uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- triage_word: as in 20261114180000_word_triage.sql, plus known XP.
-- ---------------------------------------------------------------------

create or replace function public.triage_word(p_word_id uuid, p_known boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_limit integer;
  v_added integer;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if p_known is null or not exists (
    select 1
    from public.words w
    join public.word_set_items i on i.word_id = w.id
    join public.word_sets s on s.id = i.set_id and s.is_published
    where w.id = p_word_id and w.owner_id is null
  ) then
    raise exception 'invalid_word' using errcode = '22023';
  end if;

  if p_known then
    insert into public.user_words (user_id, word_id, due_on, known)
    values (v_user, p_word_id, null, true)
    on conflict (user_id, word_id) do nothing;
    get diagnostics v_added = row_count;
    if v_added > 0 then
      perform public.award_known_word_xp(v_user, p_word_id);
    end if;
    return;
  end if;

  v_limit := public.plan_new_words_limit(public.my_plan());
  -- A null limit (unlimited) makes the check null, so it never raises.
  if (
    select count(*) from public.user_words uw
    where uw.user_id = v_user and uw.introduced_on = current_date
  ) >= v_limit then
    raise exception 'daily_limit' using errcode = 'P0001';
  end if;

  insert into public.user_words (user_id, word_id, due_on, introduced_on, box)
  values (v_user, p_word_id, current_date, current_date, 1)
  on conflict (user_id, word_id) do nothing;
end;
$$;

-- ---------------------------------------------------------------------
-- add_dictionary_word: as in 20261114190000_dictionary_pool.sql, plus
-- known XP. Grants carry over.
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
