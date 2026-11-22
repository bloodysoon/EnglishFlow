"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { EyeOff, Layers, Target } from "lucide-react";

import { ProgressBar } from "@/components/ui/progress-bar";
import { buttonClasses } from "@/components/ui/button";
import { fill } from "@/features/i18n/locales";
import type { PlatformDictionary } from "@/features/i18n/platform";
import { LEARN_HIDDEN_COOKIE, type PanelId } from "@/features/learning/learn-panels";
import { useLearnSession } from "./learn-session";

// The two info panels on Learn ("Today's learning", "Current session") can
// be hidden. A hidden panel becomes a small chip with its numbers next to
// the Tour button; pressing the chip brings the panel back. The choice is
// kept in a cookie so the server renders the right state (no flash).

type Labels = {
  learn: PlatformDictionary["learn"];
  triage: PlatformDictionary["triage"];
};

type Today = { done: number; goal: number; addedText: string };

const HiddenContext = createContext<{ hidden: PanelId[]; toggle: (id: PanelId) => void } | null>(null);

export function useHidden() {
  const value = useContext(HiddenContext);
  if (!value) throw new Error("LearnPanelsProvider is missing");
  return value;
}

export function LearnPanelsProvider({ initialHidden, children }: { initialHidden: PanelId[]; children: ReactNode }) {
  const [hidden, setHidden] = useState(initialHidden);

  const toggle = (id: PanelId) => {
    const next = hidden.includes(id) ? hidden.filter((h) => h !== id) : [...hidden, id];
    setHidden(next);
    document.cookie = `${LEARN_HIDDEN_COOKIE}=${next.join(",")}; path=/; max-age=31536000; samesite=lax`;
  };

  return <HiddenContext.Provider value={{ hidden, toggle }}>{children}</HiddenContext.Provider>;
}

// Header chips for the hidden panels. They pop in (globals.css .chip-pop).
export function PanelChips({ today, labels }: { today: Today; labels: Labels }) {
  const { hidden, toggle } = useHidden();
  const session = useLearnSession();
  const { learn, triage } = labels;
  const chip = buttonClasses({ size: "compact", variant: "secondary", className: "chip-pop" });

  return (
    <>
      {hidden.includes("today") && (
        <button
          type="button"
          onClick={() => toggle("today")}
          aria-label={fill(learn.showPanel, { panel: `${learn.today}: ${today.done} / ${today.goal}` })}
          title={learn.today}
          className={chip}
        >
          <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={3} aria-hidden="true" />
          <span className="text-xs">
            {today.done}/{today.goal}
          </span>
        </button>
      )}
      {hidden.includes("session") && session.seen > 0 && (
        <button
          type="button"
          onClick={() => toggle("session")}
          aria-label={fill(learn.showPanel, {
            panel: `${triage.session}: ${triage.seen} ${session.seen}, ${triage.added} ${session.added}, ${triage.alreadyKnown} ${session.known}`,
          })}
          title={triage.session}
          className={chip}
        >
          <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={3} aria-hidden="true" />
          <span className="text-xs">
            {session.seen}
            <span className="text-primary"> +{session.added}</span>
          </span>
        </button>
      )}
    </>
  );
}

// Folds the panel's height and fades it; nothing is focusable while folded.
export function Collapsible({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div
      inert={!open}
      className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      }`}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

export function HideButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="-m-2 inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center text-muted transition-colors hover:text-fg"
    >
      <EyeOff className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
    </button>
  );
}

export function LearnPanels({ today, labels }: { today: Today; labels: Labels }) {
  const { hidden, toggle } = useHidden();
  const session = useLearnSession();
  const { learn, triage } = labels;
  const decided = session.added + session.known;

  return (
    <div>
      <Collapsible open={!hidden.includes("today")}>
        <section aria-labelledby="today-title" className="border-[3px] border-line bg-raised p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 id="today-title" className="text-sm font-black tracking-widest uppercase">
              {learn.today}
            </h2>
            <div className="flex items-center gap-3">
              {/* The heading may wrap; the counter must not split into "1 /" and "100". */}
              <p className="font-display text-xl font-black whitespace-nowrap">
                {today.done} / {today.goal}
              </p>
              <HideButton label={fill(learn.hidePanel, { panel: learn.today })} onClick={() => toggle("today")} />
            </div>
          </div>
          <ProgressBar
            label={learn.today}
            value={today.done}
            max={today.goal}
            tone="bg-primary"
            className="mt-3 h-3 border-[2px]"
          />
          <p className="mt-2 text-sm font-semibold text-muted">{today.addedText}</p>
        </section>
      </Collapsible>

      <Collapsible open={session.seen > 0 && !hidden.includes("session")}>
        <section aria-labelledby="session-title" className="mt-3 border-[3px] border-line bg-surface p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 id="session-title" className="text-xs font-black tracking-widest uppercase">
              {triage.session}
            </h2>
            <HideButton label={fill(learn.hidePanel, { panel: triage.session })} onClick={() => toggle("session")} />
          </div>
          <dl className="mt-1 grid grid-cols-3 gap-3">
            {[
              [session.seen, triage.seen],
              [session.added, triage.added],
              [session.known, triage.alreadyKnown],
            ].map(([value, label]) => (
              <div key={label} className="flex flex-col-reverse">
                <dt className="text-xs font-semibold text-muted sm:text-sm">{label}</dt>
                <dd className="font-display text-2xl font-black">{value}</dd>
              </div>
            ))}
          </dl>
          {decided > 0 && (
            <div aria-hidden="true" className="mt-3 flex h-3 border-[2px] border-line">
              <span className="bg-primary" style={{ width: `${(session.added / decided) * 100}%` }} />
              <span className="flex-1 bg-box-4" />
            </div>
          )}
        </section>
      </Collapsible>
    </div>
  );
}
