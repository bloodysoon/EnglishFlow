-- Trusted duel statistics for achievements.
-- PROPOSAL ONLY: not applied anywhere. See ../README.md.
-- Run after the existing chain and backend-proposals/achievements.
-- Changes nothing in duel gameplay, scoring or matchmaking: two read-only
-- functions, no new tables or indexes.
--
--   duel_learner_level(xp)  the apps' learner level (xpForLevel = round(100·(L−1)^1.5))
--   my_duel_stats()         the signed-in learner's duel statistics, eligible duels only

-- ---------------------------------------------------------------------
-- Level from XP, exactly as the apps (statistics.ts learnerLevel).
-- ---------------------------------------------------------------------
create or replace function public.duel_learner_level(p_xp bigint)
returns integer
language plpgsql
immutable
set search_path = ''
as $$
declare
  l integer := floor(power(greatest(coalesce(p_xp, 0), 0) / 100.0, 2.0 / 3.0))::integer + 1;
begin
  -- The float estimate can be one off at a boundary: settle it on the exact rule.
  while l > 1 and round(100 * power(l - 1, 1.5)) > p_xp loop l := l - 1; end loop;
  while round(100 * power(l, 1.5)) <= coalesce(p_xp, 0) loop l := l + 1; end loop;
  return l;
end;
$$;

-- No new index: the existing xp_events_user_idx (user_id, created_at) serves
-- the level-at-finish pass; a covering (… include amount) index measured ~1.5 %
-- faster on 900,000 events, not worth extra writes on a hot table.

-- ---------------------------------------------------------------------
-- Whether a duel's opponent may count: 'ok', or why not. One place, so a
-- later rule (20261127130200_duel_opponent_activity.sql) only replaces this.
-- Account age from auth.users (profiles.created_at is learner-writable).
-- Not callable by API roles; my_duel_stats runs it as the owner.
-- ---------------------------------------------------------------------
create or replace function public.duel_opponent_check(p_them uuid, p_created timestamptz, p_finished timestamptz)
returns text
language sql
stable
set search_path = ''
as $$
  select case
    when coalesce((select u.created_at from auth.users u where u.id = p_them) <= p_created - interval '24 hours', false) then 'ok'
    else 'young'
  end;
$$;

-- ---------------------------------------------------------------------
-- my_duel_stats(): everything the duel achievements need, as aggregates.
--
-- Facts, all server-written by the duel functions (never from a client):
-- duels (players, league, scores, winner, created/finished times),
-- duel_answers (choice, points: 10 + round(2 × seconds left, max 7), round 10
-- doubled; 0 when wrong), duel_rounds (the correct option), auth.users
-- (account age; profiles.created_at is learner-writable, so not used),
-- friend_events (when a friendship began), xp_events (levels at a duel's end).
--
-- An ELIGIBLE duel (the only kind that counts):
--   1. status 'finished';
--   2. both players answered at least 5 rounds;
--   3. the opponent passes duel_opponent_check (account 24 h old when the
--      duel was created; see 20261127130200 for the proposed activity rule);
--   4. among duels passing 1–3, at most the first 5 per opponent per UTC day
--      (by finish time).
-- Sequences (streaks, revenge, rematch, phoenix) run over eligible duels only.
--
-- Security definer (duel_answers and duel_rounds aren't readable by
-- learners), scoped to auth.uid(), no parameters, aggregates only: no other
-- learner's answers, scores, levels or ids leave this function.
-- ---------------------------------------------------------------------
create or replace function public.my_duel_stats()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
with me as (
  select auth.uid() as id
),
mine as (
  select d.id, d.league, d.created_at, d.finished_at,
         d.challenger = me.id as started,
         case when d.challenger = me.id then d.opponent else d.challenger end as them,
         case when d.challenger = me.id then d.challenger_score else d.opponent_score end as my_score,
         case when d.challenger = me.id then d.opponent_score else d.challenger_score end as their_score,
         case when d.winner is null then 0 when d.winner = me.id then 1 else -1 end as result
  from public.duels d
  cross join me
  where me.id is not null and d.status = 'finished' and me.id in (d.challenger, d.opponent)
),
answers as (
  select a.duel_id,
         count(*) filter (where a.user_id = m.them) as their_answers,
         count(*) filter (where a.user_id <> m.them) as my_answers,
         count(*) filter (where a.user_id <> m.them and a.choice = r.correct) as my_correct,
         -- "6 or more seconds left": points only give seconds to ±0.25 s, so
         -- base 23+ (≥ 6.25 s) guarantees it; base 22 (5.75–6.25 s) does not count.
         count(*) filter (where a.user_id <> m.them and a.choice = r.correct
                            and a.points >= case when a.round = 10 then 46 else 23 end) as my_fast,
         coalesce(sum(a.points) filter (where a.user_id <> m.them and a.round <= 5), 0) as my_r5,
         coalesce(sum(a.points) filter (where a.user_id = m.them and a.round <= 5), 0) as their_r5,
         coalesce(sum(a.points) filter (where a.user_id <> m.them and a.round <= 9), 0) as my_r9,
         coalesce(sum(a.points) filter (where a.user_id = m.them and a.round <= 9), 0) as their_r9
  from mine m
  join public.duel_answers a on a.duel_id = m.id
  join public.duel_rounds r on r.duel_id = a.duel_id and r.round = a.round
  group by a.duel_id
),
checked as (
  select m.*,
         coalesce(x.my_answers, 0) as my_answers, coalesce(x.their_answers, 0) as their_answers,
         coalesce(x.my_correct, 0) as my_correct, coalesce(x.my_fast, 0) as my_fast,
         coalesce(x.my_r5, 0) as my_r5, coalesce(x.their_r5, 0) as their_r5,
         coalesce(x.my_r9, 0) as my_r9, coalesce(x.their_r9, 0) as their_r9,
         coalesce(x.my_answers, 0) >= 5 and coalesce(x.their_answers, 0) >= 5 as answered_ok,
         public.duel_opponent_check(m.them, m.created_at, m.finished_at) as opponent
  from mine m
  left join answers x on x.duel_id = m.id
),
capped as (
  select c.*,
         row_number() over (partition by c.them, (c.finished_at at time zone 'utc')::date order by c.finished_at, c.id) as nth_today
  from checked c
  where c.answered_ok and c.opponent = 'ok'
),
ok as (
  select c.*,
         (c.finished_at at time zone 'utc')::date as day,
         lag(c.result) over (partition by c.them order by c.finished_at, c.id) as prev_vs_them,
         lag(c.finished_at) over (partition by c.them order by c.finished_at, c.id) as prev_finish_vs_them,
         lag(c.result, 1) over (order by c.finished_at, c.id) as prev1,
         lag(c.result, 2) over (order by c.finished_at, c.id) as prev2,
         lag(c.result, 3) over (order by c.finished_at, c.id) as prev3,
         -- Win streak islands: a new island after every draw or loss.
         sum(case when c.result = 1 then 0 else 1 end) over (order by c.finished_at, c.id) as island
  from capped c
  where c.nth_today <= 5
),
streaks as (
  select coalesce(max(n), 0) as best
  from (select island, count(*) filter (where result = 1) as n from ok group by island) s
),
per_friend as (
  select them, count(*) as duels, count(distinct day) as days from ok group by them
),
butterfly as (
  -- The most different friends duelled within any 7-day window.
  select coalesce(max(n), 0) as best
  from (
    select (select count(distinct o2.them) from ok o2
            where o2.finished_at > o.finished_at - interval '7 days' and o2.finished_at <= o.finished_at) as n
    from ok o
  ) w
),
-- Levels when a won duel ended. One pass instead of two XP sums per win:
-- the XP events of the players involved, merged with a marker at each win's
-- finish, running totals per player (an event at the exact finish time
-- counts: events sort before markers at the same instant).
win_marks as (
  select o.id, o.them, o.finished_at from ok o where o.result = 1
),
stream as (
  select x.user_id as uid, x.created_at as t, x.amount, null::uuid as duel
  from public.xp_events x
  where x.user_id in (select them from win_marks union select id from me)
    and x.created_at <= (select max(finished_at) from win_marks)
  union all
  select w.them, w.finished_at, 0, w.id from win_marks w
  union all
  select me.id, w.finished_at, 0, w.id from win_marks w cross join me
),
running as (
  select uid, duel, sum(amount) over (partition by uid order by t, duel is not null) as xp
  from stream
),
upsets as (
  select count(*) as n
  from win_marks w
  cross join me
  join running theirs on theirs.duel = w.id and theirs.uid = w.them
  join running mine on mine.duel = w.id and mine.uid = me.id
  where public.duel_learner_level(theirs.xp) >= public.duel_learner_level(mine.xp) + 10
),
ice as (
  -- A duel finished within 24 h of the friendship (its latest start before the duel).
  select count(*) as n
  from ok o
  cross join me
  where o.finished_at - (select max(fe.created_at) from public.friend_events fe
                         where fe.user_id = me.id and fe.friend_id = o.them and fe.created_at <= o.created_at) <= interval '24 hours'
)
select jsonb_build_object(
  'version', 1,
  'played', (select count(*) from ok),
  'wins', (select count(*) from ok where result = 1),
  'losses', (select count(*) from ok where result = -1),
  'draws', (select count(*) from ok where result = 0),
  'best_win_streak', (select best from streaks),
  'distinct_opponents', (select count(distinct them) from ok),
  'wins_beginner', (select count(*) from ok where result = 1 and league = 'beginner'),
  'wins_intermediate', (select count(*) from ok where result = 1 and league = 'intermediate'),
  'wins_advanced', (select count(*) from ok where result = 1 and league = 'advanced'),
  'correct_answers', (select coalesce(sum(my_correct), 0) from ok),
  'perfect_duels', (select count(*) from ok where my_correct = 10),
  'max_score', (select coalesce(max(my_score), 0) from ok),
  'comeback_wins', (select count(*) from ok where result = 1 and my_r5 < their_r5),
  'final_blow_wins', (select count(*) from ok where result = 1 and my_r9 <= their_r9),
  'shutout_wins', (select count(*) from ok where result = 1 and their_score = 0),
  'max_vs_one', (select coalesce(max(duels), 0) from per_friend),
  'max_days_vs_one', (select coalesce(max(days), 0) from per_friend),
  'rematches', (select count(*) from ok where prev_finish_vs_them is not null
                  and created_at >= prev_finish_vs_them and created_at - prev_finish_vs_them <= interval '10 minutes'),
  'revenge_wins', (select count(*) from ok where result = 1 and prev_vs_them = -1),
  'phoenix_wins', (select count(*) from ok where result = 1 and prev1 = -1 and prev2 = -1 and prev3 = -1),
  'as_opponent', (select count(*) from ok where not started),
  'as_challenger', (select count(*) from ok where started),
  'duel_days', (select count(distinct day) from ok),
  'fast_correct', (select coalesce(sum(my_fast), 0) from ok),
  'clutch_wins', (select count(*) from ok where result = 1 and my_score - their_score <= 10),
  'dominant_wins', (select count(*) from ok where result = 1 and my_score - their_score >= 100),
  'upset_wins', (select n from upsets),
  'first_day_duels', (select n from ice),
  'max_friends_in_7_days', (select best from butterfly),
  -- Transparency: what didn't count, and why (never counted as zero progress).
  'finished_total', (select count(*) from mine),
  'excluded_short', (select count(*) from checked where not answered_ok),
  'excluded_young_opponent', (select count(*) from checked where answered_ok and opponent = 'young'),
  'excluded_inactive_opponent', (select count(*) from checked where answered_ok and opponent = 'inactive'),
  'excluded_daily_cap', (select count(*) from capped where nth_today > 5)
)
from me
where me.id is not null;
$$;

revoke all on function public.my_duel_stats() from public, anon;
grant execute on function public.my_duel_stats() to authenticated, service_role;
revoke all on function public.duel_opponent_check(uuid, timestamptz, timestamptz) from public, anon, authenticated, service_role;
revoke all on function public.duel_learner_level(bigint) from public, anon;
grant execute on function public.duel_learner_level(bigint) to authenticated, service_role;
