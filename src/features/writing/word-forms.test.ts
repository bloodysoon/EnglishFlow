import { describe, expect, it } from "vitest";

import { containsWord } from "./word-forms";

describe("containsWord", () => {
  it.each([
    ["suitcase", "My suitcase is heavy."],
    ["suitcase", "Our suitcases are heavy."],
    ["suitcase", "The suitcase's handle broke."],
    ["run", "She runs every day."],
    ["run", "I ran home."],
    ["run", "I am running late."],
    ["stop", "The bus stopped."],
    ["make", "She is making tea."],
    ["study", "He studied hard and studies more."],
    ["big", "This one is bigger."],
    ["knife", "Put the knives away."],
    ["lie", "Stop lying to me."],
    ["go", "We went to Paris."],
    // Groups at line breaks of the irregular table.
    ["say", "She said hi."],
    ["make", "I made tea."],
    ["give", "He gave me a gift."],
    ["keep", "She kept it."],
    ["child", "The children are asleep."],
    ["boarding pass", "Show your boarding passes, please."],
    ["brand-new", "I bought a brand new car."],
    ["give up", "She never gave up."],
    ["Paris", "I love paris."],
  ])("finds %j in %j", (lemma, sentence) => {
    expect(containsWord(sentence, lemma)).toBe(true);
  });

  it.each([
    ["suitcase", "My bag is heavy."],
    ["cat", "Catch the ball."],
    ["run", "I like brunch."],
    ["boarding pass", "The boarding gate is open, pass it."],
    ["go", "Good morning."],
  ])("does not find %j in %j", (lemma, sentence) => {
    expect(containsWord(sentence, lemma)).toBe(false);
  });
});
