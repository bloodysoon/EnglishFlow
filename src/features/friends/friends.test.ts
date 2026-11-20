import { describe, expect, it } from "vitest";

import { friendEventSchema, friendSchema, friendsByDay, groupFriends } from "./friends";

const row = (username: string, kind: string, since: string, stats: unknown = null) => ({
  user_id: "8f14e45f-ceea-4e7a-9f3b-1c2d3e4f5a6b",
  username,
  kind,
  stats,
  since,
});

describe("friendSchema", () => {
  it("maps a friends_list row", () => {
    expect(friendSchema.parse(row("ana", "friend", "2026-11-20T10:00:00+00:00"))).toMatchObject({
      username: "ana",
      kind: "friend",
      stats: null,
    });
  });

  it("hides a broken stats snapshot instead of failing", () => {
    expect(friendSchema.parse(row("ana", "friend", "2026-11-20T10:00:00+00:00", { level: "x" })).stats).toBeNull();
  });

  it("rejects an unknown kind", () => {
    expect(friendSchema.safeParse(row("ana", "enemy", "2026-11-20T10:00:00+00:00")).success).toBe(false);
  });
});

describe("groupFriends", () => {
  const rows = friendSchema.array().parse([
    row("ana", "friend", "2026-11-20T23:30:00-02:00"), // 2026-11-21 in UTC
    row("bob", "friend", "2026-11-21T08:00:00+00:00"),
    row("cid", "incoming", "2026-11-21T09:00:00+00:00"),
  ]);

  it("groups rows by kind", () => {
    const groups = groupFriends(rows);
    expect(groups.friend.map((f) => f.username)).toEqual(["ana", "bob"]);
    expect(groups.incoming.map((f) => f.username)).toEqual(["cid"]);
    expect(groups.blocked).toEqual([]);
  });
});

describe("friendsByDay", () => {
  it("puts each friend on the UTC day the friendship began, once a day", () => {
    const events = friendEventSchema.array().parse([
      { friend_username: "ana", created_at: "2026-11-20T23:30:00-02:00" }, // 2026-11-21 in UTC
      { friend_username: "bob", created_at: "2026-11-21T08:00:00+00:00" },
      { friend_username: "bob", created_at: "2026-11-21T09:00:00+00:00" }, // re-added
      { friend_username: "cid", created_at: "2026-11-22T08:00:00+00:00" },
    ]);
    const names = new Map([...friendsByDay(events)].map(([day, list]) => [day, list.map((f) => f.username)]));
    expect(names).toEqual(
      new Map([
        ["2026-11-21", ["ana", "bob"]],
        ["2026-11-22", ["cid"]],
      ]),
    );
  });
});
