-- Words learners saved from the dictionary before translations.csv was
-- filled keep the (often empty) Wiktionary translation they got then.
-- Copy the hand-filled dictionary translation into those copies: add it
-- where missing, replace unreviewed Wiktionary ones. Manual and reviewed
-- translations are left alone. Same split as splitTranslationCell:
-- first part is the translation, up to 5 alternatives, 200 chars each.
-- Run after supabase/seed/dictionary.sql. Safe to run more than once
-- (run it again after updating the dictionary).

with cells as (
  select w.id as word_id, l.language,
    array(
      select left(btrim(p), 200)
      from unnest(string_to_array(l.cell, ';')) with ordinality as t(p, n)
      where btrim(p) <> ''
      order by n
    ) as parts
  from public.words w
  join public.dictionary_entries d on d.lemma = w.lemma
  cross join lateral (values ('ru', d.translation_ru), ('ro', d.translation_ro)) as l(language, cell)
  where w.owner_id is not null and w.source = 'wiktionary' and l.cell is not null
)
insert into public.word_translations (word_id, language, translation, alternatives, source, reviewed)
select word_id, language, parts[1], coalesce(parts[2:6], '{}'), 'wiktionary', false
from cells
where cardinality(parts) > 0
on conflict (word_id, language) do update
  set translation = excluded.translation, alternatives = excluded.alternatives
  where public.word_translations.source = 'wiktionary' and not public.word_translations.reviewed;
