-- Friends (src/features/friends). Run after 20261120170000_words_by_topic.sql.
--
-- Mutual friendships: A sends a request, B accepts. One row per pair.
-- status 'blocked' means requester blocked addressee.
--
-- RLS is on with no policies: learners never touch the table directly.
-- Everything goes through the security definer functions below, so the
-- rules (who may ask whom, blocks stay invisible to the blocked person,
-- no emails leave the database) live here, not in the browser.

create table if not exists public.friendships (
  requester uuid not null references public.profiles (id) on delete cascade,
  addressee uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'blocked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (requester, addressee),
  check (requester <> addressee)
);

-- One row per pair, whichever way round.
create unique index if not exists friendships_pair_key
  on public.friendships (least(requester, addressee), greatest(requester, addressee));
create index if not exists friendships_addressee_idx on public.friendships (addressee);

alter table public.friendships enable row level security;
revoke all on public.friendships from anon, authenticated;

-- ---------------------------------------------------------------------
-- friend_request: send a request by username. Returns a status code:
--   'sent'      request sent (also when the target blocked me: they must
--               not learn I was told, and I must not learn I was blocked)
--   'accepted'  they had already asked me, so we are friends now
--   'already'   already friends or my request is pending
--   'not_found' no such username
--   'self'      that is me
--   'no_username' I need a username first, so they can see who asks
--   'blocked'   I blocked them (unblock first)
--   'limit'     too many pending requests sent
-- ---------------------------------------------------------------------
create or replace function public.friend_request(p_username text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  them uuid;
  existing public.friendships;
begin
  if me is null then raise exception 'not authenticated'; end if;
  if not exists (select 1 from public.profiles where id = me and username is not null) then
    return 'no_username';
  end if;

  select id into them from public.profiles where username = lower(trim(p_username));
  if them is null then return 'not_found'; end if;
  if them = me then return 'self'; end if;

  select * into existing from public.friendships
  where (requester = me and addressee = them) or (requester = them and addressee = me);

  if found then
    if existing.status = 'blocked' then
      return case when existing.requester = me then 'blocked' else 'sent' end;
    end if;
    if existing.status = 'pending' and existing.requester = them then
      update public.friendships set status = 'accepted', updated_at = now()
      where requester = them and addressee = me;
      return 'accepted';
    end if;
    return 'already';
  end if;

  -- Spam guard.
  if (select count(*) from public.friendships where requester = me and status = 'pending') >= 50 then
    return 'limit';
  end if;

  insert into public.friendships (requester, addressee) values (me, them);
  return 'sent';
end;
$$;

-- Accept a request someone sent me. Returns true when it was pending.
create or replace function public.friend_accept(p_user uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  update public.friendships set status = 'accepted', updated_at = now()
  where requester = p_user and addressee = auth.uid() and status = 'pending';
  return found;
end;
$$;

-- Unfriend, decline, cancel my request, or lift my own block. A block the
-- other person made stays: I cannot remove it (and cannot see it).
create or replace function public.friend_remove(p_user uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.friendships
  where ((requester = auth.uid() and addressee = p_user) or (requester = p_user and addressee = auth.uid()))
    and (status <> 'blocked' or requester = auth.uid());
$$;

-- Block someone: ends any friendship or request between us. If they had
-- already blocked me, their block stays and nothing changes.
create or replace function public.friend_block(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then raise exception 'not authenticated'; end if;
  if p_user = me then return; end if;
  delete from public.friendships
  where ((requester = me and addressee = p_user) or (requester = p_user and addressee = me))
    and status <> 'blocked';
  insert into public.friendships (requester, addressee, status)
  values (me, p_user, 'blocked')
  on conflict do nothing;
end;
$$;

-- ---------------------------------------------------------------------
-- friends_list: my friends, requests and blocks. kind is one of
-- 'friend', 'incoming', 'outgoing', 'blocked' (only blocks I made).
-- Friends see each other's stats snapshot (level, streak, badges) even
-- when the profile is not public: accepting is consent. Requests show
-- only the username.
-- ---------------------------------------------------------------------
create or replace function public.friends_list()
returns table (user_id uuid, username text, kind text, stats jsonb, since timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id,
    p.username,
    case
      when f.status = 'accepted' then 'friend'
      when f.status = 'blocked' then 'blocked'
      when f.addressee = auth.uid() then 'incoming'
      else 'outgoing'
    end,
    case when f.status = 'accepted' then p.public_stats end,
    f.updated_at
  from public.friendships f
  join public.profiles p
    on p.id = case when f.requester = auth.uid() then f.addressee else f.requester end
  where (f.requester = auth.uid() or f.addressee = auth.uid())
    and (f.status <> 'blocked' or f.requester = auth.uid())
  order by f.updated_at desc;
$$;

revoke all on function public.friend_request(text) from public;
revoke all on function public.friend_accept(uuid) from public;
revoke all on function public.friend_remove(uuid) from public;
revoke all on function public.friend_block(uuid) from public;
revoke all on function public.friends_list() from public;
grant execute on function public.friend_request(text) to authenticated;
grant execute on function public.friend_accept(uuid) to authenticated;
grant execute on function public.friend_remove(uuid) to authenticated;
grant execute on function public.friend_block(uuid) to authenticated;
grant execute on function public.friends_list() to authenticated;
