import { describe, expect, it } from "vitest";

import { unseenNotices, type AchievementNotice } from "./notifications";

const notice = (key: string): AchievementNotice => ({ key, kind: "badge", title: key });

describe("unseenNotices", () => {
  const all = [notice("badge:firstStep"), notice("track:streak:1"), notice("track:streak:2")];

  it("stays quiet on a first visit", () => {
    expect(unseenNotices(all, null)).toEqual([]);
  });

  it("returns only what was not seen", () => {
    expect(unseenNotices(all, ["badge:firstStep", "track:streak:1"]).map((n) => n.key)).toEqual(["track:streak:2"]);
  });
});
