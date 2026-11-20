import { z } from "zod";

import { PASSWORD_MAX_LENGTH } from "@/features/auth/constants";

export const TRANSLATION_LANGUAGES = ["ru", "ro"] as const;
export type TranslationLanguageSetting = (typeof TRANSLATION_LANGUAGES)[number];

// Mirrors the check constraints on public.profiles. Which goals are on
// offer is set in the admin panel (app_settings.daily_goal_options);
// learners may also type their own goal, up to their plan's limit.
export const MAX_DAILY_GOAL = 100;

export const learningSettingsSchema = z.object({
  translationLanguage: z.enum(TRANSLATION_LANGUAGES),
  dailyGoal: z.number().int().min(1).max(MAX_DAILY_GOAL),
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

// Which notifications the bell shows. A missing or broken value means "all on".
export const NOTIFICATION_KINDS = ["dueWords", "badges", "milestones"] as const;

export const notificationPrefsSchema = z.object({
  dueWords: z.boolean().catch(true),
  badges: z.boolean().catch(true),
  milestones: z.boolean().catch(true),
});

export type NotificationPrefs = z.infer<typeof notificationPrefsSchema>;

export function readNotificationPrefs(value: unknown): NotificationPrefs {
  return notificationPrefsSchema.parse(value && typeof value === "object" ? value : {});
}
