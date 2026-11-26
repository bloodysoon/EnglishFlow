-- Learning integrity 2 of 2: the learning RPCs use the ledger (PROPOSAL ONLY).
-- Run right after 20261127150200 (same push). Each function is the deployed
-- definition with the integrity changes marked "INTEGRITY:". Signatures,
-- return types, error codes and grants are unchanged (CREATE OR REPLACE keeps
-- grants), so the web and mobile apps need no change. Rollback:
-- rollback/rollback_20261127150300_learning_rpcs_integrity.sql (verbatim deployed definitions).
--
-- Invariants enforced (README §2):
--   I1 one XP-bearing, qualifying review per learner, logical word and UTC day
--   I2 removing and re-adding a word resets nothing (ledger survives deletion; logical word key)
--   I3 forgetting a known word spends the daily new-word allowance (or queues the word)
--   I4 daily allowances come from the append-only ledger, not from rows that still exist
--   I5 "today" and due dates use the server's UTC date, never the session time zone
--   I6 no client-chosen XP, timestamps, reasons or counters (unchanged signatures; ledger private)
--   I7 concurrency: row locks, a per-learner advisory lock for allowances, unique ledger keys
--   I8 known-word XP once per logical word, ever (the 50 a day cap stays)
--   I9 a repeat review the same day changes no progress (box, interval, mastery) and earns nothing
--   I10 the mastery bonus is paid once per logical word for the life of the account

-- Pick up anything written by the old functions since 20261127150200 ran.
select public.learning_ledger_backfill();

-- ---------------------------------------------------------------------
-- review_word: I1, I5, I9, I10. The reply gains one ADDITIVE column, `counted`
-- (false for a repeat the same day), so the apps can say "already reviewed
-- today". Clients read the reply by column name, so older builds are
-- unaffected. A new return type needs DROP + CREATE; the grants are restored
-- exactly as deployed (owner, authenticated, service_role; no anon/PUBLIC).
-- ---------------------------------------------------------------------
drop function if exists public.review_word(uuid, boolean);
create function public.review_word(p_word_id uuid, p_remembered boolean)
returns table (new_box smallint, next_due_on date, xp_awarded integer, mastered boolean, counted boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_box smallint;
  v_due date;
  v_level text;
  v_rules public.xp_rules%rowtype;
  v_new_box smallint;
  v_interval integer;
  v_multiplier numeric;
  v_xp integer;
  v_bonus integer := 0;
  v_mastered boolean;
  v_total bigint;
  v_boost numeric;
  v_today date := public.learning_today();  -- INTEGRITY: I5
  v_first boolean;                          -- INTEGRITY: I1
  v_mastery_paid boolean := false;          -- INTEGRITY: I10
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if p_remembered is null then
    raise exception 'answer_required' using errcode = '22004';
  end if;

  -- Lock my row so two quick taps cannot both earn XP.
  select uw.box, uw.due_on into v_box, v_due
  from public.user_words uw
  where uw.user_id = v_user and uw.word_id = p_word_id
  for update;

  if not found then
    raise exception 'word_not_in_my_words' using errcode = 'P0002';
  end if;

  -- Only due words count: no farming XP by repeating one word, and no
  -- skipping the queue.
  if v_due is null or v_due > v_today then
    raise exception 'not_due' using errcode = 'P0001';
  end if;

  -- INTEGRITY: I1, I2, I9. The first review of this LOGICAL word today
  -- (whatever its current word_id, even after removing and re-adding it, or a
  -- second copy of it) is the only one that counts. A repeat changes no
  -- progress: the box stays, the word is due again tomorrow, 0 XP, no review
  -- event, no mastery. The unique ledger key makes this safe under concurrency.
  insert into public.learning_ledger (user_id, kind, word_key, day)
  select v_user, 'reviewed', public.learning_word_key(w.lemma, w.part_of_speech), v_today
  from public.words w where w.id = p_word_id
  on conflict do nothing;
  v_first := found;
  if not v_first then
    update public.user_words set due_on = v_today + 1 where user_id = v_user and word_id = p_word_id;
    return query select v_box, v_today + 1, 0, false, false;
    return;
  end if;

  select w.cefr_level into v_level from public.words w where w.id = p_word_id;
  select * into v_rules from public.xp_rules r where r.id;

  -- Leitner rule (boxes.ts nextBox): remembered → up one box, max 5;
  -- forgot → back to box 1.
  v_new_box := case when p_remembered then least(v_box + 1, 5) else 1 end;

  -- Review intervals in days (boxes.ts LEITNER_BOXES).
  v_interval := case v_new_box when 1 then 1 when 2 then 3 when 3 then 7 when 4 then 14 when 5 then 30 end;

  -- XP: base per answer × CEFR multiplier, bonus on mastering. Missing
  -- rules row → the original defaults.
  v_multiplier := coalesce(case v_level
    when 'A1' then v_rules.multiplier_a1
    when 'A2' then v_rules.multiplier_a2
    when 'B1' then v_rules.multiplier_b1
    when 'B2' then v_rules.multiplier_b2
    when 'C1' then v_rules.multiplier_c1
    when 'C2' then v_rules.multiplier_c2
    else v_rules.multiplier_a1
  end, 1);

  -- Level boost (xpBoost in src/features/leitner/xp.ts): +1% per learner
  -- level above 1, at most +20%. The level comes from XP before this answer
  -- (inverse of xpForLevel; may differ by a rounding XP at a boundary).
  select coalesce(sum(x.amount), 0) into v_total from public.xp_events x where x.user_id = v_user;
  v_boost := least(floor(power(greatest(v_total, 0) / 100.0, 2.0 / 3.0) + 1e-9) * 0.01, 0.20);
  v_multiplier := v_multiplier * (1 + v_boost);

  v_xp := round(
    (case when p_remembered then coalesce(v_rules.xp_remembered, 10) else coalesce(v_rules.xp_forgot, 0) end)
    * v_multiplier
  );
  v_mastered := p_remembered and v_box = 4;
  -- INTEGRITY: I10. The mastery bonus (and its word_mastered event) is paid
  -- once per logical word for the life of the account: re-learning and
  -- re-mastering after removing and re-adding it, or mastering a second copy,
  -- still reaches box 5 (mastered = true) but pays no second bonus.
  if v_mastered then
    insert into public.learning_ledger (user_id, kind, word_key, day)
    select v_user, 'mastered', public.learning_word_key(w.lemma, w.part_of_speech), v_today
    from public.words w where w.id = p_word_id
    on conflict do nothing;
    v_mastery_paid := found;
  end if;
  if v_mastery_paid then
    v_bonus := round(coalesce(v_rules.xp_mastered_bonus, 50) * v_multiplier);
  end if;

  update public.user_words
  set box = v_new_box,
      due_on = v_today + v_interval,
      last_reviewed_at = now(),
      review_count = review_count + 1
  where user_id = v_user and word_id = p_word_id;

  insert into public.xp_events (user_id, word_id, reason, amount)
  values (v_user, p_word_id, case when p_remembered then 'review_remembered' else 'review_forgot' end, v_xp);

  if v_mastery_paid then
    insert into public.xp_events (user_id, word_id, reason, amount)
    values (v_user, p_word_id, 'word_mastered', v_bonus);
  end if;

  return query select v_new_box, v_today + v_interval, v_xp + v_bonus, v_mastered, true;
end;
$$;

revoke all on function public.review_word(uuid, boolean) from public, anon, authenticated, service_role;
grant execute on function public.review_word(uuid, boolean) to authenticated, service_role;

-- ---------------------------------------------------------------------
-- forget_known_word: I3, I4, I5, I7. Never raises a new error (the web treats any
-- error as "unexpected"): over today's allowance the word joins the learning
-- queue instead, and introduce_new_words starts it on a later day.
-- ---------------------------------------------------------------------
create or replace function public.forget_known_word(p_word_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_key text;
  v_today date := public.learning_today();
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  perform public.learning_lock(v_user);

  select public.learning_word_key(w.lemma, w.part_of_speech) into v_key
  from public.user_words uw
  join public.words w on w.id = uw.word_id
  where uw.user_id = v_user and uw.word_id = p_word_id and uw.known
  for update of uw;

  if not found then
    return;  -- as before: not a known word of mine → nothing happens
  end if;

  if public.learning_fits_today(v_user, 'introduced', array[v_key], public.plan_new_words_limit(public.my_plan())) then
    update public.user_words
    set known = false, due_on = v_today, introduced_on = v_today, box = 1
    where user_id = v_user and word_id = p_word_id;
    perform public.learning_record(v_user, 'introduced', array[v_key]);
  else
    update public.user_words
    set known = false, due_on = null, introduced_on = null, box = 1
    where user_id = v_user and word_id = p_word_id;
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- triage_word: I2, I4, I5, I7 (the known path is unchanged; award_known_word_xp does I8)
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
  v_key text;
  v_today date := public.learning_today();
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

  perform public.learning_lock(v_user);
  v_key := public.learning_word_key_of(p_word_id);
  v_limit := public.plan_new_words_limit(public.my_plan());
  if not public.learning_fits_today(v_user, 'introduced', array[v_key], v_limit) then
    raise exception 'daily_limit' using errcode = 'P0001';
  end if;

  insert into public.user_words (user_id, word_id, due_on, introduced_on, box)
  values (v_user, p_word_id, v_today, v_today, 1)
  on conflict (user_id, word_id) do nothing;
  get diagnostics v_added = row_count;
  if v_added > 0 then
    perform public.learning_record(v_user, 'introduced', array[v_key]);
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- award_known_word_xp (service role / definer callers only): I5, I7, I8
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
  perform public.learning_lock(p_user);  -- INTEGRITY: I7 (the daily cap below is a count)

  if (
    select count(*) from public.xp_events x
    where x.user_id = p_user and x.reason = 'word_known'
      and x.created_at >= (public.learning_today()::timestamp at time zone 'utc')  -- INTEGRITY: I5
  ) >= 50 then
    return 0;
  end if;

  -- INTEGRITY: I8. Once per logical word, ever: removing and re-adding it pays nothing.
  insert into public.learning_ledger (user_id, kind, word_key, day)
  select p_user, 'known', public.learning_word_key(w.lemma, w.part_of_speech), public.learning_today()
  from public.words w where w.id = p_word_id
  on conflict do nothing;
  if not found then
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

-- ---------------------------------------------------------------------
-- add_dictionary_word: I2, I4, I5, I7 (validation and word creation unchanged)
-- ---------------------------------------------------------------------
create or replace function public.add_dictionary_word(p_lemma text, p_known boolean, p_part_of_speech text default ''::text, p_ipa text default null::text, p_definition text default null::text, p_example text default null::text, p_language text default null::text, p_translation text default null::text, p_alternatives text[] default '{}'::text[])
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
  v_key text;
  v_today date := public.learning_today();
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
  v_key := public.learning_word_key(v_entry.lemma, v_pos);
  if not p_known then
    perform public.learning_lock(v_user);
    v_limit := public.plan_new_words_limit(public.my_plan());
    if not public.learning_fits_today(v_user, 'introduced', array[v_key], v_limit) then  -- INTEGRITY: I4
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
    values (v_user, v_word, v_today, v_today, 1)
    on conflict (user_id, word_id) do nothing;
    get diagnostics v_added = row_count;
    if v_added > 0 then
      perform public.learning_record(v_user, 'introduced', array[v_key]);
    end if;
  end if;
  return v_word;
end;
$$;

-- ---------------------------------------------------------------------
-- add_custom_word: I2, I4, I5, I7 (validation and word creation unchanged)
-- ---------------------------------------------------------------------
create or replace function public.add_custom_word(p_lemma text, p_part_of_speech text, p_language text, p_translation text, p_alternatives text[] default '{}'::text[], p_example text default null::text, p_ipa text default null::text)
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
  v_plan text := public.my_plan();
  v_custom_limit integer := public.plan_custom_words_limit(v_plan);
  v_new_limit integer := public.plan_new_words_limit(v_plan);
  v_word uuid;
  v_created boolean;
  v_added integer;
  v_key text;
  v_today date := public.learning_today();
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
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
  perform public.learning_lock(v_user);
  v_key := public.learning_word_key(v_lemma, v_pos);
  -- INTEGRITY: I4. Both limits come from the ledger: deleting a custom word frees nothing.
  if not public.learning_fits_today(v_user, 'custom', array[v_key], v_custom_limit) then
    raise exception 'daily_limit' using errcode = 'P0001';
  end if;
  if not public.learning_fits_today(v_user, 'introduced', array[v_key], v_new_limit) then
    raise exception 'daily_limit' using errcode = 'P0001';
  end if;
  insert into public.words (lemma, part_of_speech, ipa, example, source, owner_id)
  values (v_lemma, v_pos, nullif(btrim(p_ipa), ''), nullif(btrim(p_example), ''), 'manual', v_user)
  on conflict (lemma, part_of_speech, owner_id) do update
    set ipa = coalesce(excluded.ipa, public.words.ipa),
        example = coalesce(excluded.example, public.words.example)
  returning id, (xmax = 0) into v_word, v_created;
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
  values (v_user, v_word, v_today, v_today, 1)
  on conflict (user_id, word_id) do nothing;
  get diagnostics v_added = row_count;
  if v_created then
    perform public.learning_record(v_user, 'custom', array[v_key]);
  end if;
  if v_added > 0 then
    perform public.learning_record(v_user, 'introduced', array[v_key]);
  end if;
  return v_word;
end;
$$;

-- ---------------------------------------------------------------------
-- add_words_to_my_list: I2, I4, I5, I7
-- ---------------------------------------------------------------------
create or replace function public.add_words_to_my_list(p_word_ids uuid[], p_start_now boolean default false)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_added integer;
  v_start_now boolean := coalesce(p_start_now, false);
  v_limit integer := public.plan_new_words_limit(public.my_plan());
  v_keys text[];
  v_today date := public.learning_today();
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if p_word_ids is null or cardinality(p_word_ids) = 0 or cardinality(p_word_ids) > 200 then
    raise exception 'invalid_words' using errcode = '22023';
  end if;
  if v_start_now then
    perform public.learning_lock(v_user);
  end if;
  if v_start_now and v_limit is not null then
    -- INTEGRITY: I4. All or nothing, as before, but counted from the ledger.
    v_start_now := public.learning_fits_today(
      v_user, 'introduced',
      array(select public.learning_word_key(w.lemma, w.part_of_speech) from public.words w where w.id = any (p_word_ids)),
      v_limit);
  end if;
  with ins as (
    insert into public.user_words (user_id, word_id, due_on, introduced_on, queue_position)
    select
      v_user,
      w.id,
      case when v_start_now then v_today end,
      case when v_start_now then v_today end,
      min(i.position)
    from public.words w
    join public.word_set_items i on i.word_id = w.id
    join public.word_sets s on s.id = i.set_id and s.is_published
    where w.id = any (p_word_ids) and w.owner_id is null
    group by w.id
    on conflict (user_id, word_id) do nothing
    returning word_id
  )
  select count(*), array_agg(public.learning_word_key_of(ins.word_id)) into v_added, v_keys from ins;
  if v_start_now and v_added > 0 then
    perform public.learning_record(v_user, 'introduced', v_keys);
  end if;
  return v_added;
end;
$$;

-- ---------------------------------------------------------------------
-- introduce_new_words: I2, I4, I5, I7. Re-introducing a word already started
-- today (removed and re-added) is free, as everywhere else.
-- ---------------------------------------------------------------------
create or replace function public.introduce_new_words()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_goal integer;
  v_room integer;
  v_moved integer := 0;
  v_today date := public.learning_today();
  r record;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  perform public.learning_lock(v_user);
  select coalesce(
    (select p.daily_goal from public.profiles p where p.id = v_user),
    public.app_default_daily_goal()
  ) into v_goal;
  v_goal := least(v_goal, coalesce(public.plan_new_words_limit(public.my_plan()), v_goal));
  v_room := greatest(v_goal - public.learning_count_today(v_user, 'introduced'), 0);

  for r in
    select uw.word_id, public.learning_word_key(w.lemma, w.part_of_speech) as k
    from public.user_words uw
    join public.words w on w.id = uw.word_id
    where uw.user_id = v_user and uw.due_on is null and not uw.known
    order by uw.added_at, uw.queue_position
    for update of uw skip locked
  loop
    if not exists (
      select 1 from public.learning_ledger l
      where l.user_id = v_user and l.kind = 'introduced' and l.day = v_today and l.word_key = r.k
    ) then
      exit when v_room <= 0;
      v_room := v_room - 1;
    end if;
    update public.user_words uw
    set due_on = v_today, introduced_on = v_today, box = 1
    where uw.user_id = v_user and uw.word_id = r.word_id;
    perform public.learning_record(v_user, 'introduced', array[r.k]);
    v_moved := v_moved + 1;
  end loop;
  return v_moved;
end;
$$;
