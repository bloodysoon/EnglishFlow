import { parseCsv } from "./cefr.ts";

// content/dictionary/translations.csv: one row per dictionary word, with
// translations filled in by hand (or with an AI). Columns:
//   lemma, parts_of_speech, level  (generated, for context; do not edit)
//   ru, ro, id                     (main translation first, then up to 5
//                                   alternatives, separated by ";")
//   definition_ru, definition_ro,  (the short meaning shown on the card;
//   definition_id                   optional, English is shown when empty)
// Example row: pool,noun|verb,A2,бассейн; пруд,piscină; bazin,Место для плавания.,Loc pentru înot.

export type FilledTranslations = Map<
  string,
  { ru: string; ro: string; id?: string; definitionRu?: string; definitionRo?: string; definitionId?: string }
>;

const MAX_ALTERNATIVES = 5;
const MAX_LENGTH = 300;
export const MAX_DEFINITION_LENGTH = 500;

export function parseTranslationsCsv(csv: string): FilledTranslations {
  const filled: FilledTranslations = new Map();
  const [header, ...rows] = parseCsv(csv);
  if (!header) return filled;
  const col = (name: string) => header.findIndex((h) => h.trim().toLowerCase() === name);
  const [lemmaCol, ruCol, roCol] = [col("lemma"), col("ru"), col("ro")];
  if (lemmaCol < 0 || ruCol < 0 || roCol < 0) throw new Error("translations.csv needs lemma, ru and ro columns");
  // Optional: files from before the definition columns still load.
  const [defRuCol, defRoCol] = [col("definition_ru"), col("definition_ro")];
  const [idCol, defIdCol] = [col("id"), col("definition_id")];
  const cell = (row: string[], i: number, max: number) => (i < 0 ? "" : (row[i] ?? "").trim().slice(0, max));

  for (const row of rows) {
    const lemma = row[lemmaCol]?.trim().toLowerCase();
    const ru = cell(row, ruCol, MAX_LENGTH);
    const ro = cell(row, roCol, MAX_LENGTH);
    const definitionRu = cell(row, defRuCol, MAX_DEFINITION_LENGTH);
    const definitionRo = cell(row, defRoCol, MAX_DEFINITION_LENGTH);
    const id = cell(row, idCol, MAX_LENGTH);
    const definitionId = cell(row, defIdCol, MAX_DEFINITION_LENGTH);
    if (!lemma || !(ru || ro || id || definitionRu || definitionRo || definitionId)) continue;
    filled.set(lemma, {
      ru,
      ro,
      ...(id && { id }),
      ...(definitionRu && { definitionRu }),
      ...(definitionRo && { definitionRo }),
      ...(definitionId && { definitionId }),
    });
  }
  return filled;
}

const csvField = (value: string) => (/[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);

// The whole file, one row per entry, keeping translations already filled in.
export function buildTranslationsCsv(
  entries: { lemma: string; partsOfSpeech: string[]; level: string }[],
  filled: FilledTranslations,
): string {
  const lines = ["lemma,parts_of_speech,level,ru,ro,definition_ru,definition_ro,id,definition_id"];
  for (const e of entries) {
    const t = filled.get(e.lemma);
    lines.push(
      [
        e.lemma,
        e.partsOfSpeech.join("|"),
        e.level,
        t?.ru ?? "",
        t?.ro ?? "",
        t?.definitionRu ?? "",
        t?.definitionRo ?? "",
        t?.id ?? "",
        t?.definitionId ?? "",
      ]
        .map(csvField)
        .join(","),
    );
  }
  return `${lines.join("\n")}\n`;
}

// "бассейн; пруд" → main translation and alternatives; null when empty.
export function splitTranslationCell(
  cell: string | null | undefined,
): { translation: string; alternatives: string[] } | null {
  const parts = (cell ?? "")
    .split(";")
    .map((p) => p.trim())
    .filter((p, i, all) => p !== "" && all.indexOf(p) === i);
  if (parts.length === 0) return null;
  return {
    translation: parts[0].slice(0, 200),
    alternatives: parts.slice(1, 1 + MAX_ALTERNATIVES).map((a) => a.slice(0, 200)),
  };
}
