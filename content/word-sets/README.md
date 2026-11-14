# Word sets

Curated word sets with Russian and Romanian translations. Translations
start from Wiktionary (via [kaikki.org](https://kaikki.org)) and are
checked by a person before learners see them.

## Add or update a set

1. Create `<slug>.json` (see `everyday-starter.json`): title in EN/RU/RO,
   CEFR level and the word list. Give a part of speech (`verb`, `noun`,
   `adj`, `adv`, `conj`, `intj`) when a word has several, and a `level`
   (`A1`…`C2`) to override the word lists:
   `{ "word": "borrow", "pos": "verb", "level": "A2" }`.
2. `npm run words:fetch -- <slug>` downloads each word (cached in
   `.cache/kaikki`), looks up its CEFR level in the CEFR-J and Octanove
   word lists (cached in `.cache/cefr`) and writes `<slug>.words.json`.
   Words missing from the lists get `"level": null`: set one in step 1.
3. Review `<slug>.words.json`:
   - fix the main `translation` (Wiktionary's first meaning is not always
     the one learners need), trim `alternatives`, fill every `null`;
   - set `"source": "manual"` on anything you rewrote;
   - set `"reviewed": true` on each translation you checked.
   Running `fetch` again only fills gaps; it never overwrites your edits.
4. `npm run words:seed -- <slug>` validates the file and writes
   `supabase/seed/<slug>.sql`. Run it in the Supabase SQL editor
   (after the migrations in `supabase/migrations`).
5. Publish the set in the admin panel (`/admin/word-sets`), where you can
   also fix translations and levels later. `"published"` in `<slug>.json`
   only applies the first time a set is seeded; re-seeding never touches
   the publish switch or translations already marked reviewed.

Only published sets and reviewed translations are readable (RLS);
nothing in the app can write to these tables.

## Word levels and XP

A word's CEFR level multiplies the XP a learner earns for it (A1 ×1 …
C2 ×3, see `src/features/leitner/xp.ts`). Words without a level count
as A1.

## Licences

- Wiktionary content is CC BY-SA 4.0. Wherever the app shows definitions,
  examples or translations with `source = 'wiktionary'`, it must credit
  Wiktionary and link the licence.
- Levels with `level_source = 'cefr-j'`: The CEFR-J Wordlist Version 1.5,
  compiled by Yukio Tono, Tokyo University of Foreign Studies. Free for
  research and commercial use; cite it where levels are shown.
- Levels with `level_source = 'octanove'`: Octanove Vocabulary Profile
  C1/C2 1.0, Octanove Labs, CC BY-SA 4.0.
- Both lists: https://github.com/openlanguageprofiles/olp-en-cefrj
