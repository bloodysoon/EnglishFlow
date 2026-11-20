-- Inventory (src/features/rewards). Run after 20261120120000_level_rewards.sql.

-- ---------------------------------------------------------------------
-- Inventory: the title and avatar frame the learner chose. Null follows
-- the level (newest unlocked); frame 'none' hides it. The app checks the
-- choice is unlocked before saving (src/features/rewards).
-- ---------------------------------------------------------------------

alter table public.profiles
  add column if not exists equipped_title text,
  add column if not exists equipped_frame text;

alter table public.profiles drop constraint if exists profiles_equipped_title_check;
alter table public.profiles
  add constraint profiles_equipped_title_check check (equipped_title ~ '^[a-zA-Z]{1,30}$');

alter table public.profiles drop constraint if exists profiles_equipped_frame_check;
alter table public.profiles
  add constraint profiles_equipped_frame_check
    check (equipped_frame in ('none', 'bronze', 'silver', 'gold', 'platinum', 'diamond'));
