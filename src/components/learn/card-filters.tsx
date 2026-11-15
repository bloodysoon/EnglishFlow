"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";

import { buttonClasses } from "@/components/ui/button";
import { TOPIC_PARTS_OF_SPEECH, toggleFilterHref } from "@/features/dictionary/topics";
import { fill } from "@/features/i18n/locales";
import type { PlatformDictionary } from "@/features/i18n/platform";
import type { CardFilters } from "@/features/learning/queries";

const chip =
  "inline-flex min-h-10 shrink-0 items-center gap-1 border-[2px] border-line px-2.5 text-xs font-black uppercase";

type Names = { topicNames: Record<string, string>; posNames: Record<string, string> };

function activeFilters(filters: CardFilters, { topicNames, posNames }: Names) {
  return [
    ...filters.topics.map((value) => ({ kind: "topics" as const, value, name: topicNames[value] ?? value })),
    ...filters.partsOfSpeech.map((value) => ({
      kind: "partsOfSpeech" as const,
      value,
      name: posNames[value] ?? value,
    })),
  ];
}

// "Filters" button for the Learn header: a <details> dropdown over the page
// that closes on Escape or a click outside. It stays open after a pick, so
// several filters can be chosen in a row. Plain links: the filters live in
// the URL, so they survive a reload and can be shared.
export function CardFilterMenu({
  filters,
  topicsInUse,
  t,
  topicNames,
  posNames,
}: {
  filters: CardFilters;
  topicsInUse: string[];
  t: PlatformDictionary["triage"];
} & Names) {
  const ref = useRef<HTMLDetailsElement>(null);
  const count = activeFilters(filters, { topicNames, posNames }).length;

  useEffect(() => {
    const close = (focusButton: boolean) => {
      const details = ref.current;
      if (!details?.open) return;
      details.open = false;
      if (focusButton) details.querySelector("summary")?.focus();
    };
    const onPointer = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) close(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close(true);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const groups = [
    { kind: "topics" as const, label: t.filterTopics, values: topicsInUse, names: topicNames },
    { kind: "partsOfSpeech" as const, label: t.filterPos, values: [...TOPIC_PARTS_OF_SPEECH], names: posNames },
  ].filter((group) => group.values.length > 0);

  return (
    <details ref={ref} data-tour="filters" className="group relative">
      <summary
        aria-label={t.filters}
        className={buttonClasses({
          size: "toolbar",
          variant: "secondary",
          className:
            "cursor-pointer list-none select-none group-open:bg-box-2 group-open:text-on-box [&::-webkit-details-marker]:hidden",
        })}
      >
        <SlidersHorizontal className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
        <span className="hidden sm:inline">{t.filters}</span>
        {count > 0 && <span className="border-[2px] border-line bg-box-2 px-1.5 text-xs text-on-box">{count}</span>}
        <ChevronDown
          className="hidden h-4 w-4 transition-transform group-open:rotate-180 sm:block"
          strokeWidth={3}
          aria-hidden="true"
        />
      </summary>

      <div className="absolute right-0 z-30 mt-3 max-h-[70vh] w-[min(34rem,calc(100vw-2rem))] space-y-4 overflow-y-auto border-[3px] border-line bg-raised p-4 shadow-brutal">
        {groups.map(({ kind, label, values, names }) => (
          <div key={kind} role="group" aria-label={label}>
            <p className="mb-2 text-xs font-black tracking-widest text-muted uppercase">{label}</p>
            <div className="flex flex-wrap gap-2">
              <Link
                href={toggleFilterHref(filters, kind, null)}
                className={`${chip} ${filters[kind].length === 0 ? "bg-chip text-on-box" : "bg-raised hover:bg-surface"}`}
              >
                {filters[kind].length === 0 && "✓ "}
                {t.filterAll}
              </Link>
              {values.map((value) => {
                const on = filters[kind].includes(value);
                return (
                  <Link
                    key={value}
                    href={toggleFilterHref(filters, kind, value)}
                    className={`${chip} ${on ? "bg-box-2 text-on-box" : "bg-raised hover:bg-surface"}`}
                  >
                    {/* The tick is the on/off state for everyone, screen readers included. */}
                    {on && "✓ "}
                    {names[value] ?? value}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </details>
  );
}

// The chosen filters above the word card, each removable on its own.
export function ActiveFilterChips({
  filters,
  t,
  topicNames,
  posNames,
}: {
  filters: CardFilters;
  t: PlatformDictionary["triage"];
} & Names) {
  const active = activeFilters(filters, { topicNames, posNames });
  if (active.length === 0) return null;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {active.map(({ kind, value, name }) => (
        <Link
          key={`${kind}-${value}`}
          href={toggleFilterHref(filters, kind, value)}
          aria-label={fill(t.removeFilter, { name })}
          className={`${chip} bg-box-2 text-on-box hover:bg-raised`}
        >
          {name}
          <X className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
        </Link>
      ))}
      {active.length > 1 && (
        <Link
          href="/learn"
          className="inline-flex min-h-10 items-center px-1 text-xs font-black uppercase underline decoration-2 underline-offset-4 hover:decoration-mark"
        >
          {t.clearFilters}
        </Link>
      )}
    </div>
  );
}
