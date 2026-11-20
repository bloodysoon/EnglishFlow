"use server";

import { getMyAchievements } from "@/features/achievements/queries";
import { getFriends } from "@/features/friends/queries";
import { dateLocale, getPlatformI18n } from "@/features/i18n/platform";
import { utcDay } from "@/features/learning/stats";
import { getNotificationPrefs } from "@/features/settings/profile";
import { logSupabaseError } from "@/lib/supabase/log-error";
import { createClient } from "@/lib/supabase/server";
import { monthlyChallenges } from "@/features/rewards/challenges";
import { earnedNotices, NOTICE_SETTING, type AchievementNotice, type DueWord } from "../notifications";

const DUE_LIMIT = 50;

export type Notifications = {
  userId: string;
  due: DueWord[];
  dueCount: number;
  // null when both badges and milestones are switched off.
  achievements: AchievementNotice[] | null;
  // Usernames of people waiting for my answer, newest first.
  friendRequests: string[];
};

export async function getNotificationsAction(): Promise<
  { success: true; notifications: Notifications } | { success: false; error: "not_signed_in" | "unexpected" }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "not_signed_in" };

  try {
    const prefs = await getNotificationPrefs(supabase, user.id);
    const wantsAchievements = prefs.badges || prefs.milestones;

    // Only the work the learner asked for: achievements need several queries.
    const [{ locale, t }, mine, due, friends] = await Promise.all([
      getPlatformI18n(),
      wantsAchievements ? getMyAchievements(supabase) : null,
      prefs.dueWords
        ? // !inner: words hidden by RLS (unpublished sets) drop out of the count too.
          supabase
            .from("user_words")
            .select("box, words!inner(lemma)", { count: "exact" })
            .eq("user_id", user.id)
            .lte("due_on", utcDay())
            .order("box", { ascending: true })
            .limit(DUE_LIMIT)
        : null,
      // Extra: if friends fail to load, the rest of the bell still works.
      getFriends(supabase).catch((error) => {
        logSupabaseError("[Notifications] Loading friend requests failed", error);
        return [];
      }),
    ]);
    if (due?.error) throw due.error;

    const rows = (due?.data ?? []) as unknown as { box: number; words: { lemma: string } }[];
    let achievements: AchievementNotice[] | null = null;
    if (mine) {
      const { current, past } = monthlyChallenges(mine.stats.days, mine.overview.today);
      const monthFormat = new Intl.DateTimeFormat(dateLocale(locale), { month: "long", year: "numeric", timeZone: "UTC" });
      achievements = earnedNotices(
        mine.result,
        mine.overview.level.level,
        [current, ...past],
        t,
        (month) => monthFormat.format(new Date(`${month}-01T00:00:00Z`)),
      ).filter((n) => prefs[NOTICE_SETTING[n.kind]]);
    }
    return {
      success: true,
      notifications: {
        userId: user.id,
        due: rows.map((row) => ({ lemma: row.words.lemma, box: Number(row.box) })),
        dueCount: due?.count ?? rows.length,
        achievements,
        friendRequests: friends.filter((f) => f.kind === "incoming").map((f) => f.username),
      },
    };
  } catch (error) {
    console.error("getNotificationsAction", error);
    return { success: false, error: "unexpected" };
  }
}
