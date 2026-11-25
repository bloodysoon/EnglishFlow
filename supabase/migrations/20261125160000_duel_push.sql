-- Push notifications for duel invites (mobile: src/features/notifications).
-- Run after 20261121090000_duel_seven_seconds.sql.
--
--   push_tokens      one row per device (Expo push token), owned by the account
--                    signed in on it. No direct access: two RPCs only.
--   duel_push_jobs   one delivery job per duel invite, with a state machine:
--                    pending → sending (leased) → sent | failed (retry) | skipped.
--                    It is the idempotency key, the retry queue and the
--                    ticket/receipt record. Service role only.
-- The sender is the duel-invite-push Edge Function (service role). Nothing
-- here changes duels, profiles or any existing function, grant or policy.
-- New objects only; safe to run more than once.

-- ---------------------------------------------------------------------
-- Device tokens
-- ---------------------------------------------------------------------
create table if not exists public.push_tokens (
  token text primary key
    check (length(token) <= 200 and token ~ '^Expo(nent)?PushToken\[[A-Za-z0-9_-]+\]$'),
  user_id uuid not null references auth.users (id) on delete cascade,
  platform text not null check (platform in ('ios', 'android')),
  created_at timestamptz not null default now(),
  -- Refreshed on every app launch (the app re-registers): stale rows expire.
  updated_at timestamptz not null default now()
);

create index if not exists push_tokens_user_idx on public.push_tokens (user_id, updated_at desc);

-- No policies and no grants: a token is a way to reach a device, so nobody
-- lists or writes them directly, not even their own.
alter table public.push_tokens enable row level security;
revoke all on public.push_tokens from public, anon, authenticated;

-- register_push_token: this device, for the account signed in on it.
-- A token held by another account moves to this one: that's one physical
-- device whose login changed (log out normally unregisters first; this covers
-- a log out that happened offline). The token is a device secret (only that
-- device's app sees it), and with Expo Enhanced Push Security a token alone
-- can't send anything. Single-statement upsert: concurrent calls for the same
-- token serialize on its primary key; the last account wins. At most 10
-- devices per account: the oldest go.
create or replace function public.register_push_token(p_token text, p_platform text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is null then raise exception 'not authenticated'; end if;
  if p_token is null or length(p_token) > 200 or p_token !~ '^Expo(nent)?PushToken\[[A-Za-z0-9_-]+\]$'
     or p_platform is null or p_platform not in ('ios', 'android') then
    raise exception 'push_invalid' using errcode = '22023';
  end if;

  insert into public.push_tokens (token, user_id, platform)
  values (p_token, me, p_platform)
  on conflict (token) do update
    set user_id = excluded.user_id, platform = excluded.platform, updated_at = now();

  delete from public.push_tokens t
  where t.user_id = me
    and t.token not in (
      select k.token from public.push_tokens k where k.user_id = me order by k.updated_at desc limit 10
    );
end;
$$;

-- unregister_push_token: on log out, while still signed in. Only a row that
-- is mine: unregistering someone else's token does nothing.
create or replace function public.unregister_push_token(p_token text)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.push_tokens where token = p_token and user_id = auth.uid();
$$;

revoke all on function public.register_push_token(text, text) from public, anon;
revoke all on function public.unregister_push_token(text) from public, anon;
grant execute on function public.register_push_token(text, text) to authenticated;
grant execute on function public.unregister_push_token(text) to authenticated;

-- ---------------------------------------------------------------------
-- Delivery jobs (service role only)
-- ---------------------------------------------------------------------
create table if not exists public.duel_push_jobs (
  duel_id uuid primary key references public.duels (id) on delete cascade,
  recipient uuid not null references auth.users (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'sending', 'sent', 'failed', 'skipped')),
  attempts smallint not null default 0,
  lease_until timestamptz,          -- while sending: who holds it, until when
  next_attempt_at timestamptz,      -- while failed: earliest retry
  last_error text,                  -- an error code, never a token or name
  tickets jsonb not null default '[]'::jsonb,  -- [{ token, id, error }]
  receipts jsonb,                   -- { ticketId: "ok" | errorCode }
  receipts_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists duel_push_jobs_due_idx on public.duel_push_jobs (status, next_attempt_at)
  where status in ('pending', 'sending', 'failed');
create index if not exists duel_push_jobs_receipts_idx on public.duel_push_jobs (updated_at)
  where status = 'sent' and receipts_checked_at is null;

alter table public.duel_push_jobs enable row level security;
revoke all on public.duel_push_jobs from public, anon, authenticated;

-- claim_duel_push: take the job for one send attempt, atomically. Creates it
-- if absent. Succeeds only for a job that is pending, failed and due again,
-- or sending with an expired lease (a crashed attempt), and has attempts
-- left. Concurrent claims: the UPDATE locks the row; a second claim re-checks
-- the WHERE after the first commits, finds it "sending" and gets nothing.
-- Returns the job (with its new attempt number) or null.
create or replace function public.claim_duel_push(p_duel uuid, p_recipient uuid, p_max_attempts int, p_lease_seconds int)
returns public.duel_push_jobs
language plpgsql
security definer
set search_path = ''
as $$
declare
  j public.duel_push_jobs;
begin
  insert into public.duel_push_jobs (duel_id, recipient) values (p_duel, p_recipient)
  on conflict (duel_id) do nothing;

  update public.duel_push_jobs set
    status = 'sending',
    attempts = attempts + 1,
    lease_until = now() + make_interval(secs => p_lease_seconds),
    next_attempt_at = null,
    updated_at = now()
  where duel_id = p_duel
    and recipient = p_recipient
    and attempts < p_max_attempts
    and (
      status = 'pending'
      or (status = 'failed' and (next_attempt_at is null or next_attempt_at <= now()))
      or (status = 'sending' and lease_until < now())
    )
  returning * into j;
  return j;
end;
$$;

-- finish_duel_push: record the outcome of an attempt. Only the holder of
-- that attempt can (status sending, same attempt number), so a slow attempt
-- whose lease expired can't overwrite the one that took over.
create or replace function public.finish_duel_push(
  p_duel uuid, p_attempt int, p_status text, p_error text, p_tickets jsonb, p_retry_in_seconds int
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_status not in ('sent', 'failed', 'skipped') then
    raise exception 'push_invalid' using errcode = '22023';
  end if;
  update public.duel_push_jobs set
    status = p_status,
    last_error = p_error,
    tickets = coalesce(p_tickets, tickets),
    lease_until = null,
    next_attempt_at = case when p_status = 'failed' and p_retry_in_seconds is not null
                           then now() + make_interval(secs => p_retry_in_seconds) end,
    updated_at = now()
  where duel_id = p_duel and status = 'sending' and attempts = p_attempt;
  return found;
end;
$$;

revoke all on function public.claim_duel_push(uuid, uuid, int, int) from public, anon, authenticated;
revoke all on function public.finish_duel_push(uuid, int, text, text, jsonb, int) from public, anon, authenticated;

-- ---------------------------------------------------------------------
-- Maintenance, every minute (pg_cron + pg_net): retries of failed or
-- abandoned sends while the invite is still live, receipts 15 minutes after
-- sending, and cleanup. The shared secret comes from Vault, never inline:
--   select vault.create_secret('<the WEBHOOK_SECRET value>', 'duel_push_webhook_secret');
-- Replace <project-ref>. Enable pg_cron and pg_net first.
-- ---------------------------------------------------------------------
-- select cron.schedule('duel-push-maintenance', '* * * * *', $$
--   select net.http_post(
--     url := 'https://<project-ref>.supabase.co/functions/v1/duel-invite-push?mode=maintenance',
--     headers := jsonb_build_object(
--       'content-type', 'application/json',
--       'x-webhook-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'duel_push_webhook_secret')
--     ),
--     body := '{}'::jsonb
--   );
-- $$);
