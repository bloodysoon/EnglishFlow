import { describe, expect, it } from "vitest";

import { SLOTS, badgeLayer, badgePose } from "./badge-pose";

describe("badgePose", () => {
  it("starts with the pile at rest", () => {
    expect(badgePose(0, 0, 1, 480)).toEqual(SLOTS[0]);
    expect(badgePose(2, 0, 1, 480)).toEqual(SLOTS[2]);
    expect(badgePose(6, 0, 1, 480)).toEqual(SLOTS[3]); // deep cards share the back pose
  });

  it("swings the front badge out to its side mid-deal", () => {
    expect(badgePose(0, 0.5, -1, 480)).toMatchObject({ x: -480, rotate: -15 });
    expect(badgePose(0, 0.5, 1, 480)).toMatchObject({ x: 480, rotate: 15 });
  });

  it("tucks the dealt badge in at the back", () => {
    expect(badgePose(0, 1, 1, 480)).toEqual(SLOTS[3]);
  });

  it("moves the next badge to the front after a deal", () => {
    expect(badgePose(1, 0.99, 1, 480)).toEqual(SLOTS[0]);
    expect(badgePose(2, 1.99, 1, 480)).toEqual(SLOTS[0]);
  });

  it("puts a tucked badge under the ones still waiting", () => {
    expect(badgeLayer(0, 0.6)).toBeLessThan(badgeLayer(4, 0.6));
    expect(badgeLayer(0, 0.4)).toBeGreaterThan(badgeLayer(1, 0.4));
  });
});
