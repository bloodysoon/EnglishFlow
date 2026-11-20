import { describe, expect, it } from "vitest";

import { localeFromAcceptLanguage, localeRedirectPath, preferredLocale } from "./preferred-locale";

describe("localeFromAcceptLanguage", () => {
  it.each([
    ["ru-RU,ru;q=0.9,en-US;q=0.8", "ru"],
    ["ro-MD,ro;q=0.9,en;q=0.8", "ro"],
    ["id-ID,id;q=0.9,en;q=0.8", "id"],
    ["en-US,en;q=0.9,ru;q=0.8", "en"],
    ["de-DE,de;q=0.9,ro;q=0.5", "ro"],
    ["en;q=0.5,ru;q=0.9", "ru"],
  ])("%s → %s", (header, expected) => {
    expect(localeFromAcceptLanguage(header)).toBe(expected);
  });

  it.each([null, "", "de-DE,fr;q=0.9", "ru;q=0", "*"])("returns null for %j", (header) => {
    expect(localeFromAcceptLanguage(header)).toBeNull();
  });
});

describe("preferredLocale", () => {
  it("lets an explicit choice win over the browser", () => {
    expect(preferredLocale("en", "ru-RU,ru")).toBe("en");
    expect(preferredLocale("ro", "ru-RU,ru")).toBe("ro");
  });

  it("ignores a cookie that is not a supported language", () => {
    expect(preferredLocale("../evil", "ru")).toBe("ru");
    expect(preferredLocale("fr", undefined)).toBe("en");
  });

  it("falls back to the browser, then English", () => {
    expect(preferredLocale(undefined, "ro-RO")).toBe("ro");
    expect(preferredLocale(undefined, null)).toBe("en");
  });
});

describe("localeRedirectPath", () => {
  it("sends English public pages to the preferred language", () => {
    expect(localeRedirectPath("/", "ru")).toBe("/ru");
    expect(localeRedirectPath("/login", "ro")).toBe("/ro/login");
    expect(localeRedirectPath("/register", "ru")).toBe("/ru/register");
  });

  it("leaves English visitors and every other path alone", () => {
    expect(localeRedirectPath("/login", "en")).toBeNull();
    expect(localeRedirectPath("/dashboard", "ru")).toBeNull();
    expect(localeRedirectPath("/ru/login", "ro")).toBeNull();
    expect(localeRedirectPath("/auth/callback", "ru")).toBeNull();
  });
});
