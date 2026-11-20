-- Duel rounds last 7 seconds instead of 5 (more time to read the options).
-- Same functions as 20261120200000_duels.sql; only the round length and
-- the speed-bonus cap change. Grants carry over with create or replace.


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
      round_ends_at = now() + interval '9.5 seconds'
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
      round_ends_at = now() + interval '10 seconds'
    where id = p_duel;
  else
    update public.duels
    set status = case p_action when 'cancel' then 'cancelled' else 'declined' end
    where id = p_duel;
  end if;
  return true;
end;
$$;

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
    points := 10 + round(2 * least(7, greatest(0, extract(epoch from d.round_ends_at - now()))))::integer;
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
