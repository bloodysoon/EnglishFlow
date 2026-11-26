-- Review-integrity hardening 2 of 3 (PROPOSAL ONLY). Performance only.
-- duel_opponent_check counts an opponent's reviews backwards from a duel's
-- finish (LIMIT 50) on xp_events_user_idx (user_id, created_at desc) with
-- `reason` as a filter, so it walks every non-review event (word_known, the
-- most common reason on DEV) in between. A partial index over review events
-- only makes it a bounded index scan.
-- Local worst case (2,000 duels vs an opponent with 36,500 word_known events):
-- inactive opponent 1,924 → 33 ms; active opponent 3,831 → 1,855 ms.
-- On hosted Supabase use CREATE INDEX CONCURRENTLY outside a transaction if the
-- table is large; DEV's xp_events is 184 kB.
create index if not exists xp_events_review_idx
  on public.xp_events (user_id, created_at desc)
  where reason in ('review_remembered', 'review_forgot');
