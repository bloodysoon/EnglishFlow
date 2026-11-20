import type { Metadata } from "next";
import Link from "next/link";
import { LogOut } from "lucide-react";

import { AccentPicker } from "@/components/settings/accent-picker";
import { AppearanceSettings } from "@/components/settings/appearance-settings";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { LearningSettingsForm } from "@/components/settings/learning-settings-form";
import { NotificationSettingsForm } from "@/components/settings/notification-settings-form";
import { SettingsSection } from "@/components/settings/settings-section";
import { buttonClasses } from "@/components/ui/button";
import { riseStyle } from "@/components/ui/rise";
import { logoutAction } from "@/features/auth/actions/logout.action";
import { getAuthDictionary } from "@/features/i18n/auth";
import { getPlatformI18n } from "@/features/i18n/platform";
import { getLearningOverview } from "@/features/learning/queries";
import { ACCENT_COOKIE, parseAccent } from "@/features/rewards/levels";
import { getLearningSettings, getNotificationPrefs } from "@/features/settings/profile";
import { cookies } from "next/headers";
import { effectiveDailyGoal, getPlan, maxDailyGoal } from "@/features/subscription/plans";
import { getThemePreference } from "@/features/theme/server";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getPlatformI18n();
  return { title: t.meta.settings };
}

export default async function SettingsPage() {
  const supabase = await createClient();
  // None of these depend on each other, so one round of requests, not three.
  const [
    {
      data: { user },
    },
    { settings: learning, app },
    theme,
    { locale, t },
    plan,
    overview,
    cookieStore,
  ] = await Promise.all([
    supabase.auth.getUser(),
    getLearningSettings(),
    getThemePreference(),
    getPlatformI18n(),
    getPlan(supabase),
    getLearningOverview(supabase),
    cookies(),
  ]);
  const notificationPrefs = await getNotificationPrefs(supabase, user?.id ?? "");
  const s = t.settings;
  const { form } = getAuthDictionary(locale);
  const goalOptions = app.dailyGoalOptions.filter((g) => effectiveDailyGoal(plan, g) === g);

  return (
    <div className="space-y-8">
      <header className="rise lg:flex lg:flex-wrap lg:items-baseline lg:gap-x-5 lg:space-y-0" style={riseStyle(0)}>
        <h1 className="text-3xl font-black tracking-tight uppercase sm:text-4xl">
          {s.title}<span className="text-primary">.</span>
        </h1>
        <p className="mt-2 font-semibold text-muted lg:mt-0">{s.lead}</p>
      </header>

      <div className="rise" style={riseStyle(1)}>
        <SettingsSection id="learning" title={s.learningTitle} description={s.learningDescription}>
          <LearningSettingsForm
            initial={learning}
            goalOptions={goalOptions}
            maxGoal={maxDailyGoal(plan)}
            locale={locale}
            t={s}
            words={t.common.words}
            sessionEnded={t.common.sessionEnded}
            unexpected={t.common.unexpected}
          />
          {goalOptions.length < app.dailyGoalOptions.length && (
            <p className="mt-5 text-sm font-semibold text-muted">
              {s.upgradeHint}{" "}
              <Link href="/subscription" className="font-black underline decoration-2 underline-offset-2 hover:decoration-mark">
                {s.upgrade}
              </Link>
            </p>
          )}
        </SettingsSection>
      </div>

      <div className="rise" style={riseStyle(2)}>
        <SettingsSection id="notifications" title={s.notificationsTitle} description={s.notificationsDescription}>
          <NotificationSettingsForm
            initial={notificationPrefs}
            t={s}
            sessionEnded={t.common.sessionEnded}
            unexpected={t.common.unexpected}
          />
        </SettingsSection>
      </div>

      <div className="rise" style={riseStyle(3)}>
        <SettingsSection id="appearance" title={s.appearanceTitle} description={s.appearanceDescription}>
          <AppearanceSettings initialTheme={theme} initialLocale={locale} t={s} />
          <AccentPicker
            initial={parseAccent(cookieStore.get(ACCENT_COOKIE)?.value)}
            level={overview.level.level}
            t={t.rewards}
          />
        </SettingsSection>
      </div>

      <div className="rise" style={riseStyle(4)}>
        <SettingsSection id="account" title={s.accountTitle} description={s.accountDescription}>
          <div>
            <h3 className="font-black uppercase">{s.changePassword}</h3>
            <div className="mt-4">
              <ChangePasswordForm
                email={user?.email ?? ""}
                t={s}
                sessionEnded={t.common.sessionEnded}
                unexpected={t.common.unexpected}
                passwordToggle={{ show: form.showPassword, hide: form.hidePassword, suffix: form.passwordSuffix }}
              />
            </div>
          </div>

          <div className="border-t-[3px] border-dashed border-line pt-6">
            <h3 className="font-black uppercase">{s.logOut}</h3>
            <p className="mt-1 text-sm font-semibold text-muted">{s.logOutDescription}</p>
            <form action={logoutAction} className="mt-4">
              <button type="submit" className={buttonClasses({ variant: "secondary", className: "group" })}>
                <LogOut className="h-4 w-4" aria-hidden="true" />
                {s.logOut}
              </button>
            </form>
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}
