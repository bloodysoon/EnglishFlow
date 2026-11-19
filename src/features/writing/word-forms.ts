// Does a sentence use the word, in any common form? "run" counts as run, runs, ran, running;
// "suitcase" as suitcases; "boarding pass" as boarding passes.

// Irregular forms: base, then its other forms.
const IRREGULAR = new Map(
  `be am is are was were been being|have has had having|do does did done|go goes went gone|say said
  make made|get got gotten|know knew known|think thought|take took taken|see saw seen|come came
  give gave given|find found|tell told|become became|leave left|feel felt|bring brought|begin began begun
  keep kept|hold held|write wrote written|stand stood|hear heard|mean meant|meet met|run ran|pay paid
  sit sat|speak spoke spoken|lie lay lain|lead led|grow grew grown|lose lost|fall fell fallen|send sent
  build built|understand understood|draw drew drawn|break broke broken|spend spent|rise rose risen
  drive drove driven|buy bought|wear wore worn|choose chose chosen|sell sold|catch caught|teach taught
  fight fought|fly flew flown|throw threw thrown|sleep slept|win won|swim swam swum|sing sang sung
  ride rode ridden|wake woke woken|forget forgot forgotten|drink drank drunk|eat ate eaten|feed fed
  hide hid hidden|bite bit bitten|shake shook shaken|steal stole stolen|freeze froze frozen|show shown
  light lit|lend lent|bend bent|deal dealt|dig dug|hang hung|shoot shot|stick stuck|strike struck
  swing swung|tear tore torn|bear bore born borne|beat beaten|blow blew blown|forgive forgave forgiven
  ring rang rung|seek sought|sink sank sunk|slide slid|spin spun|stink stank|sweep swept|weep wept
  bleed bled|breed bred|flee fled|grind ground|kneel knelt|leap leapt|shine shone|smell smelt
  spell spelt|spill spilt|burn burnt|dream dreamt|learn learnt|can could|will would|shall should
  may might|good better best|bad worse worst|well better best|far further farther furthest
  many more most|much more most|little less least|man men|woman women|child children|person people
  foot feet|tooth teeth|mouse mice|goose geese|ox oxen`
    .split(/[|\n]/)
    .map((group) => {
      const [base, ...forms] = group.trim().split(/\s+/);
      return [base, forms] as const;
    }),
);

const VOWEL = /[aeiou]/;

// Regular endings: plurals, -s, -ed, -ing, -er/-est, with the usual spelling changes.
function formsOf(word: string): Set<string> {
  const forms = new Set([word, ...(IRREGULAR.get(word) ?? [])]);
  const last = word.at(-1) ?? "";
  const stem = word.slice(0, -1);
  for (const end of ["s", "es", "ed", "d", "ing", "er", "r", "est", "st"]) forms.add(word + end);
  if (last === "y" && !VOWEL.test(word.at(-2) ?? "")) for (const end of ["ies", "ied", "ier", "iest"]) forms.add(stem + end);
  if (last === "e") for (const end of ["ing", "ed", "er", "est"]) forms.add(stem + end);
  if (word.endsWith("ie")) forms.add(word.slice(0, -2) + "ying");
  if (word.endsWith("fe")) forms.add(word.slice(0, -2) + "ves");
  else if (last === "f") forms.add(stem + "ves");
  // stop → stopped, big → bigger. A wrongly doubled spelling is LanguageTool's job to flag.
  if (last && !VOWEL.test(last) && !"wxy".includes(last)) for (const end of ["ed", "ing", "er", "est"]) forms.add(word + last + end);
  return forms;
}

// Letters only, so "brand-new" matches "brand new" and "suitcase's" still has "suitcase".
const tokens = (text: string) => text.toLowerCase().replace(/[’']/g, "").match(/[a-z]+/g) ?? [];

export function containsWord(sentence: string, lemma: string): boolean {
  const words = tokens(sentence);
  const wanted = tokens(lemma).map(formsOf);
  if (wanted.length === 0) return true;
  // Each word of the lemma in a row; any of them may be inflected ("gave up", "boarding passes").
  return words.some((_, start) => wanted.every((forms, i) => forms.has(words[start + i] ?? "")));
}
