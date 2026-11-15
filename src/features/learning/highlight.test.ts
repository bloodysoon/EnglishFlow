import { describe, expect, it } from "vitest";

import { splitAroundWord } from "./highlight";

describe("splitAroundWord", () => {
  it("puts the word, in any case or simple form, at the odd positions", () => {
    expect(splitAroundWord("Good health is important.", "health")).toEqual(["Good ", "health", " is important."]);
    expect(splitAroundWord("Walk! She walked home.", "walk")).toEqual(["", "Walk", "! She ", "walked", " home."]);
  });

  it("leaves other words and odd input alone", () => {
    expect(splitAroundWord("A healthy meal.", "health")).toEqual(["A healthy meal."]);
    expect(splitAroundWord("It is 5 o'clock (sharp).", "o'clock")).toEqual(["It is 5 ", "o'clock", " (sharp)."]);
    expect(splitAroundWord("What?", "a.b*")).toEqual(["What?"]);
    expect(splitAroundWord("Anything", " ")).toEqual(["Anything"]);
  });
});
