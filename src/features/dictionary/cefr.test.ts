import { describe, expect, it } from "vitest";

import { addCefrList, lookupCefrLevel, parseCsv, type CefrIndex } from "./cefr";

// Lines in the shape of the real files.
const cefrj = [
  "﻿headword,pos,CEFR,CoreInventory 1,CoreInventory 2,Threshold",
  "borrow,verb,A1,,,",
  "hello,noun,A1,,,",
  "whisper,noun,B1,,,",
  "whisper,verb,B2,,,",
  "adviser/advisor,noun,B2,,,",
  '"according to",preposition,A2,,,',
  "mystery,noun,X9,,,",
].join("\r\n");

const octanove = ["headword,pos,CEFR,notes", "resilient,adjective,C1,", "ponder,vern,C1,typo in source"].join("\n");

const build = (): CefrIndex => addCefrList(addCefrList(new Map(), cefrj, "cefr-j"), octanove, "octanove");

describe("parseCsv", () => {
  it("reads quoted fields, escaped quotes and CRLF", () => {
    expect(parseCsv('a,"b, c","say ""hi"""\r\n1,2,3\r\n')).toEqual([
      ["a", "b, c", 'say "hi"'],
      ["1", "2", "3"],
    ]);
  });

  it("skips blank lines", () => {
    expect(parseCsv("a,b\n\n1,2\n")).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
});

describe("lookupCefrLevel", () => {
  const index = build();

  it("uses the entry for the word's part of speech", () => {
    expect(lookupCefrLevel(index, "whisper", "verb")).toEqual({ level: "B2", source: "cefr-j" });
    expect(lookupCefrLevel(index, "whisper", "noun")).toEqual({ level: "B1", source: "cefr-j" });
  });

  it("maps Wiktionary part-of-speech names", () => {
    expect(lookupCefrLevel(index, "resilient", "adj")).toEqual({ level: "C1", source: "octanove" });
  });

  it("falls back to the easiest level when the part of speech differs", () => {
    // kaikki: hello is an interjection; CEFR-J lists it as a noun.
    expect(lookupCefrLevel(index, "hello", "intj")).toEqual({ level: "A1", source: "cefr-j" });
    expect(lookupCefrLevel(index, "whisper")).toEqual({ level: "B1", source: "cefr-j" });
  });

  it("splits slash variants and ignores case", () => {
    expect(lookupCefrLevel(index, "Advisor", "noun")?.level).toBe("B2");
    expect(lookupCefrLevel(index, "adviser")?.level).toBe("B2");
  });

  it("fixes known typos in the lists", () => {
    expect(lookupCefrLevel(index, "ponder", "verb")?.level).toBe("C1");
  });

  it("keeps multi-word headwords and skips unknown levels", () => {
    expect(lookupCefrLevel(index, "according to")?.level).toBe("A2");
    expect(lookupCefrLevel(index, "mystery")).toBeNull();
    expect(lookupCefrLevel(index, "unlisted")).toBeNull();
  });

  it("rejects a file without the expected columns", () => {
    expect(() => addCefrList(new Map(), "word,level\nx,A1", "cefr-j")).toThrow(/columns/);
  });
});
