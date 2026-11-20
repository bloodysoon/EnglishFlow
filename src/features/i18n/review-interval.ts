import { formatReviewInterval } from "@/features/leitner/boxes";
import type { Locale } from "@/features/i18n/locales";

function assertInterval(days: number) {
  if (!Number.isInteger(days) || days < 1) {
    throw new RangeError(`Interval must be a positive whole number of days, got ${days}`);
  }
}

const ruPlural = new Intl.PluralRules("ru");

// "каждый день", "каждые 3 дня", "каждую неделю", "каждые 2 недели",
// "каждый месяц", "каждые 5 дней", "каждый 21 день".
function formatRu(days: number): string {
  assertInterval(days);
  if (days === 1) return "каждый день";
  if (days === 30) return "каждый месяц";

  const [count, forms] =
    days % 7 === 0
      ? [days / 7, { one: "неделю", few: "недели", many: "недель" }]
      : [days, { one: "день", few: "дня", many: "дней" }];

  if (days % 7 === 0 && count === 1) return "каждую неделю";

  const category = ruPlural.select(count);
  if (category === "one") return `каждый ${count} ${forms.one}`;
  return `каждые ${count} ${category === "few" ? forms.few : forms.many}`;
}

// Romanian puts "de" between a number and its noun when the number is 20+
// and its last two digits are 00 or 20–99: "21 de zile", "100 de zile",
// but "101 zile".
function roOf(count: number): string {
  const rest = count % 100;
  return count >= 20 && (rest === 0 || rest >= 20) ? " de" : "";
}

// "în fiecare zi", "la fiecare 3 zile", "în fiecare săptămână",
// "la fiecare 2 săptămâni", "în fiecare lună".
function formatRo(days: number): string {
  assertInterval(days);
  if (days === 1) return "în fiecare zi";
  if (days === 30) return "în fiecare lună";

  if (days % 7 === 0) {
    const weeks = days / 7;
    return weeks === 1
      ? "în fiecare săptămână"
      : `la fiecare ${weeks}${roOf(weeks)} săptămâni`;
  }

  return `la fiecare ${days}${roOf(days)} zile`;
}

// "setiap hari", "setiap 3 hari", "setiap minggu", "setiap 2 minggu", "setiap bulan".
function formatId(days: number): string {
  assertInterval(days);
  if (days === 1) return "setiap hari";
  if (days === 30) return "setiap bulan";
  if (days % 7 === 0) return days === 7 ? "setiap minggu" : `setiap ${days / 7} minggu`;
  return `setiap ${days} hari`;
}

export function formatReviewIntervalFor(locale: Locale, days: number): string {
  switch (locale) {
    case "ru":
      return formatRu(days);
    case "ro":
      return formatRo(days);
    case "id":
      return formatId(days);
    default:
      return formatReviewInterval(days);
  }
}
