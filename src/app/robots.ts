import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site-url";

// Only the public pages are worth crawling; the platform needs an account.
const PRIVATE_PATHS = [
  "/achievements",
  "/admin",
  "/auth",
  "/dashboard",
  "/learn",
  "/settings",
  "/statistics",
  "/subscription",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
    sitemap: new URL("/sitemap.xml", SITE_URL).href,
  };
}
