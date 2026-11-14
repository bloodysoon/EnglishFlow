import { z } from "zod";

import { CEFR_LEVELS } from "@/features/dictionary/cefr";

const goal = z.number().int().min(1).max(100);

export const appSettingsSchema = z
  .object({
    defaultTranslationLanguage: z.enum(["ru", "ro"]),
    defaultDailyGoal: goal,
    dailyGoalOptions: z
      .array(goal)
      .min(1)
      .max(6)
      .refine((options) => new Set(options).size === options.length, "duplicate_option"),
  })
  .refine((data) => data.dailyGoalOptions.includes(data.defaultDailyGoal), {
    path: ["defaultDailyGoal"],
    message: "default_not_an_option",
  });

export type AppSettingsInput = z.infer<typeof appSettingsSchema>;

// One decimal place, like numeric(3, 1) in the database.
const multiplier = z
  .number()
  .min(0.1)
  .max(5)
  .refine((value) => Math.abs(value * 10 - Math.round(value * 10)) < 1e-9, "one_decimal");

export const xpRulesSchema = z.object({
  remembered: z.number().int().min(0).max(100),
  forgot: z.number().int().min(0).max(100),
  masteredBonus: z.number().int().min(0).max(200),
  multipliers: z.object(
    Object.fromEntries(CEFR_LEVELS.map((level) => [level, multiplier])) as Record<
      (typeof CEFR_LEVELS)[number],
      typeof multiplier
    >,
  ),
});

export const publishWordSetSchema = z.object({
  setId: z.uuid(),
  published: z.boolean(),
});

const translationEditSchema = z.object({
  translation: z.string().trim().min(1).max(200),
  alternatives: z.array(z.string().trim().min(1).max(200)).max(5),
  reviewed: z.boolean(),
});

export const wordEditSchema = z.object({
  wordId: z.uuid(),
  level: z.enum(CEFR_LEVELS).nullable(),
  // null removes that language's translation.
  translations: z.object({
    ru: translationEditSchema.nullable(),
    ro: translationEditSchema.nullable(),
  }),
});

export type WordEdit = z.infer<typeof wordEditSchema>;
