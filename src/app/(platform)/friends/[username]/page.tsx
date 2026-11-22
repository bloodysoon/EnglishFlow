import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { FriendActions } from "@/components/friends/friend-actions";
import { BackLink } from "@/components/learn/back-link";
import { ProfileCard } from "@/components/profile/profile-card";
import { riseStyle } from "@/components/ui/rise";
import { getFriends } from "@/features/friends/queries";
import { getPlatformI18n } from "@/features/i18n/platform";
import { utcDay } from "@/features/learning/stats";
import { usernameSchema } from "@/features/profile/profile";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ username: string }> };

// Only accepted friends: friends_list() returns stats for them alone, so a
// private profile stays private to everyone else. Anything else is not found.
async function loadFriend(params: Props["params"]) {
  const parsed = usernameSchema.safeParse((await params).username);
  if (!parsed.success) return null;
  const friends = await getFriends(await createClient());
  return friends.find((f) => f.kind === "friend" && f.username === parsed.data) ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [friend, { t }] = await Promise.all([loadFriend(params), getPlatformI18n()]);
  return { title: friend ? `@${friend.username}` : t.meta.friends };
}

export default async function FriendProfilePage({ params }: Props) {
  const [friend, { locale, t }] = await Promise.all([loadFriend(params), getPlatformI18n()]);
  if (!friend) notFound();

  return (
    <div className="space-y-8">
      <div className="rise" style={riseStyle(0)}>
        {friend.stats ? (
          <ProfileCard
            username={friend.username}
            stats={friend.stats}
            today={utcDay()}
            locale={locale}
            t={t}
            action={<BackLink href="/friends" label={t.friends.back} />}
          />
        ) : (
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              <p className="text-2xl font-black break-all">@{friend.username}</p>
              <BackLink href="/friends" label={t.friends.back} />
            </div>
            <p className="font-semibold text-muted">{t.profile.nothingYet}</p>
          </div>
        )}
      </div>
      <div className="rise" style={riseStyle(1)}>
        <FriendActions userId={friend.id} username={friend.username} kind="friend" t={t.friends} unexpected={t.common.unexpected} doneHref="/friends" />
      </div>
    </div>
  );
}
