import { describe, expect, it } from "vitest";

import { localeSchema } from "./locale-schema";
import { LOCALE_PATHS, localePath, localePaths } from "./locales";

describe("localePath", () => {
  it("keeps English without a prefix", () => {
    expect(localePath("en", "home")).toBe("/");
    expect(localePath("en", "login")).toBe("/login");
    expect(localePath("en", "register")).toBe("/register");
  });

  it("prefixes the other languages", () => {
    expect(localePath("ru", "home")).toBe("/ru");
    expect(localePath("ro", "login")).toBe("/ro/login");
    expect(localePath("ru", "register")).toBe("/ru/register");
  });

  it("lists one page in every language", () => {
    expect(localePaths("login")).toEqual({ en: "/login", ru: "/ru/login", ro: "/ro/login", id: "/id/login" });
    expect(LOCALE_PATHS).toEqual({ en: "/", ru: "/ru", ro: "/ro", id: "/id" });
  });
});

describe("localeSchema", () => {
  it("accepts supported languages and falls back to English", () => {
    expect(localeSchema.parse("ro")).toBe("ro");
    expect(localeSchema.parse("de")).toBe("en");
    expect(localeSchema.parse(undefined)).toBe("en");
    expect(localeSchema.parse("../ru")).toBe("en");
  });
});
