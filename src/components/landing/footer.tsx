import Link from "next/link";

import type { LandingDictionary } from "@/features/i18n/landing";
import { localePath, type Locale } from "@/features/i18n/locales";

export function Footer({ locale, dict }: { locale: Locale; dict: LandingDictionary }) {
  const links = [
    { href: "#how-it-works", label: dict.nav.method },
    { href: "#daily-review", label: dict.nav.review },
    { href: localePath(locale, "login"), label: dict.nav.logIn },
    { href: localePath(locale, "register"), label: dict.footer.signUp },
  ];

  return (
    <footer className="border-t-[3px] border-line bg-canvas px-4 py-10 text-fg sm:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <p className="text-lg font-black tracking-tight">
          <span lang="en" className="font-display">ELEVO</span>
          <span className="text-primary" aria-hidden="true">✳</span>
          <span className="mt-1 block text-sm font-semibold tracking-normal text-muted">
            {dict.footer.tagline}
          </span>
        </p>

        <ul className="flex flex-wrap gap-x-6 gap-y-1">
          {links.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className="
                  relative inline-flex min-h-11 items-center text-sm font-black uppercase
                  after:absolute after:bottom-2 after:left-0 after:h-[3px] after:w-full
                  after:origin-left after:scale-x-0 after:bg-mark
                  after:transition-transform after:duration-300 hover:after:scale-x-100
                  motion-reduce:after:transition-none
                "
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
