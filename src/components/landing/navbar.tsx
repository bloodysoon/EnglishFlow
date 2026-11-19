"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { buttonClasses } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LOCALE_PATHS, fill, localePath, type Locale } from "@/features/i18n/locales";
import type { LandingDictionary } from "@/features/i18n/landing";
import type { ThemePreference } from "@/features/theme/theme";

const SECTIONS = [
  { id: "how-it-works", key: "method" },
  { id: "daily-review", key: "review" },
  { id: "sentence-practice", key: "sentences" },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

type NavbarProps = {
  isAuthenticated: boolean;
  email: string;
  themePreference: ThemePreference;
  locale: Locale;
  dict: LandingDictionary["nav"];
};

export function Navbar({ isAuthenticated, email, themePreference, locale, dict }: NavbarProps) {
  const [activeSection, setActiveSection] = useState<SectionId | null>(null);

  useEffect(() => {
    const update = () => {
      const navbarHeight =
        document.querySelector("header")?.getBoundingClientRect().height ?? 93;
      const checkpoint = navbarHeight + 20;

      // Last section whose top has passed under the navbar wins.
      let current: SectionId | null = null;
      for (const { id } of SECTIONS) {
        const top = document.getElementById(id)?.getBoundingClientRect().top;
        if (top !== undefined && top <= checkpoint) current = id;
      }

      setActiveSection(current);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const initial = email.charAt(0).toUpperCase() || "U";

  return (
    <header
      className={`
        sticky top-0 z-50 w-full shrink-0
        border-b-[3px] border-line bg-canvas text-fg
      `}
    >
      <nav
        aria-label={dict.label}
        className="relative mx-auto flex w-full max-w-[1440px] items-center justify-between gap-2 px-4 py-5 sm:gap-3 sm:px-8 lg:px-10"
      >
        <Link
          href={LOCALE_PATHS[locale]}
          aria-label={dict.home}
          className="group font-display inline-flex min-h-11 items-center text-xl font-black tracking-tight sm:text-2xl"
        >
          <span aria-hidden="true" lang="en">ELEVO</span>
          <span
            aria-hidden="true"
            className="inline-block text-primary transition-transform duration-500 ease-out group-hover:rotate-180 motion-reduce:transition-none"
          >
            ✳
          </span>
        </Link>

        <ul className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 xl:flex">
          {SECTIONS.map(({ id, key }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                aria-current={activeSection === id ? "location" : undefined}
                className="
                  relative inline-flex min-h-11 items-center text-sm font-black uppercase
                  after:absolute after:bottom-2 after:left-0 after:h-[3px] after:w-full
                  after:origin-left after:scale-x-0 after:bg-mark
                  after:transition-transform after:duration-300 after:ease-out
                  hover:after:scale-x-100 aria-[current=location]:after:scale-x-100
                  motion-reduce:after:transition-none
                "
              >
                {dict[key]}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2 sm:gap-3">
          <LanguageSwitcher locale={locale} label={dict.language} />

          <ThemeToggle
            initialPreference={themePreference}
            labels={{ label: dict.themeLabel, toLight: dict.themeToLight, toDark: dict.themeToDark }}
          />

          {isAuthenticated && (
            <Link
              href="/dashboard"
              title={email}
              aria-label={fill(dict.openDashboardFor, { email })}
              className="
                lift-safe flex h-11 w-11 items-center justify-center
                border-[3px] border-line bg-chip text-sm font-black text-on-box
                shadow-brutal-sm transition-transform duration-150
                hover:-translate-y-0.5 motion-reduce:transition-none
              "
            >
              {initial}
            </Link>
          )}

          {/* Phones have no room for "Log in" next to the sign-up button;
              the hero repeats it under its call to action. */}
          {!isAuthenticated && (
            <Link
              href={localePath(locale, "login")}
              className="inline-flex min-h-11 items-center px-1 text-sm font-black uppercase underline decoration-[3px] underline-offset-4 hover:decoration-mark max-sm:hidden"
            >
              {dict.logIn}
            </Link>
          )}

          {/* On phones a signed-in visitor gets only the avatar link above:
              "Dashboard" next to it would not fit a 320px row. */}
          <Link
            href={isAuthenticated ? "/dashboard" : localePath(locale, "register")}
            className={buttonClasses({
              variant: "primary",
              size: "toolbar",
              className: isAuthenticated ? "max-sm:hidden" : "",
            })}
          >
            {isAuthenticated ? dict.dashboard : dict.start}
          </Link>
        </div>
      </nav>
    </header>
  );
}
