-- Learners pick single words from sets and add their own words.
-- Run after 20261114150000_learning.sql.
--
-- A word now belongs either to the shared dictionary (owner_id is null,
-- managed by the admin, visible through published sets) or to one
-- learner (owner_id = that learner, visible only to them).

alter table public.words
  add column if not exists owner_id uuid references auth.users (id) on delete cascade;

-- One shared entry per (lemma, part of speech), plus one per learner.
-- NULLS NOT DISTINCT keeps shared entries unique (owner_id is null).
alter table public.words drop constraint if exists words_lemma_part_of_speech_key;
alter table public.words drop constraint if exists words_lemma_pos_owner_key;
alter table public.words
  add constraint words_lemma_pos_owner_key unique nulls not distinct (lemma, part_of_speech, owner_id);

create index if not exists words_owner_idx on public.words (owner_id) where owner_id is not null;

-- ---------------------------------------------------------------------
-- RLS: learners read their own words and their translations
-- ---------------------------------------------------------------------

drop policy if exists "Learners read their own custom words" on public.words;
create policy "Learners read their own custom words"
  on public.words for select
  to authenticated
  using (owner_id = (select auth.uid()));

drop policy if exists "Learners read translations of their own words" on public.word_translations;
create policy "Learners read translations of their own words"
  on public.word_translations for select
  to authenticated
  using (
    exists (
      select 1 from public.words w
      where w.id = word_translations.word_id and w.owner_id = (select auth.uid())
    )
  );

-- ---------------------------------------------------------------------
-- add_words_to_my_list: add chosen words of published sets.
-- Queued like a whole set (the daily goal brings them in), or due today
-- when p_start_now. Returns how many were new to me.
-- ---------------------------------------------------------------------

create or replace function public.add_words_to_my_list(p_word_ids uuid[], p_start_now boolean default false)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_added integer;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if p_word_ids is null or cardinality(p_word_ids) = 0 or cardinality(p_word_ids) > 200 then
    raise exception 'invalid_words' using errcode = '22023';
  end if;

  -- Only shared words that are in a published set.
  insert into public.user_words (user_id, word_id, due_on, introduced_on, queue_position)
  select
    v_user,
    w.id,
    case when p_start_now then current_date end,
    case when p_start_now then current_date end,
    min(i.position)
  from public.words w
  join public.word_set_items i on i.word_id = w.id
  join public.word_sets s on s.id = i.set_id and s.is_published
  where w.id = any (p_word_ids) and w.owner_id is null
  group by w.id
  on conflict (user_id, word_id) do nothing;

  get diagnostics v_added = row_count;
  return v_added;
end;
$$;

-- ---------------------------------------------------------------------
-- add_custom_word: create my own word with a translation in one of my
-- languages and put it up for review today. Returns the word id.
-- No CEFR level (the client cannot be trusted to pick one), so XP counts
-- it as A1. At most 50 new custom words a day, so XP cannot be farmed
-- with throwaway words.
-- ---------------------------------------------------------------------

create or replace function public.add_custom_word(
  p_lemma text,
  p_part_of_speech text,
  p_language text,
  p_translation text,
  p_alternatives text[] default '{}',
  p_example text default null,
  p_ipa text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_lemma text := lower(btrim(p_lemma));
  v_pos text := coalesce(btrim(p_part_of_speech), '');
  v_alternatives text[] := coalesce(p_alternatives, '{}');
  v_today_count integer;
  v_word uuid;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  -- Same rules as customWordSchema in src/features/learning/custom-word.ts.
  if v_lemma is null or char_length(v_lemma) not between 1 and 60
     or v_lemma !~ '^[a-z]+([ ''-][a-z]+)*$' then
    raise exception 'invalid_word' using errcode = '22023';
  end if;
  if v_pos not in ('', 'noun', 'verb', 'adj', 'adv', 'prep', 'conj', 'pron', 'det', 'intj', 'num', 'phrase') then
    raise exception 'invalid_word' using errcode = '22023';
  end if;
  if p_language not in ('ru', 'ro') then
    raise exception 'invalid_word' using errcode = '22023';
  end if;
  if p_translation is null or char_length(btrim(p_translation)) not between 1 and 200
     or cardinality(v_alternatives) > 5
     or exists (select 1 from unnest(v_alternatives) a where char_length(btrim(a)) not between 1 and 200)
     or char_length(coalesce(p_example, '')) > 300
     or char_length(coalesce(p_ipa, '')) > 100 then
    raise exception 'invalid_word' using errcode = '22023';
  end if;

  select count(*) into v_today_count
  from public.words w
  where w.owner_id = v_user and w.created_at >= current_date;
  if v_today_count >= 50 then
    raise exception 'daily_limit' using errcode = 'P0001';
  end if;

  insert into public.words (lemma, part_of_speech, ipa, example, source, owner_id)
  values (v_lemma, v_pos, nullif(btrim(p_ipa), ''), nullif(btrim(p_example), ''), 'manual', v_user)
  on conflict (lemma, part_of_speech, owner_id) do update
    set ipa = coalesce(excluded.ipa, public.words.ipa),
        example = coalesce(excluded.example, public.words.example)
  returning id into v_word;

  insert into public.word_translations (word_id, language, translation, alternatives, source, reviewed)
  values (
    v_word,
    p_language,
    btrim(p_translation),
    array(select btrim(a) from unnest(v_alternatives) a),
    'manual',
    true
  )
  on conflict (word_id, language) do update
    set translation = excluded.translation, alternatives = excluded.alternatives;

  insert into public.user_words (user_id, word_id, due_on, introduced_on, box)
  values (v_user, v_word, current_date, current_date, 1)
  on conflict (user_id, word_id) do nothing;

  return v_word;
end;
$$;

-- ---------------------------------------------------------------------
-- remove_my_word: take a word out of my words. My own custom word is
-- deleted with it; XP already earned stays (xp_events keeps the amount).
-- ---------------------------------------------------------------------

create or replace function public.remove_my_word(p_word_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  delete from public.user_words where user_id = v_user and word_id = p_word_id;
  delete from public.words where id = p_word_id and owner_id = v_user;
end;
$$;

revoke execute on function public.add_words_to_my_list(uuid[], boolean) from public, anon;
revoke execute on function public.add_custom_word(text, text, text, text, text[], text, text) from public, anon;
revoke execute on function public.remove_my_word(uuid) from public, anon;
grant execute on function public.add_words_to_my_list(uuid[], boolean) to authenticated;
grant execute on function public.add_custom_word(text, text, text, text, text[], text, text) to authenticated;
grant execute on function public.remove_my_word(uuid) to authenticated;
