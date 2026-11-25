// PROPOSAL. The Edge Function's decisions, pure (no Deno, no network), so
// they're tested in Node with the app's tests. `claimable` and `tokenOwner`
// model what the SQL functions do (the SQL is the authority); the tests pin
// that behaviour down.

export const INVITE_MS = 5 * 60_000; // duel_settle expires an invite after 5 minutes
export const MAX_ATTEMPTS = 3;
export const LEASE_SECONDS = 30; // an attempt that crashes is taken over after this
export const RETRY_DELAYS_S = [10, 30]; // after attempt 1, 2: well inside the invite's 5 minutes
export const RECEIPT_DELAY_MS = 15 * 60_000; // Expo: check receipts ~15 min after sending
export const RECEIPT_MAX_AGE_MS = 23 * 3600_000; // Expo keeps receipts 24 h
export const JOB_RETENTION_MS = 2 * 24 * 3600_000; // jobs outlive their invite only for receipts
export const TOKEN_RETENTION_MS = 180 * 24 * 3600_000; // a device not seen for 6 months

export const REQUIRED_SECRETS = ["WEBHOOK_SECRET", "EXPO_ACCESS_TOKEN", "SUPABASE_URL"] as const;

// The server-side admin key, as the platform injects it: the new secret key
// (SUPABASE_SECRET_KEYS, a JSON object keyed by name, "default") or, on the
// deprecated path, the legacy SUPABASE_SERVICE_ROLE_KEY. Never logged, never
// returned. null: none usable.
export function adminKey(env: (name: string) => string | undefined): string | null {
  try {
    const keys = JSON.parse(env("SUPABASE_SECRET_KEYS") ?? "null") as Record<string, unknown> | null;
    const k = keys?.default;
    if (typeof k === "string" && k) return k;
  } catch {
    // malformed: fall through
  }
  return env("SUPABASE_SERVICE_ROLE_KEY") || null;
}

export type DuelRow = { id: string; challenger: string; opponent: string; league: string; status: string; created_at: string };
export type Ticket = { status: "ok"; id: string } | { status: "error"; message?: string; details?: { error?: string } };
export type TicketRecord = { token: string; id: string | null; error: string | null };
export type JobStatus = "pending" | "sending" | "sent" | "failed" | "skipped";
export type Job = { status: JobStatus; attempts: number; leaseUntilMs: number | null; nextAttemptMs: number | null };

// Missing configuration: the function refuses to run at all (it never sends
// unauthenticated pushes, and never accepts requests without a secret).
export function missingSecrets(env: (name: string) => string | undefined): string[] {
  const missing: string[] = REQUIRED_SECRETS.filter((n) => !env(n));
  if (!adminKey(env)) missing.push("SUPABASE_SECRET_KEYS");
  return missing;
}

// Constant-time comparison of the webhook's secret header.
export function secretMatches(given: string | null | undefined, expected: string | undefined): boolean {
  if (!given || !expected || given.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < given.length; i++) diff |= given.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

// Push only a live invite, read back from the database (a webhook payload,
// forged or not, only names a duel id): still "invited", sent less than 5
// minutes ago, and to someone else. Never declined, cancelled, expired,
// active or finished duels.
export function inviteLive(d: DuelRow | null, nowMs: number): boolean {
  if (!d || d.status !== "invited" || d.challenger === d.opponent) return false;
  const age = nowMs - Date.parse(d.created_at);
  return Number.isFinite(age) && age >= -60_000 && age < INVITE_MS;
}

// Defense in depth: only tokens owned by the invited player, whatever a
// query returned.
export function recipientTokens(rows: { token: string; user_id: string }[], opponent: string): string[] {
  return [...new Set(rows.filter((r) => r.user_id === opponent).map((r) => r.token))];
}

// What claim_duel_push lets through (the SQL's WHERE), as a model.
export function claimable(j: Job | null, nowMs: number): boolean {
  if (!j) return true; // created pending, then claimed
  if (j.attempts >= MAX_ATTEMPTS) return false;
  if (j.status === "pending") return true;
  if (j.status === "failed") return j.nextAttemptMs === null || j.nextAttemptMs <= nowMs;
  if (j.status === "sending") return j.leaseUntilMs !== null && j.leaseUntilMs < nowMs;
  return false; // sent or skipped: done
}

const LEAGUE: Record<string, string> = { beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced" };

// One message per device. Nothing private: the challenger's username (already
// visible to their friend) and the duel id, which only the two players can
// open. It lives only as long as the invite can be answered (ttl).
export function buildMessages(tokens: string[], challenger: string | null, d: DuelRow, nowMs: number) {
  const ttl = Math.max(1, Math.floor((Date.parse(d.created_at) + INVITE_MS - nowMs) / 1000));
  const who = challenger ? `@${challenger}` : "A friend";
  return tokens.map((to) => ({
    to,
    title: "Duel invite",
    body: `${who} challenges you to a duel · ${LEAGUE[d.league] ?? d.league}`,
    data: { kind: "duel_invite", duelId: d.id },
    sound: "default",
    channelId: "duels",
    priority: "high",
    ttl,
  }));
}

// What an Expo /send call amounted to.
//   accepted  Expo took the batch (tickets, one per message, in order)
//   transient worth retrying: network failure, timeout, 429, 5xx
//   permanent retrying won't help: bad request, bad credentials
export type SendOutcome = { kind: "accepted"; tickets: Ticket[] } | { kind: "transient"; error: string } | { kind: "permanent"; error: string };
export function classifySend(r: { networkError?: boolean; status?: number; body?: unknown }): SendOutcome {
  if (r.networkError) return { kind: "transient", error: "network" };
  const body = (r.body && typeof r.body === "object" ? r.body : {}) as { data?: unknown; errors?: { code?: string }[] };
  const status = r.status ?? 0;
  if (status >= 200 && status < 300 && Array.isArray(body.data)) return { kind: "accepted", tickets: body.data as Ticket[] };
  const code = body.errors?.[0]?.code ?? `http_${status}`;
  if (status === 429 || status >= 500 || code === "TOO_MANY_REQUESTS") return { kind: "transient", error: code };
  return { kind: "permanent", error: code };
}

// After a failed attempt: retry later, or stop (out of attempts, or the
// invite will have expired by then; a push for a dead invite is noise).
export function retryIn(attempt: number, inviteCreatedAtMs: number, nowMs: number): number | null {
  const delay = RETRY_DELAYS_S[attempt - 1];
  if (delay === undefined || attempt >= MAX_ATTEMPTS) return null;
  return nowMs + delay * 1000 < inviteCreatedAtMs + INVITE_MS ? delay : null;
}

// Pair tickets with their tokens (Expo answers in order); tokens Expo says
// are no longer registered are dropped right away.
export function readTickets(tokens: string[], tickets: Ticket[]): { records: TicketRecord[]; deadTokens: string[] } {
  const records = tokens.map((token, i) => {
    const t = tickets[i];
    if (!t) return { token, id: null, error: "NoTicket" };
    return t.status === "ok" ? { token, id: t.id, error: null } : { token, id: null, error: t.details?.error ?? "Error" };
  });
  return { records, deadTokens: records.filter((r) => r.error === "DeviceNotRegistered").map((r) => r.token) };
}

// From the receipts of one job: what to record, and which tokens to drop.
export function readReceipts(records: TicketRecord[], receipts: Record<string, { status: string; details?: { error?: string } }>) {
  const summary: Record<string, string> = {};
  const deadTokens: string[] = [];
  for (const r of records) {
    if (!r.id) continue;
    const rc = receipts[r.id];
    if (!rc) continue; // not ready, or already expired
    const code = rc.status === "ok" ? "ok" : (rc.details?.error ?? "Error");
    summary[r.id] = code;
    if (code === "DeviceNotRegistered") deadTokens.push(r.token);
  }
  return { summary, deadTokens };
}

export const receiptsDue = (sentAtMs: number, nowMs: number) => nowMs - sentAtMs >= RECEIPT_DELAY_MS && nowMs - sentAtMs < RECEIPT_MAX_AGE_MS;

// The token table's rules, as a model of register/unregister_push_token:
// one owner per token, the last account to register it wins, and only the
// owner can unregister it.
export function tokenOwner(ops: ({ op: "register"; token: string; user: string } | { op: "unregister"; token: string; user: string })[]): Map<string, string> {
  const owners = new Map<string, string>();
  for (const o of ops) {
    if (o.op === "register") owners.set(o.token, o.user);
    else if (owners.get(o.token) === o.user) owners.delete(o.token);
  }
  return owners;
}
