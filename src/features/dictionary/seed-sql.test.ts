import { describe, expect, it } from "vitest";

import { buildSeedSql, sqlString } from "./seed-sql";
import { mergeWordDraft, slugArgumentSchema, wordSetDefinitionSchema, wordsFileSchema } from "./word-set";
import type { WordDraft } from "./kaikki";

const definition = wordSetDefinitionSchema.parse({
  slug: "everyday-starter",
  level: "A2",
  title: { en: "Everyday starter", ru: "Повседневный старт" },
  words: ["borrow"],
});

const borrow: WordDraft = {
  lemma: "borrow",
  pos: "verb",
  source: "wiktionary",
  level: "A1",
  levelSource: "cefr-j",
  ipa: "/ˈbɒɹəʊ/",
  definition: "To receive something temporarily.",
  example: "Can I borrow your pen?",
  translations: {
    ru: { translation: "занимать", alternatives: ["одолжить"], source: "wiktionary", reviewed: true },
    ro: null,
    id: null,
  },
};

describe("sqlString", () => {
  it("quotes and escapes single quotes", () => {
    expect(sqlString("can't")).toBe("'can''t'");
  });

  it("writes null for missing values", () => {
    expect(sqlString(null)).toBe("null");
  });

  it("cannot be broken out of with an injection attempt", () => {
    expect(sqlString("x'); drop table words; --")).toBe("'x''); drop table words; --'");
  });
});

describe("buildSeedSql", () => {
  const { sql, warnings } = buildSeedSql(definition, wordsFileSchema.parse([borrow]));

  it("runs in one transaction", () => {
    expect(sql).toMatch(/^-- .*\n[\s\S]*\nbegin;\n[\s\S]*\ncommit;\n$/);
  });

  it("upserts the set as unpublished by default", () => {
    expect(sql).toContain(`values ('everyday-starter', '{"en":"Everyday starter","ru":"Повседневный старт"}'::jsonb, null, 'A2', false)`);
    expect(sql).toContain("on conflict (slug) do update");
  });

  it("never undoes admin work when re-run", () => {
    const setUpsert = sql.slice(sql.indexOf("on conflict (slug)"), sql.indexOf(";", sql.indexOf("on conflict (slug)")));
    expect(setUpsert).not.toContain("is_published");
    expect(sql).toContain("where not public.word_translations.reviewed;");
  });

  it("upserts words, translations and set items by natural keys", () => {
    expect(sql).toContain(
      "('borrow', 'verb', '/ˈbɒɹəʊ/', 'To receive something temporarily.', 'Can I borrow your pen?', 'wiktionary', 'A1', 'cefr-j')",
    );
    expect(sql).toContain("cefr_level = excluded.cefr_level, level_source = excluded.level_source");
    // Shared dictionary entries only, never a learner's own word.
    expect(sql).toContain("on conflict (lemma, part_of_speech, owner_id) do update");
    expect(sql.match(/w\.owner_id is null/g)).toHaveLength(2);
    expect(sql).toContain("('borrow', 'verb', 'ru', 'занимать', array['одолжить']::text[], null, 'wiktionary', true)");
    expect(sql).toContain("('borrow', 'verb', 0)");
  });

  it("replaces the set's word list before inserting it", () => {
    expect(sql.indexOf("delete from public.word_set_items")).toBeLessThan(
      sql.indexOf("insert into public.word_set_items"),
    );
  });

  it("warns about a word without a level", () => {
    const noLevel = buildSeedSql(definition, [{ ...borrow, level: null, levelSource: null }]);
    expect(noLevel.warnings).toContain("borrow: no CEFR level (XP counts it as A1)");
    expect(noLevel.sql).toContain("'wiktionary', null, null)");
  });

  it("warns about missing and unreviewed translations", () => {
    expect(warnings).toEqual([
      "borrow: no RO translation, fill it in before publishing",
      "borrow: no ID translation, fill it in before publishing",
    ]);

    const unreviewed = buildSeedSql(definition, [
      { ...borrow, translations: { ...borrow.translations, ru: { ...borrow.translations.ru!, reviewed: false } } },
    ]);
    expect(unreviewed.warnings).toContain("borrow: RU translation not reviewed (hidden until it is)");
  });
});

describe("mergeWordDraft", () => {
  const fresh: WordDraft = {
    ...borrow,
    ipa: "/new/",
    translations: {
      ru: { translation: "брать", alternatives: [], source: "wiktionary", reviewed: false },
      ro: { translation: "a împrumuta", alternatives: [], source: "wiktionary", reviewed: false },
      id: null,
    },
  };

  it("keeps everything already in the file and only fills gaps", () => {
    const merged = mergeWordDraft(fresh, { ...borrow, ipa: null });
    expect(merged.translations.ru).toEqual(borrow.translations.ru);
    expect(merged.translations.ro?.translation).toBe("a împrumuta");
    expect(merged.ipa).toBe("/new/");
  });

  it("keeps a level already in the file", () => {
    const merged = mergeWordDraft(
      { ...fresh, level: "B2", levelSource: "cefr-j" },
      { ...borrow, level: "A2", levelSource: "manual" },
    );
    expect(merged).toMatchObject({ level: "A2", levelSource: "manual" });

    const filled = mergeWordDraft({ ...fresh, level: "B2", levelSource: "cefr-j" }, { ...borrow, level: null, levelSource: null });
    expect(filled).toMatchObject({ level: "B2", levelSource: "cefr-j" });
  });

  it("reads older files that have no level yet", () => {
    const old: Partial<WordDraft> = { ...borrow };
    delete old.level;
    delete old.levelSource;
    expect(wordsFileSchema.parse([old])[0]).toMatchObject({ level: null, levelSource: null });
  });

  it("uses fresh data for a new word", () => {
    expect(mergeWordDraft(fresh, undefined)).toBe(fresh);
  });
});

describe("validation", () => {
  it("rejects slugs that could escape the content folder", () => {
    for (const bad of ["../secrets", "a/b", "Starter", "", "a--b"]) {
      expect(slugArgumentSchema.safeParse(bad).success, bad).toBe(false);
    }
  });

  it("rejects a translation longer than the database allows", () => {
    const tooLong = { ...borrow, translations: { ru: { ...borrow.translations.ru!, translation: "x".repeat(201) }, ro: null, id: null } };
    expect(wordsFileSchema.safeParse([tooLong]).success).toBe(false);
  });
});
