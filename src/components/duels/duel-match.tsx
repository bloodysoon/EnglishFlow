"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Check, X } from "lucide-react";

import { DuelInviteActions } from "@/components/duels/duel-launcher";
import { buttonClasses } from "@/components/ui/button";
import {
  DUEL_ROUNDS,
  ROUND_SECONDS,
  duelPhase,
  duelStateSchema,
  secondsLeft,
  theyAnswered,
  type DuelRound,
  type DuelState,
} from "@/features/duels/duels";
import { fill } from "@/features/i18n/locales";
import type { PlatformDictionary } from "@/features/i18n/platform";
import { createClient } from "@/lib/supabase/client";

type Labels = PlatformDictionary["duels"];

// The match screen. The database runs the duel (duel_state / duel_answer);
// this only shows it. Realtime pings on every change of the duel row, and a
// light poll covers a dropped connection and closes rounds after a deadline.
export function DuelMatch({ initial, t, common }: { initial: DuelState; t: Labels; common: PlatformDictionary["common"] }) {
  const supabase = useMemo(() => createClient(), []);
  const id = initial.id;
  const [state, setState] = useState(initial);
  // Server clock minus browser clock, so every player sees the same timer.
  const [offset, setOffset] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [pick, setPick] = useState<{ round: number; choice: number } | null>(null);
  const lastFetch = useRef(0);

  const refresh = useCallback(async () => {
    lastFetch.current = Date.now();
    const sent = Date.now();
    const { data, error } = await supabase.rpc("duel_state", { p_duel: id });
    const parsed = duelStateSchema.safeParse(data);
    if (error || !parsed.success) return;
    setOffset(Date.parse(parsed.data.now) - (sent + Date.now()) / 2);
    setState(parsed.data);
  }, [supabase, id]);

  useEffect(() => {
    // First fetch once subscribed, so no change slips in between.
    const channel = supabase
      .channel(`duel:${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "duels", filter: `id=eq.${id}` }, () => refresh())
      .subscribe((status) => {
        if (status === "SUBSCRIBED") refresh();
      });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, id, refresh]);

  const open = state.status === "invited" || state.status === "active";
  const serverNow = now + offset;
  const phase = duelPhase(state, serverNow);

  // Tick for the timer, and ask again when the screen needs the next step.
  useEffect(() => {
    if (!open) return;
    const timer = setInterval(() => {
      const clientNow = Date.now();
      setNow(clientNow);
      const at = clientNow + offset;
      const since = clientNow - lastFetch.current;
      const needQuestion = state.status === "active" && !state.question && state.starts_at && at >= Date.parse(state.starts_at);
      const pastDeadline = state.status === "active" && state.ends_at && at > Date.parse(state.ends_at) + 500;
      if (((needQuestion || pastDeadline) && since > 700) || since > 3000) refresh();
    }, 100);
    return () => clearInterval(timer);
  }, [open, offset, state, refresh]);

  const myChoice = state.my_choice ?? (pick?.round === state.round ? pick.choice : null);
  const left = secondsLeft(state, serverNow);
  const canAnswer = phase === "question" && !!state.question && myChoice === null && left > 0;

  const answer = useCallback(
    async (choice: number) => {
      if (!canAnswer) return;
      setPick({ round: state.round, choice });
      await supabase.rpc("duel_answer", { p_duel: id, p_round: state.round, p_choice: choice });
      refresh();
    },
    [canAnswer, state.round, supabase, id, refresh],
  );

  useEffect(() => {
    if (!canAnswer) return;
    const onKey = (e: KeyboardEvent) => {
      const n = Number(e.key);
      if (n >= 1 && n <= 4 && !e.altKey && !e.ctrlKey && !e.metaKey) answer(n - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [canAnswer, answer]);

  const them = state.them.username ?? "?";
  const me = state.me.username ?? "?";
  const last = state.rounds.at(-1);

  if (phase === "waiting") {
    return (
      <Panel>
        <p className="text-sm font-black uppercase text-muted">{t.leagues[state.league]}</p>
        <h2 className="mt-2 font-display text-2xl font-black break-all sm:text-3xl">
          {state.is_challenger ? fill(t.waitingFor, { name: them }) : fill(t.invitedYou, { name: them })}
        </h2>
        <div className="mt-6">
          <DuelInviteActions duelId={id} mine={state.is_challenger} t={t} common={common} onDone={refresh} />
        </div>
      </Panel>
    );
  }

  if (phase === "closed") {
    const status = state.status === "declined" || state.status === "cancelled" ? state.status : "expired";
    return (
      <Panel>
        <p className="font-display text-2xl font-black">{fill(t.closed[status], { name: them })}</p>
        <Link href="/duels" className={`mt-6 ${buttonClasses({ variant: "secondary" })}`}>
          {t.back}
        </Link>
      </Panel>
    );
  }

  const scoreboard = (
    <div className="flex items-stretch justify-between gap-3 border-[3px] border-line bg-raised p-3 shadow-brutal-sm sm:p-4">
      <Score name={me} score={state.me.score} />
      <p className="self-center text-center text-sm font-black uppercase text-muted">
        {phase === "finished" ? t.leagues[state.league] : fill(t.round, { n: state.round, total: DUEL_ROUNDS })}
      </p>
      <Score name={them} score={state.them.score} alignEnd />
    </div>
  );

  if (phase === "finished") {
    const title = state.winner === "me" ? t.youWon : state.winner === "them" ? t.youLost : t.draw;
    return (
      <div className="max-w-2xl space-y-6">
        {scoreboard}
        <Panel>
          <h2 className={`font-display text-4xl font-black uppercase ${state.winner === "me" ? "text-primary" : ""}`}>{title}</h2>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={`/duels?friend=${encodeURIComponent(them)}&league=${state.league}`} className={buttonClasses()}>
              {t.rematch}
            </Link>
            <Link href="/duels" className={buttonClasses({ variant: "secondary" })}>
              {t.back}
            </Link>
          </div>
        </Panel>
        <section aria-labelledby="duel-words" className="space-y-3">
          <h2 id="duel-words" className="text-xl font-black uppercase">
            {t.words}
          </h2>
          <ol className="space-y-2">
            {state.rounds.map((r) => (
              <li key={r.round} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-[3px] border-line bg-raised p-3">
                <span className="min-w-0">
                  <span className="block font-black break-words" lang="en">
                    {r.options[r.correct]}
                  </span>
                  <span className="block text-sm font-semibold text-muted break-words">{r.prompt}</span>
                </span>
                <span className="flex flex-wrap gap-x-4 text-sm font-black tabular-nums">
                  <span>
                    @{me}: <Outcome round={r} mine t={t} />
                  </span>
                  <span>
                    @{them}: <Outcome round={r} mine={false} t={t} />
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    );
  }

  // Active: a countdown (with the last round's answer) or the question.
  return (
    <div className="max-w-2xl space-y-6">
      {scoreboard}

      {phase === "countdown" ? (
        <Panel>
          <div aria-live="polite">
            {last ? (
              <>
                <p className="text-sm font-black uppercase text-muted">{last.prompt}</p>
                <p className="mt-2 font-display text-3xl font-black break-words" lang="en">
                  {fill(t.answerWas, { word: last.options[last.correct] })}
                </p>
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 font-black">
                  <span>
                    @{me}: <Outcome round={last} mine t={t} />
                  </span>
                  <span>
                    @{them}: <Outcome round={last} mine={false} t={t} />
                  </span>
                </div>
              </>
            ) : (
              <p className="font-display text-3xl font-black">{t.getReady}</p>
            )}
            {state.round === DUEL_ROUNDS && <p className="mt-4 font-black text-primary">{t.lastRound}</p>}
          </div>
        </Panel>
      ) : (
        <Panel>
          <div
            role="progressbar"
            aria-label={t.timeLeft}
            aria-valuemin={0}
            aria-valuemax={ROUND_SECONDS}
            aria-valuenow={Math.ceil(left)}
            className="h-4 overflow-hidden border-[3px] border-line bg-surface"
          >
            <div className={`h-full ${left < 2 ? "bg-mark" : "bg-primary"}`} style={{ width: `${(left / ROUND_SECONDS) * 100}%` }} />
          </div>
          <p className="mt-5 text-sm font-black uppercase text-muted">{t.pick}</p>
          <p className="mt-1 font-display text-3xl font-black break-words sm:text-4xl">{state.question?.prompt ?? "…"}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {state.question?.options.map((option, i) => (
              <button
                key={i}
                type="button"
                lang="en"
                aria-disabled={!canAnswer || undefined}
                aria-pressed={myChoice === i}
                onClick={() => answer(i)}
                className={`flex min-h-14 items-center gap-3 border-[3px] border-line px-4 py-3 text-left text-lg font-black shadow-brutal-sm transition-transform focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-fg motion-reduce:transition-none ${
                  myChoice === i ? "bg-chip text-on-box" : "bg-raised"
                } ${canAnswer ? "hover:-translate-y-0.5 active:translate-y-0.5" : "cursor-default opacity-80"}`}
              >
                <span aria-hidden="true" className="w-6 shrink-0 border-[2px] border-line text-center text-sm">
                  {i + 1}
                </span>
                <span className="min-w-0 break-words">{option}</span>
              </button>
            ))}
          </div>

          <p className="mt-5 min-h-6 font-semibold text-muted" aria-live="polite">
            {myChoice !== null ? fill(t.waitingAnswer, { name: them }) : theyAnswered(state) ? fill(t.theyAnswered, { name: them }) : t.keys}
          </p>
        </Panel>
      )}
    </div>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <section className="max-w-2xl border-[3px] border-line bg-raised p-5 shadow-brutal sm:p-8">{children}</section>;
}

function Score({ name, score, alignEnd = false }: { name: string; score: number; alignEnd?: boolean }) {
  return (
    <div className={`min-w-0 ${alignEnd ? "text-right" : ""}`}>
      <p className="truncate text-sm font-black">@{name}</p>
      <p className="font-display text-3xl font-black tabular-nums">{score}</p>
    </div>
  );
}

// ✓ +points, ✗ or "no answer" for one player in a closed round.
function Outcome({ round, mine, t }: { round: DuelRound; mine: boolean; t: Labels }) {
  const choice = mine ? round.my_choice : round.their_choice;
  const points = mine ? round.my_points : round.their_points;
  if (choice === null) return <span className="text-muted">{t.noAnswer}</span>;
  return choice === round.correct ? (
    <span className="inline-flex items-center gap-1 text-primary">
      <Check className="h-4 w-4" aria-hidden="true" />
      {fill(t.right, { n: points })}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-mark">
      <X className="h-4 w-4" aria-hidden="true" />
      {t.wrong}
    </span>
  );
}
