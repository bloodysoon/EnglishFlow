"use server";

import { z } from "zod";

import { unlockTimes } from "@/features/achievements/timeline";
import { dateLocale, getPlatformI18n } from "@/features/i18n/platform";
import { createClient } from "@/lib/supabase/server";
import { getDaySteps, getTimeline, type DayStep } from "../queries";

// An achievement unlocked that day; at = null when its moment is not known.
export type DayUnlock = { heading: string; label: string; at: string | null };

// The timeline's day view loads its events only when a day is opened.
export async function getDayStepsAction(
  day: unknown,
): Promise<
  | { success: true; steps: DayStep[]; unlocks: DayUnlock[] }
  | { success: false; error: "invalid_data" | "not_signed_in" | "unexpected" }
> {
  const parsed = z.iso.date().safeParse(day);
  if (!parsed.success) return { success: false, error: "invalid_data" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "not_signed_in" };

  try {
    const [steps, days, { locale, t }] = await Promise.all([
      getDaySteps(supabase, user.id, parsed.data),
      getTimeline(supabase),
      getPlatformI18n(),
    ]);
    const { achievements: a, notifications: n } = t;
    const number = (n: number) => n.toLocaleString(dateLocale(locale));
    const unlocks = unlockTimes(days, parsed.data, steps).map(
      ({ unlock: u, at }) => ({
        // Same wording as the notification bell.
      heading: u.kind === "track" ? n.newMilestone : n.newBadge,
      label: u.kind === "track" ? `${a.tracks[u.id].name} · ${number(u.target)}` : a.badgeList[u.id].name,
      at,
      }),
    );
    return { success: true, steps, unlocks };
  } catch (error) {
    console.error("getDayStepsAction", error);
    return { success: false, error: "unexpected" };
  }
}
