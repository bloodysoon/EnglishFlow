import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { ProfileCard } from "@/components/profile/profile-card";
import { ProfileForm } from "@/components/profile/profile-form";
import { SettingsSection } from "@/components/settings/settings-section";
import { riseStyle } from "@/components/ui/rise";
import { getPlatformI18n } from "@/features/i18n/platform";
import { getAchievementsAndPublish, getMyProfile } from "@/features/profile/queries";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getPlatformI18n();
  return { title: t.meta.profile };
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profile, { stats, overview }, { locale, t }] = await Promise.all([
    getMyProfile(supabase, user.id),
    getAchievementsAndPublish(supabase, user.id),
    getPlatformI18n(),
  ]);
  const p = t.profile;

  return (
    <div className="space-y-10">
      <header className="rise space-y-3 lg:flex lg:flex-wrap lg:items-baseline lg:gap-x-5 lg:space-y-0" style={riseStyle(0)}>
        <h1 className="text-3xl font-black tracking-tight uppercase sm:text-4xl">
          {p.title}
          <span className="text-primary">.</span>
        </h1>
        <p className="max-w-xl font-semibold text-muted">{p.lead}</p>
      </header>

      <div className="rise" style={riseStyle(1)}>
        <ProfileCard username={profile.username} stats={stats} today={overview.today} locale={locale} t={t} />
        <Link
          href="/achievements"
          className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-black uppercase underline decoration-[3px] underline-offset-4 hover:decoration-mark"
        >
          {p.seeAll}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="rise" style={riseStyle(2)}>
        <SettingsSection id="public-profile" title={p.shareTitle} description={p.shareDescription}>
          <ProfileForm
            initial={profile}
            t={p}
            sessionEnded={t.common.sessionEnded}
            unexpected={t.common.unexpected}
          />
        </SettingsSection>
      </div>
    </div>
  );
}
