import type { ReactNode } from "react";

import { HeroShelf } from "@/components/landing/hero-shelf";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { LogoLink } from "@/components/ui/logo-link";
import { riseStyle } from "@/components/ui/rise";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { getLandingDictionary } from "@/features/i18n/landing";
import { localePath, localePaths, type Locale, type LocalizedPage } from "@/features/i18n/locales";
import { getThemePreference } from "@/features/theme/server";

type AuthShellProps = {
  locale: Locale;
  // Which page this is, so the language switcher stays on it.
  page: Extract<LocalizedPage, "login" | "register">;
  sticker: string;
  titleLine1: string;
  titleLine2: string;
  lead: ReactNode;
  // The form (or the "check your inbox" card).
  children: ReactNode;
};

// Frame for the login and register pages, in the landing hero's style:
// the pitch on the left (with the hopping Leitner shelf on desktop),
// the form on the right; stacked below 1280px.
export async function AuthShell({ locale, page, sticker, titleLine1, titleLine2, lead, children }: AuthShellProps) {
  const themePreference = await getThemePreference();
  const { nav } = getLandingDictionary(locale);

  return (
    // lang: the root layout's <html lang="en"> is shared by every route.
    <div lang={locale} className="flex min-h-dvh flex-col overflow-x-clip bg-canvas text-fg">
      <header className="border-b-[3px] border-line pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-3 px-4 py-5 sm:px-8 lg:px-10">
          <LogoLink href={localePath(locale, "home")} label={nav.home} />

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher locale={locale} label={nav.language} paths={localePaths(page)} />
            <ThemeToggle
              initialPreference={themePreference}
              labels={{ label: nav.themeLabel, toLight: nav.themeToLight, toDark: nav.themeToDark }}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[1200px] flex-1 items-center gap-10 px-4 py-10 sm:px-8 sm:py-14 lg:px-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,440px)] xl:gap-16">
        <div className="flex min-w-0 flex-col items-start gap-5 sm:gap-6">
          <span className="rise brutal-sticker text-xs sm:text-sm" style={riseStyle(0)}>
            {sticker}
            <span className="brutal-sticker__icon" aria-hidden="true">
              ✳
            </span>
          </span>

          <h1
            className="rise flex flex-col items-start gap-3 text-[clamp(1.75rem,7vw,4rem)] leading-[0.98] font-black tracking-tight uppercase xl:text-[3.25rem]"
            style={riseStyle(1)}
          >
            <span>{titleLine1}</span>{" "}
            {/* Wraps only on narrow phones; on wider screens it stays one line so
                the box hugs the words. */}
            <span className="brutal-lift text-[0.8em] whitespace-normal min-[400px]:whitespace-nowrap">{titleLine2}</span>
          </h1>

          <p
            className="rise max-w-md text-base leading-relaxed font-semibold text-muted sm:text-lg"
            style={riseStyle(2)}
          >
            {lead}
          </p>

          <div className="rise hidden xl:block" style={riseStyle(3)}>
            <HeroShelf />
          </div>
        </div>

        <div className="rise w-full min-w-0" style={riseStyle(2)}>
          {children}
        </div>
      </main>
    </div>
  );
}
