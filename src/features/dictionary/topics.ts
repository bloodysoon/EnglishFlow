// Topics a dictionary word can have (dictionary_entries.topics). Plain
// slugs: the database checks against this list (keep both in sync), the
// platform dictionaries hold their names per language.
export const TOPICS = [
  "sport",
  "travel",
  "food",
  "work",
  "education",
  "health",
  "body",
  "home",
  "family",
  "clothes",
  "nature",
  "animals",
  "city",
  "shopping",
  "money",
  "technology",
  "media",
  "arts",
  "science",
  "business",
  "feelings",
  "time",
] as const;

export type Topic = (typeof TOPICS)[number];

// Parts of speech the word card can filter by.
export const TOPIC_PARTS_OF_SPEECH = ["noun", "verb", "adj", "adv"] as const;

type Param = string | string[] | undefined;
const list = (value: Param) => (Array.isArray(value) ? value.join(",") : (value ?? "")).split(",");

// The card filters from the Learn page URL (?topics=sport,travel&pos=verb);
// unknown values are dropped.
export function parseCardFilters(params: { topics?: Param; pos?: Param }) {
  return {
    topics: list(params.topics).filter((t): t is Topic => (TOPICS as readonly string[]).includes(t)),
    partsOfSpeech: list(params.pos).filter((p): p is (typeof TOPIC_PARTS_OF_SPEECH)[number] =>
      (TOPIC_PARTS_OF_SPEECH as readonly string[]).includes(p),
    ),
  };
}

// The Learn URL with one filter value switched on or off.
export function toggleFilterHref(
  filters: { topics: string[]; partsOfSpeech: string[] },
  kind: "topics" | "partsOfSpeech",
  value: string | null, // null clears that kind
): string {
  const next = { ...filters };
  next[kind] = value === null ? [] : filters[kind].includes(value) ? filters[kind].filter((v) => v !== value) : [...filters[kind], value];
  const params = new URLSearchParams();
  if (next.topics.length) params.set("topics", next.topics.join(","));
  if (next.partsOfSpeech.length) params.set("pos", next.partsOfSpeech.join(","));
  const query = params.toString().replace(/%2C/g, ",");
  return query ? `/learn?${query}` : "/learn";
}
