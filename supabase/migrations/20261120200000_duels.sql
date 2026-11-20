-- Duels (src/features/duels). Run after 20261120190000_friend_events.sql.
--
-- Real-time vocabulary duels between friends: 10 rounds, 5 seconds each.
-- Each round shows a word in the player's language and four English
-- options. The database is the referee: it picks the words, keeps the
-- right answer hidden until the round closes, stamps every answer with
-- its own clock and scores it. Browsers only show the state and send a
-- choice, so a player cannot read the answer or fake their speed.
--
-- There is no game server: a round closes when both answered, or when a
-- player asks for the state after the deadline (duel_state settles it).
-- Finished duels stay as history and will feed league leaderboards.
--
-- Scoring: right = 10 + up to 10 for speed, last round doubled; wrong or
-- no answer = 0.

create table if not exists public.duels (
  id uuid primary key default gen_random_uuid(),
  challenger uuid not null references public.profiles (id) on delete cascade,
  opponent uuid not null references public.profiles (id) on delete cascade,
  league text not null check (league in ('beginner', 'intermediate', 'advanced')),
  status text not null default 'invited'
    check (status in ('invited', 'active', 'finished', 'declined', 'cancelled', 'expired')),
  round smallint not null default 0 check (round between 0 and 10),
  -- Answers in for the current round (0–2); both in closes it early.
  answered smallint not null default 0,
  round_starts_at timestamptz,
  round_ends_at timestamptz,
  challenger_score integer not null default 0,
  opponent_score integer not null default 0,
  -- Null on a finished duel means a draw.
  winner uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  finished_at timestamptz,
  check (challenger <> opponent)
);

create index if not exists duels_challenger_idx on public.duels (challenger, created_at desc);
create index if not exists duels_opponent_idx on public.duels (opponent, created_at desc);

-- Players read their own duels (Realtime needs this to deliver changes);
-- every write goes through the functions below.
alter table public.duels enable row level security;
revoke all on public.duels from anon, authenticated;
grant select on public.duels to authenticated;

drop policy if exists "Players read their duels" on public.duels;
create policy "Players read their duels" on public.duels
  for select to authenticated
  using ((select auth.uid()) in (challenger, opponent));

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'duels'
  ) then
    alter publication supabase_realtime add table public.duels;
  end if;
end;
$$;

-- The questions. Hidden from browsers: duel_state hands out a round's
-- options only once it starts, and the answer only once it closes.
create table if not exists public.duel_rounds (
  duel_id uuid not null references public.duels (id) on delete cascade,
  round smallint not null check (round between 1 and 10),
  lemma text not null,
  prompt_ru text not null,
  prompt_ro text not null,
  options text[] not null check (cardinality(options) = 4),
  correct smallint not null check (correct between 0 and 3),
  primary key (duel_id, round)
);

alter table public.duel_rounds enable row level security;
revoke all on public.duel_rounds from anon, authenticated;

create table if not exists public.duel_answers (
  duel_id uuid not null references public.duels (id) on delete cascade,
  round smallint not null check (round between 1 and 10),
  user_id uuid not null references public.profiles (id) on delete cascade,
  choice smallint not null check (choice between 0 and 3),
  points integer not null default 0,
  answered_at timestamptz not null default now(),
  primary key (duel_id, round, user_id)
);

alter table public.duel_answers enable row level security;
revoke all on public.duel_answers from anon, authenticated;

-- ---------------------------------------------------------------------
-- Internal helpers (no grants: only the functions below call them).
-- ---------------------------------------------------------------------

-- "дом; жильё" → {дом, жильё}: the meanings two words must not share,
-- so a wrong option is never also right (house / home both mean "дом").
create or replace function public.duel_meanings(p text)
returns text[]
language sql
immutable
set search_path = ''
as $$
  select coalesce(array_agg(btrim(m)) filter (where btrim(m) <> ''), '{}')
  from unnest(regexp_split_to_array(lower(p), ';')) m;
$$;

-- Adds this round's points to the scores and opens the next round, or
-- ends the duel after the last one (or early, when p_end: abandoned).
-- Caller holds the duel's row lock.
create or replace function public.duel_close_round(p_duel uuid, p_end boolean default false)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  d public.duels;
  c integer;
  o integer;
begin
  select * into d from public.duels where id = p_duel;

  select
    d.challenger_score + coalesce(sum(a.points) filter (where a.user_id = d.challenger), 0),
    d.opponent_score + coalesce(sum(a.points) filter (where a.user_id = d.opponent), 0)
  into c, o
  from public.duel_answers a
  where a.duel_id = p_duel and a.round = d.round;

  if d.round < 10 and not p_end then
    -- 2.5 s to show the answer before the next word.
    update public.duels set
      challenger_score = c, opponent_score = o, answered = 0, round = round + 1,
      round_starts_at = now() + interval '2.5 seconds',
      round_ends_at = now() + interval '7.5 seconds'
    where id = p_duel;
  else
    update public.duels set
      challenger_score = c, opponent_score = o, answered = 0,
      status = 'finished', finished_at = now(),
      winner = case when c > o then d.challenger when o > c then d.opponent end
    where id = p_duel;
  end if;
end;
$$;

-- Moves a duel on when time has passed: an unanswered invite expires after
-- 5 minutes, a round closes 0.4 s after its deadline (network slack), and
-- a duel nobody is watching (30 s past a deadline) ends as it stands.
create or replace function public.duel_settle(p_duel uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  d public.duels;
begin
  select * into d from public.duels where id = p_duel for update;
  if not found then return; end if;

  if d.status = 'invited' and d.created_at < now() - interval '5 minutes' then
    update public.duels set status = 'expired' where id = p_duel;
  elsif d.status = 'active' and now() > d.round_ends_at + interval '400 milliseconds' then
    perform public.duel_close_round(p_duel, now() > d.round_ends_at + interval '30 seconds');
  end if;
end;
$$;

-- Settles all my open duels, so lists and the "one duel at a time" rule
-- never see a stale one.
create or replace function public.duel_settle_mine()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  open_id uuid;
begin
  for open_id in
    select id from public.duels
    where auth.uid() in (challenger, opponent) and status in ('invited', 'active')
  loop
    perform public.duel_settle(open_id);
  end loop;
end;
$$;

-- Picks the 10 words: 4 from the league's lower level, then 6 from the
-- upper one, each with 3 wrong options from the same level, preferring
-- the same part of speech and a shared topic, never a shared meaning.
-- shortcut: order by random() scans a level (≤2.5k rows) per word; fine
-- for this list size, revisit if the dictionary grows a lot.
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
         and e.translation_ru is not null and e.translation_ro is not null
       order by random() limit 4)
      union all
      (select e.*, 2 as part from public.dictionary_entries e
       where e.cefr_level = levels[2] and e.part_of_speech in ('noun', 'verb', 'adj', 'adv')
         and e.translation_ru is not null and e.translation_ro is not null
       order by random() limit 6)
    ) picked
    order by part
  loop
    select array_agg(x.lemma) into wrong
    from (
      select o.lemma from public.dictionary_entries o
      where o.cefr_level = w.cefr_level and o.lemma <> w.lemma
        and o.translation_ru is not null and o.translation_ro is not null
        and not (public.duel_meanings(o.translation_ru) && public.duel_meanings(w.translation_ru))
        and not (public.duel_meanings(o.translation_ro) && public.duel_meanings(w.translation_ro))
      order by (o.part_of_speech = w.part_of_speech) desc, (o.topics && w.topics) desc, random()
      limit 3
    ) x;

    n := n + 1;
    correct := floor(random() * 4)::smallint;
    insert into public.duel_rounds (duel_id, round, lemma, prompt_ru, prompt_ro, options, correct)
    values (
      p_duel, n, w.lemma, w.translation_ru, w.translation_ro,
      wrong[1:correct] || w.lemma || wrong[correct + 1:3],
      correct
    );
  end loop;

  if n < 10 then raise exception 'duel_no_words' using errcode = 'P0001'; end if;
end;
$$;

revoke all on function public.duel_meanings(text) from public, anon, authenticated;
revoke all on function public.duel_close_round(uuid, boolean) from public, anon, authenticated;
revoke all on function public.duel_settle(uuid) from public, anon, authenticated;
revoke all on function public.duel_settle_mine() from public, anon, authenticated;
revoke all on function public.duel_make_rounds(uuid, text) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- duel_invite: challenge a friend. One open duel per player at a time.
-- Errors: duel_invalid, duel_not_friends, duel_busy (me or them).
-- ---------------------------------------------------------------------
create or replace function public.duel_invite(p_friend uuid, p_league text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  new_id uuid;
begin
  if me is null then raise exception 'not authenticated'; end if;
  if p_friend is null or p_friend = me or p_league not in ('beginner', 'intermediate', 'advanced') then
    raise exception 'duel_invalid' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.friendships
    where status = 'accepted'
      and ((requester = me and addressee = p_friend) or (requester = p_friend and addressee = me))
  ) then
    raise exception 'duel_not_friends' using errcode = 'P0001';
  end if;

  perform public.duel_settle_mine();
  -- Their open duels may be stale too.
  perform public.duel_settle(id) from public.duels
  where p_friend in (challenger, opponent) and status in ('invited', 'active');

  -- An invite from them to me is not "busy": I may still answer it, but
  -- a second open duel for either of us is.
  if exists (
    select 1 from public.duels
    where status = 'active' and (me in (challenger, opponent) or p_friend in (challenger, opponent))
  ) or exists (
    select 1 from public.duels where status = 'invited' and challenger in (me, p_friend)
  ) then
    raise exception 'duel_busy' using errcode = 'P0001';
  end if;

  insert into public.duels (challenger, opponent, league)
  values (me, p_friend, p_league)
  returning id into new_id;
  return new_id;
end;
$$;

-- ---------------------------------------------------------------------
-- duel_respond: the opponent accepts or declines an invite; the
-- challenger cancels it. Returns false when the invite is no longer open.
-- Accepting builds the rounds and starts round 1 in 3 seconds.
-- ---------------------------------------------------------------------
create or replace function public.duel_respond(p_duel uuid, p_action text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  d public.duels;
begin
  if me is null then raise exception 'not authenticated'; end if;
  if p_action not in ('accept', 'decline', 'cancel') then
    raise exception 'duel_invalid' using errcode = '22023';
  end if;

  perform public.duel_settle(p_duel);
  select * into d from public.duels where id = p_duel for update;
  if not found or d.status <> 'invited'
     or (p_action = 'cancel' and d.challenger <> me)
     or (p_action <> 'cancel' and d.opponent <> me) then
    return false;
  end if;

  if p_action = 'accept' then
    -- I may have an active duel of my own by now.
    if exists (select 1 from public.duels where status = 'active' and me in (challenger, opponent)) then
      raise exception 'duel_busy' using errcode = 'P0001';
    end if;
    perform public.duel_make_rounds(p_duel, d.league);
    update public.duels set
      status = 'active', round = 1,
      round_starts_at = now() + interval '3 seconds',
      round_ends_at = now() + interval '8 seconds'
    where id = p_duel;
  else
    update public.duels
    set status = case p_action when 'cancel' then 'cancelled' else 'declined' end
    where id = p_duel;
  end if;
  return true;
end;
$$;

-- ---------------------------------------------------------------------
-- duel_answer: my choice for the current round. Ignored (no error) when
-- the round already moved on, I already answered, or it is too late:
-- a click that lost a race is not a failure. Points come from the
-- database clock, never the browser's.
-- ---------------------------------------------------------------------
create or replace function public.duel_answer(p_duel uuid, p_round smallint, p_choice smallint)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  d public.duels;
  right_choice smallint;
  points integer := 0;
begin
  if me is null then raise exception 'not authenticated'; end if;
  if p_choice is null or p_choice not between 0 and 3 then
    raise exception 'duel_invalid' using errcode = '22023';
  end if;

  select * into d from public.duels
  where id = p_duel and me in (challenger, opponent)
  for update;
  if not found or d.status <> 'active' or d.round <> p_round
     or now() < d.round_starts_at
     or now() > d.round_ends_at + interval '400 milliseconds' then
    return;
  end if;

  select r.correct into right_choice from public.duel_rounds r where r.duel_id = p_duel and r.round = p_round;
  if p_choice = right_choice then
    points := 10 + round(2 * least(5, greatest(0, extract(epoch from d.round_ends_at - now()))))::integer;
    if p_round = 10 then points := points * 2; end if;
  end if;

  insert into public.duel_answers (duel_id, round, user_id, choice, points)
  values (p_duel, p_round, me, p_choice, points)
  on conflict do nothing;
  if not found then return; end if;

  if d.answered + 1 >= 2 then
    perform public.duel_close_round(p_duel);
  else
    update public.duels set answered = answered + 1 where id = p_duel;
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- duel_state: everything my screen needs, as JSON. Settles the duel
-- first, so asking after a deadline is what closes the round.
--   question  the current round's prompt (in my translation language)
--             and options, only once the round has started
--   my_choice my answer this round, if any
--   rounds    every closed round with the answer, both choices and points
-- ---------------------------------------------------------------------
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
      select jsonb_build_object('prompt', case when lang = 'ro' then r.prompt_ro else r.prompt_ru end, 'options', r.options)
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
        'prompt', case when lang = 'ro' then r.prompt_ro else r.prompt_ru end,
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

-- ---------------------------------------------------------------------
-- duels_list: my duels, newest first (history and open invites).
-- ---------------------------------------------------------------------
create or replace function public.duels_list()
returns table (
  id uuid,
  league text,
  status text,
  is_challenger boolean,
  them_username text,
  my_score integer,
  their_score integer,
  result text,
  created_at timestamptz
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  perform public.duel_settle_mine();

  return query
  select
    d.id,
    d.league,
    d.status,
    d.challenger = auth.uid(),
    p.username,
    case when d.challenger = auth.uid() then d.challenger_score else d.opponent_score end,
    case when d.challenger = auth.uid() then d.opponent_score else d.challenger_score end,
    case
      when d.status <> 'finished' then null
      when d.winner is null then 'draw'
      when d.winner = auth.uid() then 'win'
      else 'loss'
    end,
    d.created_at
  from public.duels d
  join public.profiles p on p.id = case when d.challenger = auth.uid() then d.opponent else d.challenger end
  where auth.uid() in (d.challenger, d.opponent)
  order by d.created_at desc
  limit 50;
end;
$$;

revoke all on function public.duel_invite(uuid, text) from public, anon;
revoke all on function public.duel_respond(uuid, text) from public, anon;
revoke all on function public.duel_answer(uuid, smallint, smallint) from public, anon;
revoke all on function public.duel_state(uuid) from public, anon;
revoke all on function public.duels_list() from public, anon;
grant execute on function public.duel_invite(uuid, text) to authenticated;
grant execute on function public.duel_respond(uuid, text) to authenticated;
grant execute on function public.duel_answer(uuid, smallint, smallint) to authenticated;
grant execute on function public.duel_state(uuid) to authenticated;
grant execute on function public.duels_list() to authenticated;
