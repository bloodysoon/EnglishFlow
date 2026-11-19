import { describe, expect, it } from "vitest";

import { detectTenses, TENSE_INFO, TENSES, type Tense } from "./tenses";

const cases: [Tense, string[]][] = [
  ["present-simple", ["I like green tea.", "She reads every day.", "I need help.", "Do you speak English?"]],
  ["present-continuous", ["She is reading now.", "I'm not working today.", "Are you listening?"]],
  ["present-perfect", ["She has read this book.", "I've never seen snow.", "Have you finished?", "He's gone home."]],
  ["present-perfect-continuous", ["She has been reading for an hour.", "Have they been waiting long?"]],
  ["past-simple", ["I walked home yesterday.", "We went to Paris.", "I was tired.", "Did you call?"]],
  ["past-continuous", ["She was reading when I called.", "Were the kids sleeping?"]],
  ["past-perfect", ["She had read it before the film.", "I'd already eaten."]],
  ["past-perfect-continuous", ["She had been reading for hours."]],
  ["future-simple", ["She will read it tomorrow.", "I'll call you.", "I won't forget.", "I am going to travel."]],
  ["future-continuous", ["She will be reading at nine.", "Will you be working tomorrow?"]],
  ["future-perfect", ["She will have read it by Monday.", "They'll have finished by then."]],
  ["future-perfect-continuous", ["By June she will have been reading it for a year."]],
];

describe("detectTenses", () => {
  it.each(cases.flatMap(([tense, sentences]) => sentences.map((s) => [tense, s] as const)))(
    "finds %s in %j",
    (tense, sentence) => {
      expect(detectTenses(sentence)).toContain(tense);
    },
  );

  it("does not count a longer tense as its shorter parts", () => {
    expect(detectTenses("She has been reading.")).toEqual(["present-perfect-continuous"]);
    expect(detectTenses("I was reading.")).toEqual(["past-continuous"]);
    expect(detectTenses("I will have finished.")).toEqual(["future-perfect"]);
  });

  it("finds every tense in a mixed sentence", () => {
    expect(detectTenses("I was cooking when she arrived.")).toEqual(["past-continuous", "past-simple"]);
  });

  it("does not mistake 'have' + noun for present perfect", () => {
    expect(detectTenses("I have a dog.")).toEqual(["present-simple"]);
  });

  it("covers all 12 tenses with info", () => {
    expect(TENSES).toHaveLength(12);
    for (const tense of TENSES) expect(TENSE_INFO[tense].example).toBeTruthy();
  });

  it("detects each tense in its own example", () => {
    for (const tense of TENSES) expect(detectTenses(TENSE_INFO[tense].example)).toContain(tense);
  });
});
