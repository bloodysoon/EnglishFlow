import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { PLANS, effectiveDailyGoal, maxDailyGoal } from "./plans";

describe("effectiveDailyGoal", () => {
  it("caps the goal by the plan", () => {
    expect(effectiveDailyGoal("free", 20)).toBe(10);
    expect(effectiveDailyGoal("free", 5)).toBe(5);
    expect(effectiveDailyGoal("pro", 50)).toBe(30);
    expect(effectiveDailyGoal("unlimited", 100)).toBe(100);
  });
});

describe("maxDailyGoal", () => {
  it("is the plan's limit, or the schema's maximum when unlimited", () => {
    expect(maxDailyGoal("free")).toBe(10);
    expect(maxDailyGoal("pro")).toBe(30);
    expect(maxDailyGoal("unlimited")).toBe(100);
  });
});

describe("plan limits in SQL match these", () => {
  // Each limit's latest definition.
  const read = (file: string) => readFileSync(path.join(process.cwd(), "supabase/migrations", file), "utf8");
  const newWordsSql = read("20261114180000_word_triage.sql");
  const customWordsSql = read("20261114170000_subscriptions.sql");
  const sqlCase = (key: "newWordsPerDay" | "customWordsPerDay") =>
    `case p_plan when 'free' then ${PLANS.free[key]} when 'pro' then ${PLANS.pro[key]} end`;

  it("uses the same daily limits", () => {
    expect(PLANS.unlimited.newWordsPerDay).toBeNull();
    expect(PLANS.unlimited.customWordsPerDay).toBeNull();
    expect(newWordsSql).toContain(sqlCase("newWordsPerDay"));
    expect(customWordsSql).toContain(sqlCase("customWordsPerDay"));
  });
});
