// PROPOSAL, NOT DEPLOYED. Supabase Edge Function (Deno): pushes a new duel
// invite to the invited player's devices through the Expo Push Service.
//
// Called by:
//   - a Database Webhook on INSERT into public.duels (header x-webhook-secret)
//   - pg_cron every minute with ?mode=maintenance (same header): retries,
//     receipts, cleanup
// Deploy with JWT verification off (the shared secret authenticates):
//   supabase functions deploy duel-invite-push --no-verify-jwt
// Secrets (all required, or it refuses to run): WEBHOOK_SECRET, EXPO_ACCESS_TOKEN
// (Expo Enhanced Push Security on). SUPABASE_URL and the admin key
// (SUPABASE_SECRET_KEYS, or the legacy SUPABASE_SERVICE_ROLE_KEY) come from the
// platform and never leave this function: not in responses, not in logs.
//
// Delivery: at least one handoff to Expo is attempted per live invite, up to
// MAX_ATTEMPTS while the invite is live; a crashed attempt is retried after its
// lease. Not exactly-once: if an attempt crashes after Expo accepted it but
// before it was recorded, the retry sends again (a rare duplicate). Expo → APNs
// /FCM → device is best effort; receipts tell what happened after the handoff.
import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  adminKey, buildMessages, classifySend, inviteLive, JOB_RETENTION_MS, LEASE_SECONDS, MAX_ATTEMPTS, missingSecrets,
  readReceipts, readTickets, receiptsDue, recipientTokens, retryIn, secretMatches, TOKEN_RETENTION_MS,
  type DuelRow, type TicketRecord,
} from "./logic.ts";

const EXPO = "https://exp.host/--/api/v2/push";
const env = (n: string) => Deno.env.get(n);
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
// One JSON line per event: duel ids, counts and error codes; never tokens, names or emails.
const log = (event: string, fields: Record<string, unknown>) => console.log(JSON.stringify({ fn: "duel-invite-push", event, ...fields }));

Deno.serve(async (req) => {
  const missing = missingSecrets(env);
  if (missing.length) {
    log("misconfigured", { missing });
    return json(500, { error: "misconfigured" });
  }
  if (req.method !== "POST") return json(405, { error: "method" });
  if (!secretMatches(req.headers.get("x-webhook-secret"), env("WEBHOOK_SECRET"))) return json(401, { error: "unauthorized" });

  const db = createClient(env("SUPABASE_URL")!, adminKey(env)!, { auth: { persistSession: false, autoRefreshToken: false } });
  if (new URL(req.url).searchParams.get("mode") === "maintenance") return json(200, await maintenance(db));

  const payload = await req.json().catch(() => null);
  const duelId = payload?.type === "INSERT" && payload?.table === "duels" ? payload?.record?.id : undefined;
  if (typeof duelId !== "string") return json(200, { skipped: "not a duel insert" });
  return json(200, await deliver(db, duelId));
});

// Untyped schema: this function's tables and RPCs are checked by the SQL, not generated types.
type Db = SupabaseClient;
const expoHeaders = () => ({ "content-type": "application/json", accept: "application/json", authorization: `Bearer ${env("EXPO_ACCESS_TOKEN")}` });

// One attempt at one duel's push. Safe to call any number of times, from any
// number of places at once: the claim decides who sends.
async function deliver(db: Db, duelId: string): Promise<Record<string, unknown>> {
  // The webhook only names a duel: everything else is read back.
  const { data: duel } = await db.from("duels").select("id, challenger, opponent, league, status, created_at").eq("id", duelId).maybeSingle<DuelRow>();
  if (!duel) return { skipped: "no such duel" };

  const { data: job, error: claimError } = await db.rpc("claim_duel_push", { p_duel: duel.id, p_recipient: duel.opponent, p_max_attempts: MAX_ATTEMPTS, p_lease_seconds: LEASE_SECONDS });
  if (claimError) {
    log("claim_error", { duel: duel.id, code: claimError.code });
    return { error: "claim" };
  }
  if (!job?.duel_id) return { skipped: "handled elsewhere or done" };
  const attempt: number = job.attempts;
  const finish = (status: string, error: string | null, tickets: TicketRecord[] | null, retry: number | null) =>
    db.rpc("finish_duel_push", { p_duel: duel.id, p_attempt: attempt, p_status: status, p_error: error, p_tickets: tickets, p_retry_in_seconds: retry });

  // Declined, cancelled, accepted or run out since: nothing to send.
  if (!inviteLive(duel, Date.now())) {
    await finish("skipped", "not_live", null, null);
    return { skipped: "not a live invite" };
  }

  const [tokensRes, challengerRes] = await Promise.all([
    db.from("push_tokens").select("token, user_id").eq("user_id", duel.opponent),
    db.from("profiles").select("username").eq("id", duel.challenger).maybeSingle<{ username: string | null }>(),
  ]);
  if (tokensRes.error) {
    await finish("failed", "tokens_read", null, retryIn(attempt, Date.parse(duel.created_at), Date.now()));
    return { error: "tokens" };
  }
  const tokens = recipientTokens(tokensRes.data ?? [], duel.opponent);
  if (!tokens.length) {
    await finish("skipped", "no_devices", null, null);
    log("no_devices", { duel: duel.id });
    return { sent: 0 };
  }

  const messages = buildMessages(tokens, challengerRes.data?.username ?? null, duel, Date.now());
  let outcome;
  try {
    const res = await fetch(`${EXPO}/send`, { method: "POST", headers: expoHeaders(), body: JSON.stringify(messages), signal: AbortSignal.timeout(8_000) });
    outcome = classifySend({ status: res.status, body: await res.json().catch(() => null) });
  } catch {
    outcome = classifySend({ networkError: true });
  }

  if (outcome.kind !== "accepted") {
    const retry = outcome.kind === "transient" ? retryIn(attempt, Date.parse(duel.created_at), Date.now()) : null;
    await finish("failed", outcome.error, null, retry);
    log("send_failed", { duel: duel.id, attempt, kind: outcome.kind, error: outcome.error, retryIn: retry });
    return { error: outcome.error, retry };
  }

  const { records, deadTokens } = readTickets(tokens, outcome.tickets);
  await finish("sent", null, records, null);
  if (deadTokens.length) await db.from("push_tokens").delete().in("token", deadTokens);
  log("sent", { duel: duel.id, attempt, devices: tokens.length, ok: records.filter((r) => r.id).length, dropped: deadTokens.length });
  return { sent: records.filter((r) => r.id).length };
}

// Every minute: retry what failed or was abandoned while its invite is
// live, check receipts that are due, and forget what's old.
async function maintenance(db: Db): Promise<Record<string, unknown>> {
  const now = Date.now();
  const since = new Date(now - 5 * 60_000).toISOString();
  const { data: due } = await db.from("duel_push_jobs").select("duel_id").in("status", ["pending", "failed", "sending"]).lt("attempts", MAX_ATTEMPTS).gte("created_at", since).limit(10);
  // Database webhooks don't retry: a live invite whose webhook call was lost
  // has no job at all. Pick those up too (the claim still sends each once).
  const { data: fresh } = await db.from("duels").select("id").eq("status", "invited").gte("created_at", since).limit(10);
  const queued = new Set((due ?? []).map((j: { duel_id: string }) => j.duel_id));
  const ids = [...queued, ...(fresh ?? []).map((d: { id: string }) => d.id).filter((id: string) => !queued.has(id))];
  let retried = 0;
  for (const id of ids) {
    const r = await deliver(db, id); // the claim skips ones done, not due yet, or still leased
    if (!("skipped" in r)) retried++;
  }

  // At most 100 jobs × 10 devices: within Expo's 1000 ids per request.
  const { data: sent } = await db.from("duel_push_jobs").select("duel_id, updated_at, tickets").eq("status", "sent").is("receipts_checked_at", null).order("updated_at").limit(100);
  const ready = (sent ?? []).filter((r: { updated_at: string }) => receiptsDue(Date.parse(r.updated_at), now));
  const ticketIds = ready.flatMap((r: { tickets: TicketRecord[] }) => r.tickets.map((t) => t.id).filter(Boolean)) as string[];
  let dropped = 0;
  let checked = 0;
  if (ticketIds.length) {
    const res = await fetch(`${EXPO}/getReceipts`, { method: "POST", headers: expoHeaders(), body: JSON.stringify({ ids: ticketIds.slice(0, 1000) }), signal: AbortSignal.timeout(8_000) }).catch(() => null);
    const receipts = res?.ok ? (await res.json().catch(() => null))?.data : null;
    // No answer: leave the jobs unchecked, the next run asks again.
    if (!receipts || typeof receipts !== "object") {
      log("receipts_failed", { status: res?.status ?? null });
      return { retried, receipts: 0, dropped: 0 };
    }
    for (const r of ready as { duel_id: string; tickets: TicketRecord[] }[]) {
      checked++;
      const { summary, deadTokens } = readReceipts(r.tickets, receipts);
      if (deadTokens.length) {
        dropped += deadTokens.length;
        await db.from("push_tokens").delete().in("token", deadTokens);
      }
      await db.from("duel_push_jobs").update({ receipts_checked_at: new Date().toISOString(), receipts: summary }).eq("duel_id", r.duel_id);
    }
  }

  await db.from("duel_push_jobs").delete().lt("created_at", new Date(now - JOB_RETENTION_MS).toISOString());
  await db.from("push_tokens").delete().lt("updated_at", new Date(now - TOKEN_RETENTION_MS).toISOString());
  log("maintenance", { retried, receipts: checked, dropped });
  return { retried, receipts: checked, dropped };
}
