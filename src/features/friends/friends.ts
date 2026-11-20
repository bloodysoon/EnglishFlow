import { z } from "zod";

import { publicStatsSchema } from "@/features/profile/profile";

export const friendIdSchema = z.uuid();

// Status codes friend_request() returns (supabase/migrations/…_friends.sql).
export const REQUEST_RESULTS = ["sent", "accepted", "already", "not_found", "self", "no_username", "blocked", "limit"] as const;
export type RequestResult = (typeof REQUEST_RESULTS)[number];

export const FRIEND_KINDS = ["friend", "incoming", "outgoing", "blocked"] as const;
export type FriendKind = (typeof FRIEND_KINDS)[number];

// One row of friends_list(). A broken stats snapshot hides the stats, not the friend.
export const friendSchema = z
  .object({
    user_id: z.uuid(),
    username: z.string(),
    kind: z.enum(FRIEND_KINDS),
    stats: publicStatsSchema.nullable().catch(null),
    since: z.string(),
  })
  .transform((r) => ({ id: r.user_id, username: r.username, kind: r.kind, stats: r.stats, since: r.since }));

export type Friend = z.output<typeof friendSchema>;

export function groupFriends(rows: Friend[]): Record<FriendKind, Friend[]> {
  const groups: Record<FriendKind, Friend[]> = { friend: [], incoming: [], outgoing: [], blocked: [] };
  for (const r of rows) groups[r.kind].push(r);
  return groups;
}

// One row of friend_events: who became my friend, and when.
export const friendEventSchema = z
  .object({ friend_username: z.string(), created_at: z.string() })
  .transform((r) => ({ username: r.friend_username, at: r.created_at }));

export type FriendEvent = z.output<typeof friendEventSchema>;

// The friends made each UTC day (the timeline's days are UTC too), oldest
// first. Once per friend a day: unfriending and adding again logs twice.
export function friendsByDay(events: FriendEvent[]): Map<string, FriendEvent[]> {
  const days = new Map<string, FriendEvent[]>();
  for (const e of events) {
    const day = new Date(e.at).toISOString().slice(0, 10);
    const list = days.get(day) ?? [];
    if (!list.some((f) => f.username === e.username)) days.set(day, [...list, e]);
  }
  return days;
}
