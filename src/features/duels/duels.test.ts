import { describe, expect, it } from "vitest";

import { duelPhase, duelsByDay, duelStateSchema, duelSummarySchema, inviteSchema, secondsLeft, theyAnswered } from "./duels";

const state = (over: Record<string, unknown> = {}) =>
  duelStateSchema.parse({
    id: "8f14e45f-ceea-4e7a-9f3b-1c2d3e4f5a6b",
    league: "beginner",
    status: "active",
    is_challenger: true,
    round: 2,
    answered: 0,
    starts_at: "2026-11-20T10:00:00.000Z",
    ends_at: "2026-11-20T10:00:05.000Z",
    now: "2026-11-20T09:59:59.000Z",
    me: { username: "ana", score: 18 },
    them: { username: "bob", score: 0 },
    winner: null,
    question: null,
    my_choice: null,
    rounds: [],
    ...over,
  });

const at = (iso: string) => Date.parse(iso);

describe("duelPhase", () => {
  it("counts down before the round starts, then asks", () => {
    expect(duelPhase(state(), at("2026-11-20T09:59:59.000Z"))).toBe("countdown");
    expect(duelPhase(state(), at("2026-11-20T10:00:01.000Z"))).toBe("question");
  });

  it("follows the duel status", () => {
    expect(duelPhase(state({ status: "invited", starts_at: null }), 0)).toBe("waiting");
    expect(duelPhase(state({ status: "finished" }), 0)).toBe("finished");
    expect(duelPhase(state({ status: "declined" }), 0)).toBe("closed");
  });
});

describe("secondsLeft", () => {
  it("is capped at the round length and never negative", () => {
    expect(secondsLeft(state(), at("2026-11-20T09:59:00.000Z"))).toBe(5);
    expect(secondsLeft(state(), at("2026-11-20T10:00:03.500Z"))).toBe(1.5);
    expect(secondsLeft(state(), at("2026-11-20T10:00:09.000Z"))).toBe(0);
  });
});

describe("theyAnswered", () => {
  it("subtracts my own answer from the count", () => {
    expect(theyAnswered(state({ answered: 1 }))).toBe(true);
    expect(theyAnswered(state({ answered: 1, my_choice: 2 }))).toBe(false);
    expect(theyAnswered(state({ answered: 0 }))).toBe(false);
  });
});

describe("inviteSchema", () => {
  it("rejects an unknown league", () => {
    expect(inviteSchema.safeParse({ friendId: "8f14e45f-ceea-4e7a-9f3b-1c2d3e4f5a6b", league: "pro" }).success).toBe(false);
  });
});

describe("duelStateSchema", () => {
  it("rejects a question without four options", () => {
    expect(() => state({ question: { prompt: "дом", options: ["house"] } })).toThrow();
  });
});

describe("duelsByDay", () => {
  const row = (id: string, status: string, created_at: string) =>
    duelSummarySchema.parse({
      id,
      league: "beginner",
      status,
      is_challenger: true,
      them_username: "bob",
      my_score: 30,
      their_score: 12,
      result: status === "finished" ? "win" : null,
      created_at,
    });

  it("keeps finished duels only, on their UTC day, oldest first", () => {
    const a = "8f14e45f-ceea-4e7a-9f3b-1c2d3e4f5a6a";
    const b = "8f14e45f-ceea-4e7a-9f3b-1c2d3e4f5a6b";
    // duels_list is newest first.
    const days = duelsByDay([
      row(b, "finished", "2026-11-21T08:00:00+00:00"),
      row("8f14e45f-ceea-4e7a-9f3b-1c2d3e4f5a6c", "declined", "2026-11-21T07:00:00+00:00"),
      row(a, "finished", "2026-11-20T23:30:00-02:00"), // 2026-11-21 in UTC
    ]);
    expect([...days.keys()]).toEqual(["2026-11-21"]);
    expect(days.get("2026-11-21")?.map((d) => d.id)).toEqual([a, b]);
  });
});
