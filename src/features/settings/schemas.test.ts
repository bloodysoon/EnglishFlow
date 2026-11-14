import { describe, expect, it } from "vitest";

import { changePasswordSchema, learningSettingsSchema } from "./schemas";

describe("learningSettingsSchema", () => {
  it("accepts the supported languages and goals", () => {
    expect(learningSettingsSchema.safeParse({ translationLanguage: "ro", dailyGoal: 20 }).success).toBe(true);
  });

  it.each([
    { translationLanguage: "en", dailyGoal: 10 },
    { translationLanguage: "ru", dailyGoal: 0 },
    { translationLanguage: "ru", dailyGoal: 101 },
    { translationLanguage: "ru", dailyGoal: 7.5 },
    { translationLanguage: "ru", dailyGoal: "10" },
    { translationLanguage: "ru" },
  ])("rejects %j", (input) => {
    expect(learningSettingsSchema.safeParse(input).success).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  it("accepts a new password of 8 to 72 characters", () => {
    expect(changePasswordSchema.safeParse({ currentPassword: "old", newPassword: "x".repeat(8) }).success).toBe(true);
    expect(changePasswordSchema.safeParse({ currentPassword: "old", newPassword: "x".repeat(72) }).success).toBe(true);
  });

  it("rejects passwords that are too short or too long", () => {
    expect(changePasswordSchema.safeParse({ currentPassword: "old", newPassword: "short" }).success).toBe(false);
    expect(changePasswordSchema.safeParse({ currentPassword: "old", newPassword: "x".repeat(73) }).success).toBe(false);
  });

  it("requires the current password", () => {
    expect(changePasswordSchema.safeParse({ currentPassword: "", newPassword: "long enough" }).success).toBe(false);
  });

  it("rejects a new password equal to the current one", () => {
    const result = changePasswordSchema.safeParse({ currentPassword: "same pass", newPassword: "same pass" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("same_password");
  });
});
