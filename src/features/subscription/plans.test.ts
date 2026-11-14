import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { PLANS, effectiveDailyGoal } from "./plans";

describe("effectiveDailyGoal", () => {
  it("caps the goal by the plan", () => {
    expect(effectiveDailyGoal("free", 20)).toBe(10);
    expect(effectiveDailyGoal("free", 5)).toBe(5);
    expect(effectiveDailyGoal("pro", 20)).toBe(20);
    expect(effectiveDailyGoal("unlimited", 100)).toBe(100);
  });
});

describe("plan limits in SQL match these", () => {
  const sql = readFileSync(path.join(process.cwd(), "supabase/migrations/20261114170000_subscriptions.sql"), "utf8");
  const sqlCase = (key: "newWordsPerDay" | "customWordsPerDay") =>
    `case p_plan when 'free' then ${PLANS.free[key]} when 'pro' then ${PLANS.pro[key]} end`;

  it("uses the same daily limits", () => {
    expect(PLANS.unlimited.newWordsPerDay).toBeNull();
    expect(PLANS.unlimited.customWordsPerDay).toBeNull();
    expect(sql).toContain(sqlCase("newWordsPerDay"));
    expect(sql).toContain(sqlCase("customWordsPerDay"));
  });
});
