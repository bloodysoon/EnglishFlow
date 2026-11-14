-- Learner settings that should follow the account across devices.
-- (Theme and interface language stay in cookies: they also apply before
-- anyone logs in.)
--
-- public.profiles already exists in this project:
--   id uuid (= auth.users.id), display_name, avatar_url, created_at
--   RLS on; policies "Users can read own profile" (select) and
--   "Users can update own profile" (update)
--   trigger on_auth_user_created inserts a row for every new user
-- So this migration only adds columns, constraints and missing rows. It
-- is safe to run more than once.

alter table public.profiles
  -- Which language word cards translate into.
  add column if not exists translation_language text not null default 'ru',
  -- New words per day.
  add column if not exists daily_goal smallint not null default 10,
  add column if not exists updated_at timestamptz not null default now();

-- The update policy lets learners write their own row, so the database
-- (not only the app) must keep these values valid.
alter table public.profiles drop constraint if exists profiles_translation_language_check;
alter table public.profiles
  add constraint profiles_translation_language_check check (translation_language in ('ru', 'ro'));

alter table public.profiles drop constraint if exists profiles_daily_goal_check;
alter table public.profiles
  add constraint profiles_daily_goal_check check (daily_goal in (5, 10, 20));

-- Accounts created before the trigger existed have no row yet, and
-- learners cannot insert one themselves (no insert policy, on purpose).
insert into public.profiles (id)
select u.id
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);
