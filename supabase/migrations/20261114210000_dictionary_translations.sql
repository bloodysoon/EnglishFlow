-- Hand-filled translations for dictionary words (content/dictionary/
-- translations.csv → supabase/seed/dictionary.sql). The word card uses
-- them first and Wiktionary only where they are missing. Format: main
-- translation first, then alternatives, separated by ";".
-- Run after 20261114200000_dictionary_topics.sql. Safe to run more than once.

alter table public.dictionary_entries
  add column if not exists translation_ru text check (char_length(translation_ru) <= 300),
  add column if not exists translation_ro text check (char_length(translation_ro) <= 300);
