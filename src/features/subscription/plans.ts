import type { SupabaseClient } from "@supabase/supabase-js";

// Daily limits are enforced in SQL (supabase/migrations/20261114170000_subscriptions.sql);
// keep them in sync. null means no limit.
export const PLANS = {
  free: { name: "Rookie", tagline: "Just getting started", newWordsPerDay: 10, customWordsPerDay: 5 },
  pro: { name: "Word Nerd", tagline: "Hooked on words", newWordsPerDay: 20, customWordsPerDay: 20 },
  unlimited: { name: "Legend", tagline: "No limits. At all.", newWordsPerDay: null, customWordsPerDay: null },
} as const;

export type Plan = keyof typeof PLANS;
export const PLAN_ORDER: Plan[] = ["free", "pro", "unlimited"];

// New words a day the learner really gets: the plan caps their saved goal.
export function effectiveDailyGoal(plan: Plan, goal: number): number {
  const limit = PLANS[plan].newWordsPerDay;
  return limit === null ? goal : Math.min(goal, limit);
}

// The signed-in learner's plan; any error means free.
export async function getPlan(supabase: SupabaseClient): Promise<Plan> {
  const { data } = await supabase.rpc("my_plan");
  return typeof data === "string" && data in PLANS ? (data as Plan) : "free";
}
