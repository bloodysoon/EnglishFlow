import type { Metadata } from "next";
import { Archivo, Onest, Unbounded } from "next/font/google";
import "./globals.css";
import { cookies } from "next/headers";
import { getMotionPaused } from "@/features/motion/server";
import { ACCENT_COOKIE, parseAccent } from "@/features/rewards/levels";
import { getThemePreference } from "@/features/theme/server";
import { SITE_URL } from "@/lib/site-url";

// One variable family for the whole app: normal width for reading,
// expanded width (wdth axis) for the display voice. See globals.css.
// latin-ext covers Romanian (ă â î ș ț).
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
});

// Archivo has no Cyrillic, so Russian text uses these two instead
// (globals.css, :lang(ru)). Not preloaded: only Russian pages need them.
const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["cyrillic"],
  weight: ["700", "900"],
  preload: false,
});

const onest = Onest({
  variable: "--font-onest",
  subsets: ["cyrillic"],
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: SITE_URL,
  twitter: { card: "summary_large_image" },
  title: {
    default: "Elevo · Learn words. Remember forever.",
    template: "%s · Elevo",
  },
  description:
    "Learn English vocabulary with spaced repetition and the Leitner system. Practice a little every day.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Theme on <html> so every page, the body and the scrollbars match.
  const themePreference = await getThemePreference();
  const motionPaused = await getMotionPaused();
  // shortcut: the level lock is checked in Settings only; a hand-made cookie just changes a colour.
  const accent = parseAccent((await cookies()).get(ACCENT_COOKIE)?.value);

  return (
    <html
      lang="en"
      data-theme={themePreference}
      data-motion-paused={motionPaused ? "" : undefined}
      data-accent={accent === "forest" ? undefined : accent}
      className={`${archivo.variable} ${unbounded.variable} ${onest.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
