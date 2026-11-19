import { z } from "zod";

// The 12 English tenses, in the order learners usually meet them.
export const TENSES = [
  "present-simple",
  "present-continuous",
  "present-perfect",
  "present-perfect-continuous",
  "past-simple",
  "past-continuous",
  "past-perfect",
  "past-perfect-continuous",
  "future-simple",
  "future-continuous",
  "future-perfect",
  "future-perfect-continuous",
] as const;

export type Tense = (typeof TENSES)[number];

export const tenseSchema = z.enum(TENSES);

// Grammar names stay in English in every locale: that is how schools teach them.
export const TENSE_INFO: Record<Tense, { name: string; formula: string; example: string }> = {
  "present-simple": { name: "Present Simple", formula: "V / V+s", example: "She reads every day." },
  "present-continuous": { name: "Present Continuous", formula: "am/is/are + V-ing", example: "She is reading now." },
  "present-perfect": { name: "Present Perfect", formula: "have/has + V3", example: "She has read this book." },
  "present-perfect-continuous": {
    name: "Present Perfect Continuous",
    formula: "have/has been + V-ing",
    example: "She has been reading for an hour.",
  },
  "past-simple": { name: "Past Simple", formula: "V2 / V+ed", example: "She finished the book yesterday." },
  "past-continuous": { name: "Past Continuous", formula: "was/were + V-ing", example: "She was reading when I called." },
  "past-perfect": { name: "Past Perfect", formula: "had + V3", example: "She had read it before the film." },
  "past-perfect-continuous": {
    name: "Past Perfect Continuous",
    formula: "had been + V-ing",
    example: "She had been reading for hours.",
  },
  "future-simple": { name: "Future Simple", formula: "will + V", example: "She will read it tomorrow." },
  "future-continuous": {
    name: "Future Continuous",
    formula: "will be + V-ing",
    example: "She will be reading at nine.",
  },
  "future-perfect": { name: "Future Perfect", formula: "will have + V3", example: "She will have read it by Monday." },
  "future-perfect-continuous": {
    name: "Future Perfect Continuous",
    formula: "will have been + V-ing",
    example: "By June she will have been reading it for a year.",
  },
};

const words = (list: string) => list.trim().split(/\s+/).join("|");

// Common irregular verbs; regular ones are caught by the -ed ending.
const IRREGULAR_V2 = words(`
  was were did had went saw ate came took made got gave found thought told became left felt brought
  began kept held wrote stood heard met ran paid sat spoke led grew lost fell sent built understood
  drew broke spent drove bought wore chose sold caught taught fought flew knew threw slept won swam
  sang rode woke forgot said drank meant fed hid bit shook stole froze rose
`);
const IRREGULAR_V3 = words(`
  been done gone seen eaten come taken made got gotten given found thought told become left felt
  brought begun kept held written stood heard met run paid sat spoken led grown lost fallen sent built
  understood drawn broken spent driven bought worn chosen sold caught taught fought flown known thrown
  slept won swum sung ridden woken forgotten said drunk meant fed hidden bitten shaken stolen frozen
  risen shown born put cut read let set hit shut hurt had
`);

const ADV = String.raw`(?:(?:not|never|ever|already|just|always|still|really|often|also|recently|probably|definitely|finally|soon|usually|sometimes|all)\s+)*`;
// Questions put the subject between the helper and the verb: "Have you seen…", "Was the dog sleeping…".
const SUBJECT = String.raw`(?:(?:i|you|he|she|it|we|they|there)\s+|(?:the|a|an|my|your|his|her|its|our|their|this|that)\s+[a-z]+\s+)?`;
const GAP = ADV + SUBJECT + ADV;
const ING = String.raw`(?!(?:thing|something|anything|nothing|everything|king|ring|spring|morning|evening|ceiling|during|wedding|building)\b)[a-z]{2,}ing`;
// Regular past forms, minus everyday words that only look like them ("I need", "indeed").
const ED = String.raw`(?!(?:need|feed|speed|seed|bleed|breed|proceed|succeed|exceed|indeed|weed|greed|hundred|shed)\b)[a-z]{2,}ed`;
const V3 = String.raw`(?:${ED}|${IRREGULAR_V3})`;

// Longest forms first: each match is blanked out so "has been reading" is not also read as "has been".
const RULES: [Tense, string][] = [
  ["future-perfect-continuous", String.raw`will ${GAP}have ${ADV}been ${ADV}${ING}`],
  ["future-perfect", String.raw`will ${GAP}have ${ADV}${V3}`],
  ["future-continuous", String.raw`will ${GAP}be ${ADV}${ING}`],
  ["future-simple", String.raw`will ${GAP}[a-z]+|(?:am|is|are) ${GAP}going to [a-z]+`],
  ["past-perfect-continuous", String.raw`had ${GAP}been ${ADV}${ING}`],
  ["past-perfect", String.raw`had ${GAP}${V3}`],
  ["past-continuous", String.raw`(?:was|were) ${GAP}${ING}`],
  ["present-perfect-continuous", String.raw`(?:have|has) ${GAP}been ${ADV}${ING}`],
  ["present-perfect", String.raw`(?:have|has) ${GAP}${V3}`],
  ["present-continuous", String.raw`(?:am|is|are) ${GAP}${ING}`],
  ["past-simple", String.raw`${ED}|${IRREGULAR_V2}`],
  ["present-simple", String.raw`am|is|are|do|does|have|has`],
].map(([tense, pattern]) => [tense as Tense, String.raw`\b(?:${pattern})\b`]);

// Lower case, contractions spelled out, punctuation turned into spaces.
function normalize(sentence: string): string {
  return ` ${sentence.toLowerCase().replace(/[’‘]/g, "'")} `
    .replace(/\bwon't\b/g, "will not")
    .replace(/\bcan't\b/g, "can not")
    .replace(/n't\b/g, " not")
    .replace(/'ll\b/g, " will")
    .replace(/'ve\b/g, " have")
    .replace(/'re\b/g, " are")
    .replace(/'m\b/g, " am")
    .replace(new RegExp(String.raw`'d(?=\s+${ADV}(?:been|${V3})\b)`, "g"), " had")
    .replace(/'d\b/g, " would")
    .replace(new RegExp(String.raw`'s(?=\s+${ADV}(?:been|${V3})\b)`, "g"), " has")
    .replace(/'s\b/g, " is")
    .replace(/[^a-z]+/g, " ");
}

// Which tenses a sentence uses, by verb patterns.
// shortcut: no part-of-speech tagging, so adjectives like "tired" or "interesting" can pass as verbs;
// switch to an NLP tagger or an AI check if learners report wrong verdicts.
export function detectTenses(sentence: string): Tense[] {
  let text = normalize(sentence);
  const found: Tense[] = [];
  for (const [tense, pattern] of RULES) {
    const regex = new RegExp(pattern, "g");
    if (regex.test(text)) {
      found.push(tense);
      text = text.replace(regex, " # ");
    }
  }
  // "I like tea", "You can swim": no helper verb, no past form. That is present simple.
  if (found.length === 0 && /[a-z]/.test(text)) found.push("present-simple");
  return found;
}
