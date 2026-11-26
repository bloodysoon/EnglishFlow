-- Learning integrity 1 of 2: an append-only server ledger (PROPOSAL ONLY).
-- Additive: no existing table, function or row changes. Nothing reads it until
-- 20261127150300 (the RPCs) is applied; deploy both in the same push.
--
-- Why: every daily limit today is count(*) over rows that still exist
-- (user_words.introduced_on, words.created_at), and remove_my_word deletes
-- them. A learner's "logical word" isn't stable either: dictionary and custom
-- words are per-learner copies (owner_id = the learner), and removing one
-- deletes that copy, so re-adding it gets a NEW word_id.
--
-- The ledger records, per learner and per LOGICAL word (lemma + part of speech,
-- the identity behind words' unique key), what happened on which UTC day. The
-- key is the JSON array [lemma, part of speech], each NFC-normalised, trimmed and
-- lower-cased (whitespace runs collapsed): case, spacing and Unicode forms can't
-- split one word, and no separator inside a lemma can merge two.
-- Rows are never updated and only deleted with the account (cascade):
--   introduced  a word started learning that day (counts toward the plan's daily new-word limit)
--   custom      a custom word created that day (counts toward the plan's daily custom-word limit)
--   reviewed    the one XP-bearing review of that word that day
--   known       the one-time "I know this word" XP for that word (no day dimension)
--   mastered    the one-time mastery bonus for that word (no day dimension): re-learning
--               and re-mastering it later never pays a second bonus

create table if not exists public.learning_ledger (
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('introduced', 'custom', 'reviewed', 'known', 'mastered')),
  word_key text not null check (char_length(word_key) between 7 and 400),
  day date not null,
  source text not null default 'live' check (source in ('live', 'backfill')),
  created_at timestamptz not null default now()
);

-- One row per learner, kind, UTC day and logical word; 'known' and 'mastered' once ever.
create unique index if not exists learning_ledger_daily_uidx
  on public.learning_ledger (user_id, kind, day, word_key) where kind in ('introduced', 'custom', 'reviewed');
create unique index if not exists learning_ledger_lifetime_uidx
  on public.learning_ledger (user_id, kind, word_key) where kind in ('known', 'mastered');

alter table public.learning_ledger enable row level security;
-- No policies: learners can't read or write it. Only the learning RPCs (security
-- definer, owner) write it; the service role may read it for support.
revoke all on table public.learning_ledger from public, anon, authenticated, service_role;
grant select on table public.learning_ledger to service_role;

-- Append-only, also for the owner: no UPDATE; DELETE only once the account is
-- gone (the ON DELETE CASCADE from auth.users), as for achievement_unlocks.
create or replace function public.learning_ledger_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' and not exists (select 1 from auth.users u where u.id = old.user_id) then
    return old;
  end if;
  raise exception 'learning_ledger_append_only' using errcode = '42501';
end;
$$;
revoke all on function public.learning_ledger_guard() from public, anon, authenticated, service_role;

drop trigger if exists learning_ledger_guard on public.learning_ledger;
create trigger learning_ledger_guard
  before update or delete on public.learning_ledger
  for each row execute function public.learning_ledger_guard();

-- ---------------------------------------------------------------------
-- Helpers (not callable by any API role; the RPCs run them as the owner)
-- ---------------------------------------------------------------------

-- "Today" for learning is the UTC date of the server clock. current_date
-- follows the session time zone, which a PostgREST client can set per request
-- (Prefer: timezone=…), so it is not used for any limit or schedule.
create or replace function public.learning_today()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'utc')::date;
$$;

create or replace function public.learning_word_key(p_lemma text, p_part_of_speech text)
returns text
language sql
immutable
set search_path = ''
as $$
  select json_build_array(
    lower(regexp_replace(btrim(normalize(coalesce(p_lemma, ''), nfc)), '\s+', ' ', 'g')),
    lower(btrim(normalize(coalesce(p_part_of_speech, ''), nfc)))
  )::text;
$$;

create or replace function public.learning_word_key_of(p_word_id uuid)
returns text
language sql
stable
set search_path = ''
as $$
  select public.learning_word_key(w.lemma, w.part_of_speech) from public.words w where w.id = p_word_id;
$$;

-- Serialises one learner's introductions, so concurrent requests can't both pass a limit.
create or replace function public.learning_lock(p_user uuid)
returns void
language sql
volatile
set search_path = ''
as $$
  select pg_advisory_xact_lock(hashtextextended('learning:' || p_user::text, 0));
$$;

-- Distinct logical words of `p_kind` recorded for the learner today.
create or replace function public.learning_count_today(p_user uuid, p_kind text)
returns integer
language sql
stable
set search_path = ''
as $$
  select count(*)::integer from public.learning_ledger l
  where l.user_id = p_user and l.kind = p_kind and l.day = public.learning_today();
$$;

-- Whether these logical words may be started today under a daily limit (null = unlimited).
-- Words already recorded today are free: re-adding a word doesn't spend the allowance twice.
create or replace function public.learning_fits_today(p_user uuid, p_kind text, p_keys text[], p_limit integer)
returns boolean
language sql
stable
set search_path = ''
as $$
  select p_limit is null or public.learning_count_today(p_user, p_kind) + (
    select count(distinct k)::integer from unnest(p_keys) k
    where k is not null and not exists (
      select 1 from public.learning_ledger l
      where l.user_id = p_user and l.kind = p_kind and l.day = public.learning_today() and l.word_key = k)
  ) <= p_limit;
$$;

-- Records logical words for today; returns how many were new.
create or replace function public.learning_record(p_user uuid, p_kind text, p_keys text[])
returns integer
language plpgsql
volatile
set search_path = ''
as $$
declare
  v_added integer;
begin
  insert into public.learning_ledger (user_id, kind, word_key, day)
  select distinct p_user, p_kind, k, public.learning_today() from unnest(p_keys) k where k is not null
  on conflict do nothing;
  get diagnostics v_added = row_count;
  return v_added;
end;
$$;

-- Idempotent backfill from what still exists. Gaps (documented): events and
-- rows of deleted words have no word identity left (xp_events.word_id is set
-- null on delete) and can't be keyed, so they are not reconstructed.
create or replace function public.learning_ledger_backfill()
returns void
language sql
volatile
set search_path = ''
as $$
  insert into public.learning_ledger (user_id, kind, word_key, day, source, created_at)
  select uw.user_id, 'introduced', public.learning_word_key(w.lemma, w.part_of_speech), uw.introduced_on, 'backfill', now()
  from public.user_words uw join public.words w on w.id = uw.word_id
  where uw.introduced_on is not null
  on conflict do nothing;

  insert into public.learning_ledger (user_id, kind, word_key, day, source, created_at)
  select w.owner_id, 'custom', public.learning_word_key(w.lemma, w.part_of_speech), (w.created_at at time zone 'utc')::date, 'backfill', now()
  from public.words w
  where w.owner_id is not null and w.source = 'manual'
  on conflict do nothing;

  insert into public.learning_ledger (user_id, kind, word_key, day, source, created_at)
  select distinct x.user_id, 'reviewed', public.learning_word_key(w.lemma, w.part_of_speech), (x.created_at at time zone 'utc')::date, 'backfill', now()
  from public.xp_events x join public.words w on w.id = x.word_id
  where x.reason in ('review_remembered', 'review_forgot')
  on conflict do nothing;

  insert into public.learning_ledger (user_id, kind, word_key, day, source, created_at)
  select distinct on (x.user_id, public.learning_word_key(w.lemma, w.part_of_speech))
         x.user_id, 'known', public.learning_word_key(w.lemma, w.part_of_speech), (x.created_at at time zone 'utc')::date, 'backfill', now()
  from public.xp_events x join public.words w on w.id = x.word_id
  where x.reason = 'word_known'
  order by x.user_id, public.learning_word_key(w.lemma, w.part_of_speech), x.created_at
  on conflict do nothing;

  insert into public.learning_ledger (user_id, kind, word_key, day, source, created_at)
  select distinct on (x.user_id, public.learning_word_key(w.lemma, w.part_of_speech))
         x.user_id, 'mastered', public.learning_word_key(w.lemma, w.part_of_speech), (x.created_at at time zone 'utc')::date, 'backfill', now()
  from public.xp_events x join public.words w on w.id = x.word_id
  where x.reason = 'word_mastered'
  order by x.user_id, public.learning_word_key(w.lemma, w.part_of_speech), x.created_at
  on conflict do nothing;
$$;

do $$
declare f text;
begin
  foreach f in array array[
    'public.learning_today()', 'public.learning_word_key(text, text)', 'public.learning_word_key_of(uuid)',
    'public.learning_lock(uuid)', 'public.learning_count_today(uuid, text)',
    'public.learning_fits_today(uuid, text, text[], integer)', 'public.learning_record(uuid, text, text[])',
    'public.learning_ledger_backfill()'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated, service_role', f);
  end loop;
end $$;

select public.learning_ledger_backfill();
