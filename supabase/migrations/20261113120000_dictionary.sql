-- Dictionary: curated word sets with RU/RO translations.
--
-- Content is written only by the team (SQL editor or service role, both
-- bypass RLS). Visitors and learners can only read published sets, and
-- only translations a human has reviewed.
--
-- Data from Wiktionary (via kaikki.org) is CC BY-SA 4.0: the app must
-- credit Wiktionary wherever it shows that content (source = 'wiktionary').

-- ---------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------

create table public.words (
  id uuid primary key default gen_random_uuid(),
  lemma text not null check (char_length(lemma) between 1 and 100),
  -- '' when unknown, so (lemma, part_of_speech) stays a usable unique key.
  part_of_speech text not null default '' check (char_length(part_of_speech) <= 30),
  ipa text check (char_length(ipa) <= 100),
  definition text check (char_length(definition) <= 500),
  example text check (char_length(example) <= 300),
  source text not null default 'manual' check (source in ('wiktionary', 'manual')),
  created_at timestamptz not null default now(),
  unique (lemma, part_of_speech)
);

create table public.word_translations (
  word_id uuid not null references public.words (id) on delete cascade,
  language text not null check (language in ('ru', 'ro')),
  translation text not null check (char_length(translation) between 1 and 200),
  alternatives text[] not null default '{}' check (cardinality(alternatives) <= 5),
  -- The word's example sentence, translated.
  example text check (char_length(example) <= 300),
  source text not null default 'manual' check (source in ('wiktionary', 'manual', 'machine')),
  reviewed boolean not null default false,
  primary key (word_id, language)
);

create table public.word_sets (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  -- Localized: {"en": "...", "ru": "...", "ro": "..."}; English required.
  title jsonb not null check (jsonb_typeof(title) = 'object' and title ? 'en'),
  description jsonb check (description is null or jsonb_typeof(description) = 'object'),
  level text check (level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.word_set_items (
  set_id uuid not null references public.word_sets (id) on delete cascade,
  word_id uuid not null references public.words (id) on delete cascade,
  position integer not null check (position >= 0),
  primary key (set_id, word_id)
);

-- RLS policies below look words up through their sets.
create index word_set_items_word_id_idx on public.word_set_items (word_id);

-- ---------------------------------------------------------------------
-- Row Level Security: read-only for everyone, published content only.
-- No insert/update/delete policies on purpose.
-- ---------------------------------------------------------------------

alter table public.words enable row level security;
alter table public.word_translations enable row level security;
alter table public.word_sets enable row level security;
alter table public.word_set_items enable row level security;

create policy "Published sets are readable"
  on public.word_sets for select
  to anon, authenticated
  using (is_published);

create policy "Items of published sets are readable"
  on public.word_set_items for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.word_sets s
      where s.id = word_set_items.set_id and s.is_published
    )
  );

create policy "Words in published sets are readable"
  on public.words for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.word_set_items i
      join public.word_sets s on s.id = i.set_id
      where i.word_id = words.id and s.is_published
    )
  );

create policy "Reviewed translations of published words are readable"
  on public.word_translations for select
  to anon, authenticated
  using (
    reviewed
    and exists (
      select 1
      from public.word_set_items i
      join public.word_sets s on s.id = i.set_id
      where i.word_id = word_translations.word_id and s.is_published
    )
  );
