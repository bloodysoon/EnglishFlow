import { describe, expect, it } from "vitest";

import { LEITNER_BOXES } from "@/features/leitner/boxes";
import { formatReviewIntervalFor } from "./review-interval";

describe("formatReviewIntervalFor", () => {
  it("keeps the English wording for en", () => {
    expect(formatReviewIntervalFor("en", 3)).toBe("every 3 days");
  });

  it.each([
    [1, "каждый день"],
    [3, "каждые 3 дня"],
    [5, "каждые 5 дней"],
    [7, "каждую неделю"],
    [14, "каждые 2 недели"],
    [21, "каждые 3 недели"],
    [30, "каждый месяц"],
    [22, "каждые 22 дня"],
    [31, "каждый 31 день"],
    [35, "каждые 5 недель"],
  ])("ru: %i → %s", (days, expected) => {
    expect(formatReviewIntervalFor("ru", days)).toBe(expected);
  });

  it.each([
    [1, "în fiecare zi"],
    [3, "la fiecare 3 zile"],
    [7, "în fiecare săptămână"],
    [14, "la fiecare 2 săptămâni"],
    [30, "în fiecare lună"],
    [20, "la fiecare 20 de zile"],
    [101, "la fiecare 101 zile"],
    [120, "la fiecare 120 de zile"],
  ])("ro: %i → %s", (days, expected) => {
    expect(formatReviewIntervalFor("ro", days)).toBe(expected);
  });

  it.each([
    [1, "setiap hari"],
    [3, "setiap 3 hari"],
    [7, "setiap minggu"],
    [14, "setiap 2 minggu"],
    [30, "setiap bulan"],
  ])("id: %i → %s", (days, expected) => {
    expect(formatReviewIntervalFor("id", days)).toBe(expected);
  });

  it("covers every Leitner box in every language", () => {
    for (const locale of ["en", "ru", "ro", "id"] as const) {
      for (const { intervalDays } of LEITNER_BOXES) {
        expect(formatReviewIntervalFor(locale, intervalDays)).not.toBe("");
      }
    }
  });

  it.each([0, -1, 2.5])("rejects %s days", (days) => {
    expect(() => formatReviewIntervalFor("ru", days)).toThrow(RangeError);
    expect(() => formatReviewIntervalFor("ro", days)).toThrow(RangeError);
  });
});
