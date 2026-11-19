import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { LOCALES } from "@/features/i18n/locales";
import { SITE_URL } from "@/lib/site-url";
import robots from "./robots";
import sitemap from "./sitemap";

describe("sitemap", () => {
  const entries = sitemap();

  it("lists the landing once per language, as absolute URLs", () => {
    expect(entries).toHaveLength(LOCALES.length);
    for (const { url } of entries) expect(url.startsWith(SITE_URL.origin)).toBe(true);
  });

  it("links every entry to all its translations", () => {
    for (const entry of entries) {
      expect(Object.keys(entry.alternates?.languages ?? {}).sort()).toEqual([...LOCALES].sort());
    }
  });
});

describe("robots", () => {
  const { rules, sitemap: sitemapUrl } = robots();
  const disallowed = [rules].flat().flatMap((rule) => [rule.disallow ?? []].flat());

  // A new page in the (platform) group needs an account, so it should not be
  // crawled; this fails until it is added to PRIVATE_PATHS in robots.ts.
  it("keeps every platform route out of the index", () => {
    const platformRoutes = readdirSync(join(__dirname, "(platform)"), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => `/${entry.name}`);

    expect(platformRoutes.length).toBeGreaterThan(0);
    for (const route of platformRoutes) expect(disallowed, route).toContain(route);
  });

  it("points crawlers to the sitemap", () => {
    expect(sitemapUrl).toBe(new URL("/sitemap.xml", SITE_URL).href);
  });
});
