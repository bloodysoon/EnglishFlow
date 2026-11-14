import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import Link from "next/link";
import { LogOut } from "lucide-react";

import { AppearanceSettings } from "@/components/settings/appearance-settings";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { LearningSettingsForm } from "@/components/settings/learning-settings-form";
import { SettingsSection } from "@/components/settings/settings-section";
import { buttonClasses } from "@/components/ui/button";
import { riseStyle } from "@/components/ui/rise";
import { logoutAction } from "@/features/auth/actions/logout.action";
import { LOCALE_COOKIE } from "@/features/i18n/locales";
import { preferredLocale } from "@/features/i18n/preferred-locale";
import { getLearningSettings } from "@/features/settings/profile";
import { PLANS, effectiveDailyGoal, getPlan } from "@/features/subscription/plans";
import { getThemePreference } from "@/features/theme/server";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ settings: learning, app }, theme, cookieStore, headerList] = await Promise.all([
    getLearningSettings(),
    getThemePreference(),
    cookies(),
    headers(),
  ]);
  const plan = await getPlan(supabase);
  const goalOptions = app.dailyGoalOptions.filter((g) => effectiveDailyGoal(plan, g) === g);
  const locale = preferredLocale(cookieStore.get(LOCALE_COOKIE)?.value, headerList.get("accept-language"));

  return (
    <div className="max-w-3xl space-y-8">
      <header className="rise" style={riseStyle(0)}>
        <h1 className="text-3xl font-black tracking-tight uppercase sm:text-4xl">
          Settings<span className="text-primary">.</span>
        </h1>
        <p className="mt-2 font-semibold text-muted">Make Elevo fit the way you learn.</p>
      </header>

      <div className="rise" style={riseStyle(1)}>
        <SettingsSection id="learning" title="Learning" description="Saved to your account, on every device.">
          <LearningSettingsForm initial={learning} goalOptions={goalOptions} />
          {goalOptions.length < app.dailyGoalOptions.length && (
            <p className="mt-5 text-sm font-semibold text-muted">
              Want more than {PLANS[plan].newWordsPerDay} new words a day?{" "}
              <Link href="/subscription" className="font-black underline decoration-2 underline-offset-2 hover:decoration-mark">
                Upgrade
              </Link>
            </p>
          )}
        </SettingsSection>
      </div>

      <div className="rise" style={riseStyle(2)}>
        <SettingsSection id="appearance" title="Appearance & language" description="Applied right away on this browser.">
          <AppearanceSettings initialTheme={theme} initialLocale={locale} />
        </SettingsSection>
      </div>

      <div className="rise" style={riseStyle(3)}>
        <SettingsSection id="account" title="Account" description="Your login details.">
          <div>
            <h3 className="font-black uppercase">Change password</h3>
            <div className="mt-4">
              <ChangePasswordForm email={user?.email ?? ""} />
            </div>
          </div>

          <div className="border-t-[3px] border-dashed border-line pt-6">
            <h3 className="font-black uppercase">Log out</h3>
            <p className="mt-1 text-sm font-semibold text-muted">End your session on this browser.</p>
            <form action={logoutAction} className="mt-4">
              <button type="submit" className={buttonClasses({ variant: "secondary", className: "group" })}>
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Log out
              </button>
            </form>
          </div>
        </SettingsSection>
      </div>
    </div>
  );
}
