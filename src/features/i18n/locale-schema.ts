import { z } from "zod";

import { LOCALES } from "./locales";

// For untrusted input (query params, server action data): unknown or
// missing → English. Separate from locales.ts so client bundles that only
// need the locale list don't pull in Zod.
export const localeSchema = z.enum(LOCALES).catch("en");
