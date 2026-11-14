import { fill, type Locale } from "./locales";

// One string per plural category; "{n}" is the count. English needs one
// and other, Russian one/few/many, Romanian one/few/other.
export type Plural = { one: string; few?: string; many?: string; other: string };

const rules = new Map<Locale, Intl.PluralRules>();

export function plural(locale: Locale, n: number, forms: Plural): string {
  let rule = rules.get(locale);
  if (!rule) rules.set(locale, (rule = new Intl.PluralRules(locale)));
  const category = rule.select(n) as keyof Plural;
  return fill(forms[category] ?? forms.other, { n });
}
