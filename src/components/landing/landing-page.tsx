import type { Metadata } from "next";

import { Navbar } from "@/components/landing/navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { SectionScrollLink } from "@/components/landing/section-scroll-link";
import { WordMarquee } from "@/components/landing/word-marquee";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { ReviewDemoSection } from "@/components/landing/review-demo-section";
import { FinalCtaSection } from "@/components/landing/final-cta-section";
import { Footer } from "@/components/landing/footer";
import { createClient } from "@/lib/supabase/server";
import { LOCALES, LOCALE_PATHS, type Locale } from "@/features/i18n/locales";
import { getLandingDictionary } from "@/features/i18n/landing";
import { getThemePreference } from "@/features/theme/server";

// Shared metadata for "/", "/ru" and "/ro": localized title and
// description plus hreflang links between the three versions.
export function landingMetadata(locale: Locale): Metadata {
  const { meta } = getLandingDictionary(locale);

  return {
    title: { absolute: meta.title },
    description: meta.description,
    alternates: {
      canonical: LOCALE_PATHS[locale],
      languages: {
        ...Object.fromEntries(LOCALES.map((l) => [l, LOCALE_PATHS[l]])),
        "x-default": LOCALE_PATHS.en,
      },
    },
  };
}

export async function LandingPage({ locale }: { locale: Locale }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthenticated = Boolean(user);
  const dict = getLandingDictionary(locale);

  // The theme itself is on <html> (root layout); the toggle needs it too.
  const themePreference = await getThemePreference();

  return (
    // lang here because the root layout's <html lang="en"> is shared by
    // every route; this sets the language for everything on the page.
    <div
      lang={locale}
      className="min-h-dvh overflow-x-clip bg-canvas text-fg"
    >
      <Navbar
        isAuthenticated={isAuthenticated}
        email={user?.email ?? ""}
        themePreference={themePreference}
        locale={locale}
        dict={dict.nav}
      />

      <main>
        {/* First screen: hero, the way down, and the word ticker. */}
        <div className="flex min-h-[calc(100dvh-var(--navbar-height))] flex-col">
          <HeroSection isAuthenticated={isAuthenticated} locale={locale} dict={dict} />
          <SectionScrollLink href="#how-it-works" label={dict.scroll.toMethod} className="mb-8" />
          <WordMarquee />
        </div>

        <HowItWorksSection locale={locale} dict={dict} />

        <ReviewDemoSection isAuthenticated={isAuthenticated} locale={locale} dict={dict} />

        <FinalCtaSection isAuthenticated={isAuthenticated} locale={locale} dict={dict} />
      </main>

      <Footer locale={locale} dict={dict} />
    </div>
  );
}
