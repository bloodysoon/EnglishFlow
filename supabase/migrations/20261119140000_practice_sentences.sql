-- Practice history: every sentence a learner checked on a word page.
-- Run after 20261119130000_timeline_boxes.sql.
-- Append-only: learners insert and read their own rows; nothing is updated.

create table public.practice_sentences (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  word_id uuid not null references public.words (id) on delete cascade,
  sentence text not null check (char_length(sentence) between 1 and 300),
  -- The tense the learner aimed for; null for free practice.
  tense text check (tense in (
    'present-simple', 'present-continuous', 'present-perfect', 'present-perfect-continuous',
    'past-simple', 'past-continuous', 'past-perfect', 'past-perfect-continuous',
    'future-simple', 'future-continuous', 'future-perfect', 'future-perfect-continuous'
  )),
  -- Did the sentence use that tense? Set exactly when a tense was asked for.
  tense_ok boolean,
  -- LanguageTool's findings: [{fragment, message, suggestions}].
  issues jsonb not null default '[]'::jsonb check (jsonb_typeof(issues) = 'array'),
  created_at timestamptz not null default now(),
  check ((tense is null) = (tense_ok is null))
);

-- "My sentences for this word, newest first."
create index practice_sentences_user_word_idx
  on public.practice_sentences (user_id, word_id, created_at desc);

alter table public.practice_sentences enable row level security;

create policy "Learners read their own practice"
  on public.practice_sentences for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Only for a word in my own list.
create policy "Learners add practice for their words"
  on public.practice_sentences for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.user_words uw
      where uw.user_id = (select auth.uid()) and uw.word_id = practice_sentences.word_id
    )
  );

revoke all on public.practice_sentences from anon;
