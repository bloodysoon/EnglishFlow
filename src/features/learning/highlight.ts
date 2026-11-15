// Splits an example sentence around the word being learned, so the card can
// bold it: odd items are the matches. Also catches simple endings
// ("health" in "healthy" is not wanted, "walk" in "walked" is).
export function splitAroundWord(sentence: string, lemma: string): string[] {
  const escaped = lemma.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (!escaped) return [sentence];
  return sentence.split(new RegExp(`\\b(${escaped}(?:s|es|ed|d|ing)?)\\b`, "gi"));
}
