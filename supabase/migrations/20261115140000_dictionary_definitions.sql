-- Hand-filled definitions in Russian and Romanian for dictionary words
-- (content/dictionary/translations.csv → supabase/seed/dictionary.sql).
-- The word card shows the one for the chosen language, English otherwise.
-- Run before the new supabase/seed/dictionary.sql. Safe to run more than once.

alter table public.dictionary_entries
  add column if not exists definition_ru text check (char_length(definition_ru) <= 500),
  add column if not exists definition_ro text check (char_length(definition_ro) <= 500);
