-- Review-integrity hardening 1 of 3 (PROPOSAL ONLY). Behaviour-neutral.
-- anon/authenticated hold Supabase's default INSERT/UPDATE/DELETE/TRUNCATE on
-- xp_events and user_words. RLS (SELECT-only policies) blocks the first three;
-- TRUNCATE ignores RLS (not reachable through the Data API today). No client
-- writes these tables directly: every write goes through security-definer RPCs
-- (review_word, triage_word, forget_known_word, add_*_word(s), introduce_new_words,
-- start_word_set, remove_my_word, award_known_word_xp), which run as the owner
-- and are unaffected. Reads (SELECT) stay as they are.
revoke insert, update, delete, truncate on public.xp_events from anon, authenticated;
revoke insert, update, delete, truncate on public.user_words from anon, authenticated;
