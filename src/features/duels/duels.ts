import { z } from "zod";

// Leagues and their CEFR levels (lower level for rounds 1–4, upper for 5–10);
// keep in sync with duel_make_rounds in supabase/migrations/…_duels.sql.
export const LEAGUES = ["beginner", "intermediate", "advanced"] as const;
export type League = (typeof LEAGUES)[number];
export const LEAGUE_LEVELS: Record<League, string> = {
  beginner: "A1–A2",
  intermediate: "B1–B2",
  advanced: "C1–C2",
};

export const DUEL_ROUNDS = 10;
export const ROUND_SECONDS = 7;

export const duelIdSchema = z.uuid();
export const inviteSchema = z.object({ friendId: z.uuid(), league: z.enum(LEAGUES) });
export const respondSchema = z.object({ duelId: z.uuid(), action: z.enum(["accept", "decline", "cancel"]) });

const STATUSES = ["invited", "active", "finished", "declined", "cancelled", "expired"] as const;
export type DuelStatus = (typeof STATUSES)[number];

const choice = z.number().int().min(0).max(3);
const player = z.object({ username: z.string().nullable(), score: z.number() });

// One closed round, as duel_state returns it.
const roundSchema = z.object({
  round: z.number(),
  prompt: z.string(),
  options: z.array(z.string()).length(4),
  correct: choice,
  my_choice: choice.nullable(),
  my_points: z.number(),
  their_choice: choice.nullable(),
  their_points: z.number(),
});
export type DuelRound = z.infer<typeof roundSchema>;

// The JSON duel_state(p_duel) returns: everything the match screen needs.
export const duelStateSchema = z.object({
  id: z.uuid(),
  league: z.enum(LEAGUES),
  status: z.enum(STATUSES),
  is_challenger: z.boolean(),
  round: z.number(),
  answered: z.number(),
  starts_at: z.string().nullable(),
  ends_at: z.string().nullable(),
  now: z.string(),
  me: player,
  them: player,
  winner: z.enum(["me", "them"]).nullable(),
  question: z.object({ prompt: z.string(), options: z.array(z.string()).length(4) }).nullable(),
  my_choice: choice.nullable(),
  rounds: z.array(roundSchema),
});
export type DuelState = z.infer<typeof duelStateSchema>;

// One row of duels_list().
export const duelSummarySchema = z.object({
  id: z.uuid(),
  league: z.enum(LEAGUES),
  status: z.enum(STATUSES),
  is_challenger: z.boolean(),
  them_username: z.string().nullable(),
  my_score: z.number(),
  their_score: z.number(),
  result: z.enum(["win", "loss", "draw"]).nullable(),
  created_at: z.string(),
});
export type DuelSummary = z.infer<typeof duelSummarySchema>;

// What the match screen shows at a given moment (server time, ms).
export type DuelPhase = "waiting" | "countdown" | "question" | "finished" | "closed";

export function duelPhase(state: DuelState, serverNow: number): DuelPhase {
  if (state.status === "invited") return "waiting";
  if (state.status === "finished") return "finished";
  if (state.status !== "active" || !state.starts_at) return "closed";
  return serverNow < Date.parse(state.starts_at) ? "countdown" : "question";
}

// Seconds left in the round, 0 when over (for the timer bar).
export function secondsLeft(state: DuelState, serverNow: number): number {
  if (!state.ends_at) return 0;
  return Math.max(0, Math.min(ROUND_SECONDS, (Date.parse(state.ends_at) - serverNow) / 1000));
}

// Did the other player answer this round? `answered` counts both of us.
export const theyAnswered = (state: DuelState) => state.answered - (state.my_choice === null ? 0 : 1) > 0;

// Finished duels per UTC day (the timeline's days are UTC too), oldest first.
export function duelsByDay(duels: DuelSummary[]): Map<string, DuelSummary[]> {
  const days = new Map<string, DuelSummary[]>();
  for (const d of [...duels].reverse()) {
    if (d.status !== "finished") continue;
    const day = new Date(d.created_at).toISOString().slice(0, 10);
    days.set(day, [...(days.get(day) ?? []), d]);
  }
  return days;
}
