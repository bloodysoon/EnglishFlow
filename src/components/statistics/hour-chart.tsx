"use client";

import { useSyncExternalStore } from "react";

import { fill, type Locale } from "@/features/i18n/locales";
import { plural, type Plural } from "@/features/i18n/plural";
import { peakIndex, shiftHours } from "@/features/learning/statistics";
import { BarChart } from "./bar-chart";

type Props = {
  hoursUtc: number[];
  locale: Locale;
  reviewsCount: Plural; // "{n} reviews"
  peakLabel: string; // "Busiest hour: {hour}"
};

const noop = () => () => {};
// The server does not know the viewer's time zone: it renders UTC, the
// browser then shifts to local time.
const localOffset = () => -new Date().getTimezoneOffset();
const utcOffset = () => 0;

const hourLabel = (h: number) => `${String(h).padStart(2, "0")}:00`;

export function HourChart({ hoursUtc, locale, reviewsCount, peakLabel }: Props) {
  const offset = useSyncExternalStore(noop, localOffset, utcOffset);
  const hours = shiftHours(hoursUtc, offset);
  const peak = peakIndex(hours);

  return (
    <>
      <BarChart
        values={hours}
        labels={hours.map((_, h) => String(h))}
        tickEvery={6}
        titles={hours.map((n, h) => `${hourLabel(h)} · ${plural(locale, n, reviewsCount)}`)}
        peak={peak}
      />
      {peak >= 0 && <p className="mt-3 text-sm font-black">{fill(peakLabel, { hour: hourLabel(peak) })}</p>}
    </>
  );
}
