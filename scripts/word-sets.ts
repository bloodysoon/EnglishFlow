// Word set import: Wiktionary (kaikki.org) → reviewed JSON → SQL seed.
//
//   npm run words:fetch -- <slug>
//     Reads content/word-sets/<slug>.json, downloads each word from
//     kaikki.org (cached in .cache/kaikki), looks up its CEFR level in the
//     CEFR-J and Octanove word lists (cached in .cache/cefr) and writes
//     content/word-sets/<slug>.words.json for review. Re-running keeps
//     everything already in that file and only fills gaps.
//
//   npm run words:seed -- <slug>
//     Validates the reviewed file and writes supabase/seed/<slug>.sql.
//     Run that file in the Supabase SQL editor.
//
// Runs on Node 24 (see .nvmrc) with built-in TypeScript support.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { CEFR_LISTS, addCefrList, lookupCefrLevel, type CefrIndex, type CefrListSource } from "../src/features/dictionary/cefr.ts";
import {
  emptyWordDraft,
  extractWord,
  kaikkiUrl,
  parseKaikkiJsonl,
  type WordDraft,
} from "../src/features/dictionary/kaikki.ts";
import { buildSeedSql } from "../src/features/dictionary/seed-sql.ts";
import {
  mergeWordDraft,
  normalizeSetWord,
  slugArgumentSchema,
  wordSetDefinitionSchema,
  wordsFileSchema,
} from "../src/features/dictionary/word-set.ts";

const ROOT = process.cwd();
const SETS_DIR = path.join(ROOT, "content", "word-sets");
const CACHE_DIR = path.join(ROOT, ".cache", "kaikki");
const CEFR_CACHE_DIR = path.join(ROOT, ".cache", "cefr");
const SEED_DIR = path.join(ROOT, "supabase", "seed");
const REQUEST_GAP_MS = 400; // be polite to kaikki.org

async function readJson(file: string): Promise<unknown> {
  return JSON.parse(await readFile(file, "utf8"));
}

async function readJsonIfExists(file: string): Promise<unknown | undefined> {
  try {
    return await readJson(file);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

async function writeJson(file: string, value: unknown) {
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Returns the .jsonl body, or null when kaikki has no page for the word.
async function loadKaikki(word: string): Promise<{ body: string | null; fromCache: boolean }> {
  const cacheFile = path.join(CACHE_DIR, `${encodeURIComponent(word)}.jsonl`);
  try {
    return { body: await readFile(cacheFile, "utf8"), fromCache: true };
  } catch {
    // not cached yet
  }

  const response = await fetch(kaikkiUrl(word), { headers: { "User-Agent": "word-sets-import/1.0" } });
  if (response.status === 404) return { body: null, fromCache: false };
  if (!response.ok) throw new Error(`kaikki.org answered ${response.status} for "${word}"`);

  const body = await response.text();
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(cacheFile, body, "utf8");
  return { body, fromCache: false };
}

// Both CEFR word lists, downloaded once into .cache/cefr.
async function loadCefrIndex(): Promise<CefrIndex> {
  const index: CefrIndex = new Map();

  for (const [source, { url, file }] of Object.entries(CEFR_LISTS) as [CefrListSource, (typeof CEFR_LISTS)[CefrListSource]][]) {
    const cacheFile = path.join(CEFR_CACHE_DIR, file);
    let csv: string;
    try {
      csv = await readFile(cacheFile, "utf8");
    } catch {
      const response = await fetch(url, { headers: { "User-Agent": "word-sets-import/1.0" } });
      if (!response.ok) throw new Error(`Could not download the ${source} word list (${response.status})`);
      csv = await response.text();
      await mkdir(CEFR_CACHE_DIR, { recursive: true });
      await writeFile(cacheFile, csv, "utf8");
      console.log(`downloaded ${file}`);
    }
    addCefrList(index, csv, source);
  }

  return index;
}

async function fetchSet(slug: string) {
  const definition = wordSetDefinitionSchema.parse(await readJson(path.join(SETS_DIR, `${slug}.json`)));
  const wordsFile = path.join(SETS_DIR, `${slug}.words.json`);
  const existingRaw = await readJsonIfExists(wordsFile);
  const existing = existingRaw === undefined ? [] : wordsFileSchema.parse(existingRaw);
  const byKey = new Map(existing.map((w) => [w.lemma, w]));

  const cefr = await loadCefrIndex();
  const result: WordDraft[] = [];
  const gaps: string[] = [];

  for (const item of definition.words) {
    const { word, pos, level: levelOverride } = normalizeSetWord(item);
    const { body, fromCache } = await loadKaikki(word);
    const fresh = (body && extractWord(parseKaikkiJsonl(body), word, pos)) || emptyWordDraft(word, pos);

    const listed = lookupCefrLevel(cefr, word, fresh.pos || pos);
    if (listed) {
      fresh.level = listed.level;
      fresh.levelSource = listed.source;
    }

    const merged = mergeWordDraft(fresh, byKey.get(word));
    // A level written in <slug>.json always wins.
    if (levelOverride) {
      merged.level = levelOverride;
      merged.levelSource = "manual";
    }
    result.push(merged);

    if (!merged.level) gaps.push(`${word}: no CEFR level (not in the word lists); set "level" in ${slug}.json`);

    if (!body) gaps.push(`${word}: not found on Wiktionary, fill every field by hand`);
    for (const [language, t] of Object.entries(merged.translations)) {
      if (!t) gaps.push(`${word}: no ${language.toUpperCase()} translation`);
    }

    console.log(
      `${fromCache ? "cache" : "fetch"}  ${word}${merged.pos ? ` (${merged.pos})` : ""}  ${merged.level ?? "?"}${merged.levelSource ? ` [${merged.levelSource}]` : ""}`,
    );
    if (!fromCache) await sleep(REQUEST_GAP_MS);
  }

  await writeJson(wordsFile, result);
  console.log(`\nWrote ${path.relative(ROOT, wordsFile)} (${result.length} words).`);
  if (gaps.length) console.log(`\nTo fill in by hand:\n  ${gaps.join("\n  ")}`);
  console.log(
    `\nNext: check each translation, set "reviewed": true, then run npm run words:seed -- ${slug}`,
  );
}

async function seedSet(slug: string) {
  const definition = wordSetDefinitionSchema.parse(await readJson(path.join(SETS_DIR, `${slug}.json`)));
  const words = wordsFileSchema.parse(await readJson(path.join(SETS_DIR, `${slug}.words.json`)));

  const { sql, warnings } = buildSeedSql(definition, words);
  await mkdir(SEED_DIR, { recursive: true });
  const seedFile = path.join(SEED_DIR, `${slug}.sql`);
  await writeFile(seedFile, sql, "utf8");

  console.log(`Wrote ${path.relative(ROOT, seedFile)}. Run it in the Supabase SQL editor.`);
  if (warnings.length) console.log(`\nWarnings:\n  ${warnings.join("\n  ")}`);
}

async function main() {
  const [command, slugArg] = process.argv.slice(2);
  // The slug becomes part of file paths, so it must be a plain slug.
  const slug = slugArgumentSchema.safeParse(slugArg);

  if ((command !== "fetch" && command !== "seed") || !slug.success) {
    console.error("Usage: npm run words:fetch -- <slug>   |   npm run words:seed -- <slug>");
    process.exit(1);
  }

  await (command === "fetch" ? fetchSet(slug.data) : seedSet(slug.data));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
