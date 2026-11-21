import { describe, expect, it } from "vitest";

import { LOCALES, fill } from "@/features/i18n/locales";
import { getLandingDictionary } from "./index";

// Every leaf string with its dotted path, e.g. ["hero.titleLine1", "..."].
function leaves(value: unknown, path = ""): [string, unknown][] {
  if (value !== null && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) =>
      leaves(child, path ? `${path}.${key}` : key),
    );
  }
  return [[path, value]];
}

const placeholders = (text: string) =>
  [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("landing dictionaries", () => {
  const en = new Map(leaves(getLandingDictionary("en")));

  it.each(LOCALES)("%s has no empty strings", (locale) => {
    for (const [path, text] of leaves(getLandingDictionary(locale))) {
      expect(text, path).not.toBe("");
    }
  });

  it.each(LOCALES)("%s keeps the same placeholders as English", (locale) => {
    for (const [path, text] of leaves(getLandingDictionary(locale))) {
      const source = en.get(path);
      if (typeof text === "string" && typeof source === "string") {
        expect(placeholders(text), path).toEqual(placeholders(source));
      }
    }
  });

  it("shows the page's own language as the word translation", () => {
    expect(getLandingDictionary("ru").translationLanguages).toEqual(["ru"]);
    expect(getLandingDictionary("ro").translationLanguages).toEqual(["ro"]);
    expect(getLandingDictionary("id").translationLanguages).toEqual(["id"]);
  });
});

describe("fill", () => {
  it("replaces known placeholders", () => {
    expect(fill("Word {current} of {total}", { current: 2, total: 5 })).toBe(
      "Word 2 of 5",
    );
  });

  it("leaves unknown placeholders visible", () => {
    expect(fill("Hi {name}", {})).toBe("Hi {name}");
  });
});
