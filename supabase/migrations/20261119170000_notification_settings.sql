-- Which notifications the learner wants in the bell (src/features/notifications).
-- Run after 20261119160000_public_profiles.sql. Everything on by default;
-- keys the app does not know yet are ignored, missing ones count as on.

alter table public.profiles
  add column if not exists notification_prefs jsonb not null
    default '{"dueWords": true, "badges": true, "milestones": true}'::jsonb;
