-- Marks the 45 duel-dependent achievement units as computed by the server
-- from my_duel_stats(), so achievement_grant may store them.
-- PROPOSAL ONLY. Run after 20261127130000_duel_achievement_stats.sql (and
-- the achievements proposal's catalog seed).
--
-- These are every catalog-v1 unit whose `needs` include "duel-stats": the 40
-- Duels units plus friendFirstDuel, friendButterfly, friendLoyal (Friends)
-- and duelPhoenix, duelUpset (Special). tests/integration.mjs checks this
-- list against src/features/achievements/catalog.ts.
--
-- Before shipping, set the same units' readiness to "server" in the app
-- catalog (catalog.ts), so a later catalog seed keeps them server-ready.

select set_config('achievements.maintenance', 'on', false);

update public.achievement_catalog c set readiness = 'server'
from (values
  ('track:duelsPlayed:1'),
  ('track:duelsPlayed:2'),
  ('track:duelsPlayed:3'),
  ('track:duelsPlayed:4'),
  ('track:duelsPlayed:5'),
  ('track:duelsPlayed:6'),
  ('track:duelWins:1'),
  ('track:duelWins:2'),
  ('track:duelWins:3'),
  ('track:duelWins:4'),
  ('track:duelWins:5'),
  ('track:duelWins:6'),
  ('track:duelWins:7'),
  ('track:duelWinStreak:1'),
  ('track:duelWinStreak:2'),
  ('track:duelWinStreak:3'),
  ('track:duelOpponents:1'),
  ('track:duelOpponents:2'),
  ('track:duelOpponents:3'),
  ('track:duelCorrect:1'),
  ('track:duelCorrect:2'),
  ('track:duelCorrect:3'),
  ('badge:duelWinBeginner'),
  ('badge:duelWinIntermediate'),
  ('badge:duelWinAdvanced'),
  ('badge:duelPerfect'),
  ('badge:duelLightning'),
  ('badge:duelComeback'),
  ('badge:duelFinalBlow'),
  ('badge:duelShutout'),
  ('badge:duelDraw'),
  ('badge:duelRivalry'),
  ('badge:duelRematch'),
  ('badge:duelRevenge'),
  ('badge:duelGracious'),
  ('badge:duelChallenger'),
  ('badge:duelDaily'),
  ('badge:duelSpeedster'),
  ('badge:duelClutch'),
  ('badge:duelDominant'),
  ('badge:friendFirstDuel'),
  ('badge:friendButterfly'),
  ('badge:friendLoyal'),
  ('badge:duelPhoenix'),
  ('badge:duelUpset')
) as v (id)
where c.id = v.id;

do $$
begin
  if (select count(*) from public.achievement_catalog where readiness = 'server') <> 45 then
    raise exception 'expected 45 server-ready duel units';
  end if;
end $$;

select set_config('achievements.maintenance', '', false);
