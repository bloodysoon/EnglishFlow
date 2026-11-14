import { z } from "zod";

import { PASSWORD_MAX_LENGTH } from "@/features/auth/constants";

export const TRANSLATION_LANGUAGES = ["ru", "ro"] as const;
export type TranslationLanguageSetting = (typeof TRANSLATION_LANGUAGES)[number];

// Mirrors the check constraints on public.profiles. Which goals are on
// offer is set in the admin panel (app_settings.daily_goal_options); the
// save action checks the goal against that list.
export const learningSettingsSchema = z.object({
  translationLanguage: z.enum(TRANSLATION_LANGUAGES),
  dailyGoal: z.number().int().min(1).max(100),
});

export type LearningSettings = z.infer<typeof learningSettingsSchema>;

export const PASSWORD_MIN_LENGTH = 8;

export const changePasswordSchema = z
  .object({
    // Any length: it only has to match what the account already uses.
    currentPassword: z.string().min(1).max(PASSWORD_MAX_LENGTH),
    newPassword: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    path: ["newPassword"],
    message: "same_password",
  });
