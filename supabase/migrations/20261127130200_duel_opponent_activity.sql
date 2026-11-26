-- Anti-farming addition (proposal only; needs a product decision to ship):
-- a duel counts toward achievements only if the opponent had done at least 50
-- reviews by the time it FINISHED (not their lifetime total today).
-- Run after 20261127130000_duel_achievement_stats.sql. Replaces only
-- duel_opponent_check; the 24 h account age and the per-pair daily cap stay.
--
-- Reviews = xp_events 'review_remembered' / 'review_forgot': written only by
-- review_word (security definer, due words only, server clock); learners can
-- neither insert nor delete them. 'word_known' and 'word_mastered' don't count.
-- Every duel (from 2026-11-20) post-dates the review history (from 2026-11-14),
-- so historical duels are judged on complete data.
--
-- Cost: an index scan on xp_events_user_idx (user_id, created_at desc) from
-- the finish time backwards, stopping at the 50th review (LIMIT 50).
-- Gameplay, scoring and stored unlocks are untouched; a duel that stops
-- counting never removes an unlock already recorded.

create or replace function public.duel_opponent_check(p_them uuid, p_created timestamptz, p_finished timestamptz)
returns text
language sql
stable
set search_path = ''
as $$
  select case
    when not coalesce((select u.created_at from auth.users u where u.id = p_them) <= p_created - interval '24 hours', false) then 'young'
    when (select count(*) from (
            select 1 from public.xp_events x
            where x.user_id = p_them and x.reason in ('review_remembered', 'review_forgot') and x.created_at <= p_finished
            order by x.created_at desc
            limit 50
          ) r) < 50 then 'inactive'
    else 'ok'
  end;
$$;

revoke all on function public.duel_opponent_check(uuid, timestamptz, timestamptz) from public, anon, authenticated, service_role;
