import { describe, expect, it } from "vitest";

import { AUTH_ERROR_CODES } from "@/features/auth/errors";
import { LOCALES } from "@/features/i18n/locales";
import { getAuthDictionary } from "./index";

function leaves(value: unknown, path = ""): [string, unknown][] {
  if (value !== null && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) => leaves(child, path ? `${path}.${key}` : key));
  }
  return [[path, value]];
}

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe("auth dictionaries", () => {
  const en = new Map(leaves(getAuthDictionary("en")));

  it.each(LOCALES)("%s has a message for every error code", (locale) => {
    const { errors } = getAuthDictionary(locale);
    expect(Object.keys(errors).sort()).toEqual([...AUTH_ERROR_CODES].sort());
  });

  it.each(LOCALES)("%s has no empty strings and the same placeholders as English", (locale) => {
    for (const [path, text] of leaves(getAuthDictionary(locale))) {
      expect(text, path).not.toBe("");
      const source = en.get(path);
      if (typeof text === "string" && typeof source === "string") {
        expect(placeholders(text), path).toEqual(placeholders(source));
      }
    }
  });
});
