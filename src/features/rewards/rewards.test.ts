import { describe, expect, it } from "vitest";

import { trackProgress } from "@/features/achievements/achievements";
import { challengeFor, challengeProgress, monthlyChallenges } from "./challenges";
import { closestGoals } from "./goals";
import {
  frameForLevel,
  freezesEarned,
  LEVEL_TITLES,
  levelTitle,
  medalForTier,
  parseAccent,
  resolveEquipped,
  rewardRoadmap,
} from "./levels";

describe("levelTitle", () => {
  it("names every level and says when the next title comes", () => {
    expect(levelTitle(1)).toEqual({ id: "newcomer", nextAt: 2 });
    expect(levelTitle(6)).toEqual({ id: "explorer", nextAt: 7 });
    expect(levelTitle(250)).toEqual({ id: "legend", nextAt: null });
  });

  it("keeps titles in level order", () => {
    const froms = LEVEL_TITLES.map((t) => t.from);
    expect(froms).toEqual([...froms].sort((a, b) => a - b));
  });
});

describe("level rewards", () => {
  it("gives frames, medals and freezes by level", () => {
    expect(frameForLevel(4)).toBeNull();
    expect(frameForLevel(16)).toBe("silver");
    expect(medalForTier(0)).toBeNull();
    expect(medalForTier(3)).toBe("gold");
    expect(medalForTier(7)).toBe("diamond");
    expect(freezesEarned(4)).toBe(0);
    expect(freezesEarned(12)).toBe(2);
  });

  it("falls back to the default accent for unknown cookies", () => {
    expect(parseAccent("plum")).toBe("plum");
    expect(parseAccent("<script>")).toBe("forest");
  });
});

describe("monthly challenges", () => {
  const day = (d: string, remembered: number, forgot = 0) => ({ day: d, remembered, forgot, xp: 0 });

  it("rotates kinds month by month", () => {
    expect(challengeFor("2026-11").kind).not.toBe(challengeFor("2026-12").kind);
  });

  it("counts only the month's own days", () => {
    const month = "2026-11";
    const days = [day("2026-10-31", 500), day("2026-11-02", 12), day("2026-11-03", 3, 1)];
    const progress = challengeProgress(month, days);
    expect(progress.value).toBe(progress.kind === "reviews" ? 16 : progress.kind === "activeDays" ? 2 : 1);
  });

  it("lists past months newest first", () => {
    const { current, past } = monthlyChallenges([day("2026-09-01", 1), day("2026-10-01", 1)], "2026-11-19");
    expect(current.month).toBe("2026-11");
    expect(past.map((c) => c.month)).toEqual(["2026-10", "2026-09"]);
  });
});

describe("closestGoals", () => {
  it("picks started tracks nearest to their next level", () => {
    const tracks = [trackProgress("reviews", 90), trackProgress("words", 0), trackProgress("streak", 4)];
    expect(closestGoals(tracks, 2).map((t) => t.id)).toEqual(["reviews", "streak"]);
  });
});

describe("inventory", () => {
  it("keeps a choice only while it is unlocked", () => {
    expect(resolveEquipped({ title: "explorer", frame: "bronze" }, 12)).toEqual({ title: "explorer", frame: "bronze" });
    // Not reached yet: falls back to the level's own title and frame.
    expect(resolveEquipped({ title: "legend", frame: "gold" }, 12)).toEqual({ title: "wordsmith", frame: "bronze" });
    expect(resolveEquipped({ title: null, frame: "none" }, 40)).toEqual({ title: "lexicon", frame: null });
  });

  it("lists every reward by level, in order", () => {
    const roadmap = rewardRoadmap();
    expect(roadmap[0]).toEqual({ level: 2, rewards: [{ kind: "title", id: "starter" }, { kind: "boost" }] });
    expect(roadmap.find((r) => r.level === 5)?.rewards.map((r) => r.kind)).toEqual([
      "title",
      "accent",
      "frame",
      "freeze",
      "boost",
    ]);
    // The boost stops at level 21 (+20%).
    expect(roadmap.find((r) => r.level === 22)?.rewards ?? []).not.toContainEqual({ kind: "boost" });
    expect(roadmap.find((r) => r.level === 21)?.rewards).toContainEqual({ kind: "boost" });
    expect(roadmap.at(-1)?.level).toBe(100);
    expect(roadmap.map((r) => r.level)).toEqual([...roadmap.map((r) => r.level)].sort((a, b) => a - b));
  });
});
