import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Flame } from "lucide-react";

import { AddFriendForm } from "@/components/friends/add-friend-form";
import { FriendActions } from "@/components/friends/friend-actions";
import { SettingsSection } from "@/components/settings/settings-section";
import { buttonClasses } from "@/components/ui/button";
import { riseStyle } from "@/components/ui/rise";
import { groupFriends, type Friend, type FriendKind } from "@/features/friends/friends";
import { getFriends } from "@/features/friends/queries";
import { fill } from "@/features/i18n/locales";
import { getPlatformI18n } from "@/features/i18n/platform";
import { plural } from "@/features/i18n/plural";
import { utcDay } from "@/features/learning/stats";
import { currentStreak } from "@/features/profile/profile";
import { getMyProfile } from "@/features/profile/queries";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getPlatformI18n();
  return { title: t.meta.friends };
}

export default async function FriendsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [rows, profile, { locale, t }] = await Promise.all([
    getFriends(supabase),
    getMyProfile(supabase, user.id),
    getPlatformI18n(),
  ]);
  const f = t.friends;
  const groups = groupFriends(rows);
  const today = utcDay();

  const row = (friend: Friend) => (
    <li
      key={friend.id}
      className="flex flex-wrap items-center justify-between gap-3 border-[3px] border-line bg-raised p-3 shadow-brutal-sm sm:p-4"
    >
      <div className="min-w-0">
        {friend.kind === "friend" ? (
          <Link
            href={`/friends/${friend.username}`}
            className="font-black break-all underline decoration-2 underline-offset-2 hover:decoration-mark"
          >
            @{friend.username}
          </Link>
        ) : (
          <p className="font-black break-all">@{friend.username}</p>
        )}
        {friend.stats && (
          <p className="flex flex-wrap items-center gap-x-3 text-sm font-semibold text-muted">
            <span>{fill(f.level, { n: friend.stats.level })}</span>
            <span className="inline-flex items-center gap-1">
              <Flame className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">{t.profile.currentStreak}:</span>
              {plural(locale, currentStreak(friend.stats, today), t.dashboard.days)}
            </span>
          </p>
        )}
      </div>
      <FriendActions userId={friend.id} username={friend.username} kind={friend.kind} t={f} unexpected={t.common.unexpected} />
    </li>
  );

  const section = (kind: FriendKind, title: string, step: number) =>
    groups[kind].length > 0 && (
      <section className="rise space-y-3" style={riseStyle(step)} aria-labelledby={`friends-${kind}`}>
        <h2 id={`friends-${kind}`} className="text-xl font-black uppercase">
          {title} <span className="text-muted">· {groups[kind].length}</span>
        </h2>
        <ul className="space-y-3">{groups[kind].map(row)}</ul>
      </section>
    );

  return (
    <div className="space-y-10">
      <header className="rise space-y-3 lg:flex lg:flex-wrap lg:items-baseline lg:gap-x-5 lg:space-y-0" style={riseStyle(0)}>
        <h1 className="text-3xl font-black tracking-tight uppercase sm:text-4xl">
          {f.title}
          <span className="text-primary">.</span>
        </h1>
        <p className="max-w-xl font-semibold text-muted">{f.lead}</p>
      </header>

      <div className="rise" style={riseStyle(1)}>
        <SettingsSection id="add-friend" title={f.addTitle} description={f.addHint}>
          {profile.username ? (
            <AddFriendForm t={f} sessionEnded={t.common.sessionEnded} unexpected={t.common.unexpected} />
          ) : (
            <div className="space-y-4">
              <p className="font-semibold">{f.needUsername}</p>
              <Link href="/profile#public-profile" className={buttonClasses({ size: "sm" })}>
                {f.setUsername}
              </Link>
            </div>
          )}
        </SettingsSection>
      </div>

      {section("incoming", f.incoming, 2)}
      {groups.friend.length > 0 ? (
        section("friend", f.list, 3)
      ) : (
        <p className="rise font-semibold text-muted" style={riseStyle(3)}>
          {f.empty}
        </p>
      )}
      {section("outgoing", f.outgoing, 4)}
      {section("blocked", f.blocked, 5)}
    </div>
  );
}
