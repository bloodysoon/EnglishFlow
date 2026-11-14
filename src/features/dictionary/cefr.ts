// CEFR levels for English words, from two open word lists:
//   CEFR-J Wordlist 1.5 (A1–B2), Tono Laboratory, TUFS: free for research
//     and commercial use with citation.
//   Octanove Vocabulary Profile C1/C2 1.0, Octanove Labs: CC BY-SA 4.0.
// Both: https://github.com/openlanguageprofiles/olp-en-cefrj
// Pure: downloading and caching live in scripts/word-sets.ts.

export const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;
export type CefrLevel = (typeof CEFR_LEVELS)[number];

export const LEVEL_SOURCES = ["cefr-j", "octanove", "manual", "machine"] as const;
export type LevelSource = (typeof LEVEL_SOURCES)[number];

export type CefrListSource = Extract<LevelSource, "cefr-j" | "octanove">;

export const CEFR_LISTS: Record<CefrListSource, { url: string; file: string }> = {
  "cefr-j": {
    url: "https://raw.githubusercontent.com/openlanguageprofiles/olp-en-cefrj/master/cefrj-vocabulary-profile-1.5.csv",
    file: "cefrj-vocabulary-profile-1.5.csv",
  },
  octanove: {
    url: "https://raw.githubusercontent.com/openlanguageprofiles/olp-en-cefrj/master/octanove-vocabulary-profile-c1c2-1.0.csv",
    file: "octanove-vocabulary-profile-c1c2-1.0.csv",
  },
};

type CefrEntry = { pos: string; level: CefrLevel; source: CefrListSource };
export type CefrIndex = Map<string, CefrEntry[]>;

const isCefrLevel = (value: string): value is CefrLevel => (CEFR_LEVELS as readonly string[]).includes(value);

// Kaikki (Wiktionary) part-of-speech names → the word lists' names.
const KAIKKI_TO_LIST_POS: Record<string, string> = {
  adj: "adjective",
  adv: "adverb",
  conj: "conjunction",
  det: "determiner",
  intj: "interjection",
  num: "number",
  prep: "preposition",
  pron: "pronoun",
};

// Typos and variants found in the lists.
const LIST_POS_FIXES: Record<string, string> = { vern: "verb" };

// Minimal RFC 4180 CSV reader (quoted fields, "" escapes, CRLF).
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  const body = text.replace(/^﻿/, "");
  for (let i = 0; i < body.length; i++) {
    const char = body[i];

    if (quoted) {
      if (char === '"' && body[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && body[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += char;
  }

  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

// Adds one list (CSV with headword, pos, CEFR columns) to the index.
// "adviser/advisor" becomes two headwords; rows with an unknown level are
// skipped.
export function addCefrList(index: CefrIndex, csv: string, source: CefrListSource): CefrIndex {
  const [header, ...rows] = parseCsv(csv);
  const column = (name: string) => header.findIndex((h) => h.trim().toLowerCase() === name.toLowerCase());
  const [wordCol, posCol, levelCol] = [column("headword"), column("pos"), column("CEFR")];
  if (wordCol < 0 || posCol < 0 || levelCol < 0) {
    throw new Error(`${source}: expected headword, pos and CEFR columns`);
  }

  for (const row of rows) {
    const level = row[levelCol]?.trim().toUpperCase() ?? "";
    if (!isCefrLevel(level)) continue;

    const rawPos = row[posCol]?.trim().toLowerCase() ?? "";
    const pos = LIST_POS_FIXES[rawPos] ?? rawPos;

    for (const variant of row[wordCol].split("/")) {
      const headword = variant.trim().toLowerCase();
      if (!headword) continue;
      const entries = index.get(headword) ?? [];
      entries.push({ pos, level, source });
      index.set(headword, entries);
    }
  }

  return index;
}

const levelRank = (level: CefrLevel) => CEFR_LEVELS.indexOf(level);

// The level of a word: the entry for its part of speech if the lists have
// one, otherwise the word's easiest level in any part of speech (learners
// meet the easiest meaning first). Null when the word is not listed.
export function lookupCefrLevel(
  index: CefrIndex,
  lemma: string,
  kaikkiPos?: string,
): { level: CefrLevel; source: CefrListSource } | null {
  const entries = index.get(lemma.trim().toLowerCase());
  if (!entries?.length) return null;

  const listPos = kaikkiPos ? (KAIKKI_TO_LIST_POS[kaikkiPos] ?? kaikkiPos) : undefined;
  const samePos = listPos ? entries.filter((e) => e.pos === listPos) : [];
  const candidates = samePos.length > 0 ? samePos : entries;

  const easiest = candidates.reduce((best, e) => (levelRank(e.level) < levelRank(best.level) ? e : best));
  return { level: easiest.level, source: easiest.source };
}
