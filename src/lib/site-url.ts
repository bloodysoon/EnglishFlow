// Public origin for absolute URLs (canonical, hreflang, sitemap, Open Graph).
// shortcut: falls back to localhost when NEXT_PUBLIC_APP_URL is unset, so a
// build without it ships localhost links; set it in every Vercel environment.
export const SITE_URL = new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
