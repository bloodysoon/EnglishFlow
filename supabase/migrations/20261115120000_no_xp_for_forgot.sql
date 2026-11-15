-- "Forgot" earns no XP: the word drops back to box 1 and that is the
-- whole answer. Admins can still raise it in the admin panel (0–100).
-- Keep in sync with DEFAULT_XP_RULES.forgot in src/features/leitner/xp.ts.
-- Run after 20261114220000_known_word_xp.sql. Safe to run more than once.

alter table public.xp_rules alter column xp_forgot set default 0;
update public.xp_rules set xp_forgot = 0, updated_at = now();

-- review_word: as in 20261114150000_learning.sql, with 0 as the "forgot"
-- fallback when the rules row is missing. Grants carry over.

create or replace function public.review_word(p_word_id uuid, p_remembered boolean)
returns table (new_box smallint, next_due_on date, xp_awarded integer, mastered boolean)
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
  if v_due is null or v_due > current_date then
    raise exception 'not_due' using errcode = 'P0001';
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

  v_xp := round(
    (case when p_remembered then coalesce(v_rules.xp_remembered, 10) else coalesce(v_rules.xp_forgot, 0) end)
    * v_multiplier
  );
  v_mastered := p_remembered and v_box = 4;
  if v_mastered then
    v_bonus := round(coalesce(v_rules.xp_mastered_bonus, 50) * v_multiplier);
  end if;

  update public.user_words
  set box = v_new_box,
      due_on = current_date + v_interval,
      last_reviewed_at = now(),
      review_count = review_count + 1
  where user_id = v_user and word_id = p_word_id;

  insert into public.xp_events (user_id, word_id, reason, amount)
  values (v_user, p_word_id, case when p_remembered then 'review_remembered' else 'review_forgot' end, v_xp);

  if v_mastered then
    insert into public.xp_events (user_id, word_id, reason, amount)
    values (v_user, p_word_id, 'word_mastered', v_bonus);
  end if;

  return query select v_new_box, current_date + v_interval, v_xp + v_bonus, v_mastered;
end;
$$;
