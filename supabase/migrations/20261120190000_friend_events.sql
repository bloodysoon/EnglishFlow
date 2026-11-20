-- Friend history for the timeline (src/features/friends).
-- Run after 20261120180000_friends.sql.
--
-- One row per learner each time a friendship is accepted, so the timeline
-- keeps "new friend: @ana" even after unfriending, blocking, a username
-- change or a deleted account (username is a snapshot, friend_id goes null).
-- Written only by the trigger below; learners can read their own rows.

create table if not exists public.friend_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  friend_id uuid references public.profiles (id) on delete set null,
  friend_username text not null,
  created_at timestamptz not null default now()
);

create index if not exists friend_events_user_idx on public.friend_events (user_id, created_at);

alter table public.friend_events enable row level security;
revoke all on public.friend_events from anon, authenticated;
grant select on public.friend_events to authenticated;

drop policy if exists "Users can read own friend events" on public.friend_events;
create policy "Users can read own friend events" on public.friend_events
  for select to authenticated using (user_id = (select auth.uid()));

-- Both sides get a row when a request turns into a friendship.
create or replace function public.log_friendship_accepted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'accepted' and (tg_op = 'INSERT' or old.status <> 'accepted') then
    insert into public.friend_events (user_id, friend_id, friend_username, created_at)
    select me, them, p.username, new.updated_at
    from (values (new.requester, new.addressee), (new.addressee, new.requester)) as pair (me, them)
    join public.profiles p on p.id = pair.them;
  end if;
  return new;
end;
$$;

revoke all on function public.log_friendship_accepted() from public;

drop trigger if exists friendships_log_accepted on public.friendships;
create trigger friendships_log_accepted
  after insert or update of status on public.friendships
  for each row execute function public.log_friendship_accepted();

-- Friendships accepted before this migration.
insert into public.friend_events (user_id, friend_id, friend_username, created_at)
select pair.me, pair.them, p.username, f.updated_at
from public.friendships f
cross join lateral (values (f.requester, f.addressee), (f.addressee, f.requester)) as pair (me, them)
join public.profiles p on p.id = pair.them
where f.status = 'accepted'
  and not exists (select 1 from public.friend_events e where e.user_id = pair.me and e.friend_id = pair.them);
