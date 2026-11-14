"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

import { rememberLocale } from "@/features/i18n/client";
import { LOCALES, LOCALE_NAMES, LOCALE_PATHS, type Locale } from "@/features/i18n/locales";

type LanguageSwitcherProps = {
  locale: Locale;
  label: string;
  // Where each language goes; defaults to the landing page.
  paths?: Record<Locale, string>;
};

// Native <details> menu: works without JS; the effect only adds closing
// on an outside click and on Escape.
export function LanguageSwitcher({ locale, label, paths = LOCALE_PATHS }: LanguageSwitcherProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const details = detailsRef.current;
    if (!details) return;

    const close = (event: Event) => {
      if (!details.open) return;
      if (event instanceof KeyboardEvent) {
        if (event.key !== "Escape") return;
        details.open = false;
        details.querySelector("summary")?.focus();
        return;
      }
      if (!details.contains(event.target as Node)) details.open = false;
    };

    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, []);

  return (
    <details ref={detailsRef} className="group relative">
      <summary
        aria-label={`${label}: ${LOCALE_NAMES[locale]}`}
        className="
          flex h-11 min-w-11 cursor-pointer list-none items-center justify-center gap-1 px-2
          border-[3px] border-line bg-raised text-sm font-black text-fg uppercase shadow-brutal-sm
          transition-[transform,box-shadow,background-color] duration-150
          hover:-translate-y-0.5 hover:bg-box-2 hover:text-on-box hover:shadow-brutal-md
          group-open:bg-box-2 group-open:text-on-box
          motion-reduce:transition-none
          [&::-webkit-details-marker]:hidden
        "
      >
        {locale}
        <ChevronDown
          aria-hidden="true"
          strokeWidth={3}
          className="hidden h-4 w-4 transition-transform duration-200 group-open:rotate-180 min-[400px]:block motion-reduce:transition-none"
        />
      </summary>

      <ul className="absolute top-full right-0 z-50 mt-3 min-w-44 border-[3px] border-line bg-raised text-fg shadow-brutal">
        {LOCALES.map((item) => (
          <li key={item} className="border-b-2 border-line last:border-b-0">
            <Link
              href={paths[item]}
              hrefLang={item}
              lang={item}
              aria-current={item === locale ? "page" : undefined}
              onClick={() => rememberLocale(item)}
              className="
                flex min-h-11 items-center justify-between gap-4 px-4 font-black
                transition-colors duration-150 hover:bg-box-2 hover:text-on-box
                aria-[current=page]:bg-chip aria-[current=page]:text-on-box
                motion-reduce:transition-none
              "
            >
              {LOCALE_NAMES[item]}
              <span className="text-xs uppercase opacity-70">{item}</span>
            </Link>
          </li>
        ))}
      </ul>
    </details>
  );
}
