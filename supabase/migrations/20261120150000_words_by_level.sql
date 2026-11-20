-- Statistics: my words per CEFR level next to the dictionary's size for
-- that level. Run after 20261120140000_level_xp_boost.sql.
--   [{level, dictionary, known, mastered, learning}], A1 to C2
--   known:    marked "I know it"
--   mastered: learning words that reached box 5
--   learning: the rest of my learning words
-- Security invoker: RLS limits user_words to the caller's own rows.

create or replace function public.my_words_by_level()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with mine as (
    select w.cefr_level as level, coalesce(uw.known, false) as known, uw.box
    from public.user_words uw
    join public.words w on w.id = uw.word_id
    where uw.user_id = auth.uid() and w.cefr_level is not null
  )
  select jsonb_agg(
    jsonb_build_object(
      'level', lv.level,
      'dictionary', (select count(*) from public.dictionary_entries d where d.cefr_level = lv.level),
      'known', (select count(*) from mine m where m.level = lv.level and m.known),
      'mastered', (select count(*) from mine m where m.level = lv.level and not m.known and m.box = 5),
      'learning', (select count(*) from mine m where m.level = lv.level and not m.known and m.box < 5)
    )
    order by lv.level
  )
  from (values ('A1'), ('A2'), ('B1'), ('B2'), ('C1'), ('C2')) as lv(level);
$$;

revoke execute on function public.my_words_by_level() from public, anon;
grant execute on function public.my_words_by_level() to authenticated;
