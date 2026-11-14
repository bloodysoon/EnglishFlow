import type { SupabaseClient } from "@supabase/supabase-js";

import { CEFR_LEVELS } from "@/features/dictionary/cefr";
import { DEFAULT_XP_RULES, type XpRules } from "@/features/leitner/xp";
import { xpRulesSchema } from "./schemas";

type XpRulesRow = Record<string, unknown>;

// numeric columns arrive as strings from PostgREST.
export function xpRulesFromRow(row: XpRulesRow | null | undefined): XpRules {
  if (!row) return DEFAULT_XP_RULES;

  const parsed = xpRulesSchema.safeParse({
    remembered: Number(row.xp_remembered),
    forgot: Number(row.xp_forgot),
    masteredBonus: Number(row.xp_mastered_bonus),
    multipliers: Object.fromEntries(CEFR_LEVELS.map((l) => [l, Number(row[`multiplier_${l.toLowerCase()}`])])),
  });
  return parsed.success ? parsed.data : DEFAULT_XP_RULES;
}

export function xpRulesToRow(rules: XpRules) {
  return {
    xp_remembered: rules.remembered,
    xp_forgot: rules.forgot,
    xp_mastered_bonus: rules.masteredBonus,
    ...Object.fromEntries(CEFR_LEVELS.map((l) => [`multiplier_${l.toLowerCase()}`, rules.multipliers[l]])),
  };
}

export async function getXpRules(supabase: SupabaseClient): Promise<XpRules> {
  const { data } = await supabase.from("xp_rules").select("*").eq("id", true).maybeSingle();
  return xpRulesFromRow(data);
}
