import { describe, expect, it } from "vitest";

import { addCefrList, type CefrIndex } from "./cefr";
import { readFileSync } from "node:fs";
import path from "node:path";

import { buildDictionarySeedSql, dictionaryEntries, topicsFromSeed } from "./dictionary-seed";
import { TOPICS } from "./topics";

const csv = [
  "headword,pos,CEFR",
  "book,noun,A1",
  "book,verb,B1",
  "adviser/advisor,noun,B2",
  "a.m./A.M./am/AM,adverb,A1",
  "o'clock,adverb,A1",
  "run,vern,A1",
].join("\n");

describe("dictionaryEntries", () => {
  const index: CefrIndex = addCefrList(new Map(), csv, "cefr-j");
  const entries = dictionaryEntries(index);
  const byLemma = new Map(entries.map((e) => [e.lemma, e]));

  it("keeps one entry per headword at its easiest level", () => {
    expect(byLemma.get("book")).toEqual({
      lemma: "book",
      pos: "noun",
      partsOfSpeech: ["noun", "verb"],
      level: "A1",
      source: "cefr-j",
      topics: [],
      ru: "",
      ro: "",
      definitionRu: "",
      definitionRo: "",
    });
    expect(byLemma.get("advisor")?.level).toBe("B2");
    expect(byLemma.get("run")?.pos).toBe("verb");
  });

  it("drops headwords that cannot be words (dots, capitals)", () => {
    expect(byLemma.has("a.m.")).toBe(false);
    expect(byLemma.has("A.M.")).toBe(false);
    expect(byLemma.has("am")).toBe(true);
    expect(byLemma.get("o'clock")?.pos).toBe("adv");
  });

  it("writes translations from the CSV, null when missing", () => {
    const index: CefrIndex = addCefrList(new Map(), csv, "cefr-j");
    const sql = buildDictionarySeedSql(
      dictionaryEntries(index, new Map(), new Map([["book", { ru: "книга", ro: "" }]])),
    );
    expect(sql).toContain("('book', 'noun', 'A1', 'cefr-j', '{noun,verb}', 'книга', null, null, null, '{}')");
  });

  it("writes idempotent, escaped SQL", () => {
    const sql = buildDictionarySeedSql(entries, 2);
    expect(sql).toContain("('o''clock', 'adv', 'A1', 'cefr-j', '{adv}', null, null, null, null, '{}')");
    expect(sql.match(/on conflict \(lemma\) do update/g)?.length).toBe(Math.ceil(entries.length / 2));
    // Saved words get the new translations in the same run, after the entries.
    expect(sql.indexOf("insert into public.word_translations")).toBeGreaterThan(sql.lastIndexOf("dictionary_entries"));
    expect(sql.trimEnd().endsWith("commit;")).toBe(true);
  });
});

describe("topics", () => {
  it("survive a regenerated seed file", () => {
    const index: CefrIndex = addCefrList(new Map(), csv, "cefr-j");
    const edited = buildDictionarySeedSql(dictionaryEntries(index)).replace(
      "('book', 'noun', 'A1', 'cefr-j', '{noun,verb}', null, null, null, null, '{}')",
      "('book', 'noun', 'A1', 'cefr-j', '{noun,verb}', null, null, null, null, '{education, work}')",
    );
    const kept = topicsFromSeed(edited);
    expect(kept.get("book")).toEqual(["education", "work"]);
    expect(buildDictionarySeedSql(dictionaryEntries(index, kept))).toContain(
      "('book', 'noun', 'A1', 'cefr-j', '{noun,verb}', null, null, null, null, '{education,work}')",
    );
    // Older, shorter rows still give their topics.
    expect(topicsFromSeed("  ('goal', 'noun', 'A1', 'cefr-j', '{sport}'),").get("goal")).toEqual(["sport"]);
    expect(topicsFromSeed("  ('goal', 'noun', 'A1', 'cefr-j', '{noun}', '{sport}'),").get("goal")).toEqual(["sport"]);
  });

  it("match the list the database allows", () => {
    const sql = readFileSync(
      path.join(process.cwd(), "supabase/migrations/20261114200000_dictionary_topics.sql"),
      "utf8",
    );
    expect(sql).toContain(`array[${TOPICS.map((t) => `'${t}'`).join(", ")}]::text[]`);
  });
});
