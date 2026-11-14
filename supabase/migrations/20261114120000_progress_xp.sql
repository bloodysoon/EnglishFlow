-- Word levels, learner progress and XP.
--
-- Learners never write these tables directly: there are no insert/update/
-- delete policies. Two functions do the writing and enforce the rules:
--   start_word_set(slug)              adds a published set to my words
--   review_word(word_id, remembered)  answers a due word: moves it between
--                                     Leitner boxes and awards XP
-- So a client cannot grant itself XP or jump a word to the last box.
--
-- The numbers below mirror src/features/leitner/boxes.ts and xp.ts;
-- src/features/leitner/xp.test.ts fails if they drift apart.

-- ---------------------------------------------------------------------
-- Word level (CEFR)
-- ---------------------------------------------------------------------

alter table public.words
  add column cefr_level text check (cefr_level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  -- cefr-j: CEFR-J Wordlist (Tono Lab, TUFS); octanove: Octanove C1/C2
  -- (CC BY-SA 4.0); both must be credited where levels are shown.
  add column level_source text check (level_source in ('cefr-j', 'octanove', 'manual', 'machine'));

-- ---------------------------------------------------------------------
-- My words: one row per learner and word
-- ---------------------------------------------------------------------

create table public.user_words (
  user_id uuid not null references auth.users (id) on delete cascade,
  word_id uuid not null references public.words (id) on delete cascade,
  box smallint not null default 1 check (box between 1 and 5),
  -- Dates are UTC days (current_date on the database).
  due_on date not null default current_date,
  last_reviewed_at timestamptz,
  review_count integer not null default 0 check (review_count >= 0),
  added_at timestamptz not null default now(),
  primary key (user_id, word_id)
);

-- "What is due today for me?"
create index user_words_due_idx on public.user_words (user_id, due_on);

-- ---------------------------------------------------------------------
-- XP: append-only log; a learner's XP is the sum of their events
-- ---------------------------------------------------------------------

create table public.xp_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  word_id uuid references public.words (id) on delete set null,
  reason text not null check (reason in ('review_remembered', 'review_forgot', 'word_mastered')),
  amount integer not null check (amount between 0 and 1000),
  created_at timestamptz not null default now()
);

create index xp_events_user_idx on public.xp_events (user_id, created_at desc);

-- ---------------------------------------------------------------------
-- Row Level Security: learners read only their own rows
-- ---------------------------------------------------------------------

alter table public.user_words enable row level security;
alter table public.xp_events enable row level security;

create policy "Learners read their own words"
  on public.user_words for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Learners read their own XP"
  on public.xp_events for select
  to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- start_word_set: add every word of a published set to my words
-- Returns how many words were new to me.
-- ---------------------------------------------------------------------

create function public.start_word_set(p_slug text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_added integer;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  insert into public.user_words (user_id, word_id)
  select v_user, i.word_id
  from public.word_set_items i
  join public.word_sets s on s.id = i.set_id
  where s.slug = p_slug and s.is_published
  on conflict (user_id, word_id) do nothing;

  get diagnostics v_added = row_count;
  return v_added;
end;
$$;

-- ---------------------------------------------------------------------
-- review_word: answer one due word
-- ---------------------------------------------------------------------

create function public.review_word(p_word_id uuid, p_remembered boolean)
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

  -- Only due words count: no farming XP by repeating one word.
  if v_due > current_date then
    raise exception 'not_due' using errcode = 'P0001';
  end if;

  select w.cefr_level into v_level from public.words w where w.id = p_word_id;

  -- Leitner rule (boxes.ts nextBox): remembered → up one box, max 5;
  -- forgot → back to box 1.
  v_new_box := case when p_remembered then least(v_box + 1, 5) else 1 end;

  -- Review intervals in days (boxes.ts LEITNER_BOXES).
  v_interval := case v_new_box when 1 then 1 when 2 then 3 when 3 then 7 when 4 then 14 when 5 then 30 end;

  -- XP (xp.ts): base per answer × CEFR multiplier, bonus on mastering.
  v_multiplier := case v_level
    when 'A1' then 1
    when 'A2' then 1.2
    when 'B1' then 1.5
    when 'B2' then 2
    when 'C1' then 2.5
    when 'C2' then 3
    else 1
  end;

  v_xp := round((case when p_remembered then 10 else 3 end) * v_multiplier);
  v_mastered := p_remembered and v_box = 4;
  if v_mastered then
    v_bonus := round(50 * v_multiplier);
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

-- Only signed-in learners may call these (Supabase grants functions to
-- everyone by default).
revoke execute on function public.start_word_set(text) from public, anon;
revoke execute on function public.review_word(uuid, boolean) from public, anon;
grant execute on function public.start_word_set(text) to authenticated;
grant execute on function public.review_word(uuid, boolean) to authenticated;
