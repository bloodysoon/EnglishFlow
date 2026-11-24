import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AddFriendForm } from "@/components/friends/add-friend-form";
import { ProfileCard } from "@/components/profile/profile-card";
import { buttonClasses } from "@/components/ui/button";
import { LogoLink } from "@/components/ui/logo-link";
import { getPlatformI18n } from "@/features/i18n/platform";
import { usernameSchema } from "@/features/profile/profile";
import { getMyProfile, getPublicProfile } from "@/features/profile/queries";
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
  const supabase = await createClient();
  const [profile, { locale, t }, { data: { user } }] = await Promise.all([
    load(params),
    getPlatformI18n(),
    supabase.auth.getUser(),
  ]);
  if (!profile) notFound();
  // Signed-in visitors may ask to be friends; not on their own page.
  const me = user ? await getMyProfile(supabase, user.id) : null;
  const canAdd = me !== null && me.username !== profile.username;

  return (
    <div lang={locale} className="min-h-dvh bg-canvas px-4 pt-[env(safe-area-inset-top)] text-fg sm:px-8">
      <div className="mx-auto w-full max-w-5xl space-y-8 py-6 lg:py-10">
        <LogoLink />
        {profile.stats ? (
          <ProfileCard username={profile.username} stats={profile.stats} today={utcDay()} locale={locale} t={t} />
        ) : (
          <p className="font-semibold text-muted">{t.profile.nothingYet}</p>
        )}
        {canAdd ? (
          <AddFriendForm
            username={profile.username}
            t={t.friends}
            sessionEnded={t.common.sessionEnded}
            unexpected={t.common.unexpected}
          />
        ) : (
          !user && (
            <Link href="/" className={buttonClasses({ size: "lg" })}>
              {t.profile.cta}
            </Link>
          )
        )}
      </div>
    </div>
  );
}
