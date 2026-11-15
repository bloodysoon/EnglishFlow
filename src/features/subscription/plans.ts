import type { SupabaseClient } from "@supabase/supabase-js";

import { MAX_DAILY_GOAL } from "@/features/settings/schemas";

// Daily limits are enforced in SQL (plan_*_limit, latest in supabase/migrations/20261114180000_word_triage.sql);
// keep them in sync. null means no limit. Names live in the platform dictionaries.
export const PLANS = {
  free: { newWordsPerDay: 10, customWordsPerDay: 5 },
  pro: { newWordsPerDay: 30, customWordsPerDay: 20 },
  unlimited: { newWordsPerDay: null, customWordsPerDay: null },
} as const;

export type Plan = keyof typeof PLANS;
export const PLAN_ORDER: Plan[] = ["free", "pro", "unlimited"];

// New words a day the learner really gets: the plan caps their saved goal.
export function effectiveDailyGoal(plan: Plan, goal: number): number {
  const limit = PLANS[plan].newWordsPerDay;
  return limit === null ? goal : Math.min(goal, limit);
}

// The highest daily goal a learner on this plan may pick.
export function maxDailyGoal(plan: Plan): number {
  return PLANS[plan].newWordsPerDay ?? MAX_DAILY_GOAL;
}

// The signed-in learner's plan; any error means free.
export async function getPlan(supabase: SupabaseClient): Promise<Plan> {
  const { data } = await supabase.rpc("my_plan");
  return typeof data === "string" && data in PLANS ? (data as Plan) : "free";
}
