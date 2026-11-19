import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ProfileCard } from "@/components/profile/profile-card";
import { buttonClasses } from "@/components/ui/button";
import { LogoLink } from "@/components/ui/logo-link";
import { getPlatformI18n } from "@/features/i18n/platform";
import { usernameSchema } from "@/features/profile/profile";
import { getPublicProfile } from "@/features/profile/queries";
import { utcDay } from "@/features/learning/stats";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ username: string }> };

// A missing, private or malformed profile all look the same: not found.
async function load(params: Props["params"]) {
  const parsed = usernameSchema.safeParse((await params).username);
  if (!parsed.success) return null;
  return getPublicProfile(await createClient(), parsed.data);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = await load(params);
  return {
    title: profile ? `@${profile.username}` : "Elevo",
    robots: { index: false, follow: false },
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const [profile, { locale, t }] = await Promise.all([load(params), getPlatformI18n()]);
  if (!profile) notFound();

  return (
    <div lang={locale} className="min-h-dvh bg-canvas px-4 py-6 text-fg sm:px-8 lg:py-10">
      <div className="mx-auto w-full max-w-5xl space-y-8">
        <LogoLink />
        {profile.stats ? (
          <ProfileCard username={profile.username} stats={profile.stats} today={utcDay()} locale={locale} t={t} />
        ) : (
          <p className="font-semibold text-muted">{t.profile.nothingYet}</p>
        )}
        <Link href="/" className={buttonClasses({ size: "lg" })}>
          {t.profile.cta}
        </Link>
      </div>
    </div>
  );
}
