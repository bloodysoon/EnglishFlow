import { describe, expect, it } from "vitest";

import { LOCALES } from "@/features/i18n/locales";
import { en } from "./en";
import { ro } from "./ro";
import { ru } from "./ru";

const DICTIONARIES = { en, ru, ro };

function leaves(value: unknown, path = ""): [string, unknown][] {
  if (value !== null && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) => leaves(child, path ? `${path}.${key}` : key));
  }
  return [[path, value]];
}

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
// Plural forms ("words.one", "words.few") are compared with English "other".
const englishPath = (path: string) => path.replace(/\.(one|few|many)$/, ".other");

describe("platform dictionaries", () => {
  const source = new Map(leaves(en));

  it.each(LOCALES)("%s has no empty strings", (locale) => {
    for (const [path, text] of leaves(DICTIONARIES[locale])) expect(text, path).not.toBe("");
  });

  it.each(LOCALES)("%s keeps the same placeholders as English", (locale) => {
    for (const [path, text] of leaves(DICTIONARIES[locale])) {
      const english = source.get(path) ?? source.get(englishPath(path));
      if (typeof text === "string" && typeof english === "string") {
        expect(placeholders(text), path).toEqual(placeholders(english));
      }
    }
  });
});
