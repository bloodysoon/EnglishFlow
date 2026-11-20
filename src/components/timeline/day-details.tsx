"use client";

import Link from "next/link";
import { Fragment, useId, useState, useTransition, type ReactNode } from "react";
import { ChevronDown, Swords, Trophy, UserPlus } from "lucide-react";

import { leitnerBoxStyles } from "@/components/landing/leitner-box-styles";
import { chipClasses } from "@/components/ui/chip";
import { fill, type Locale } from "@/features/i18n/locales";
import { plural, type Plural } from "@/features/i18n/plural";
import {
  getDayStepsAction,
  type DayUnlock,
} from "@/features/learning/actions/day-steps.action";
import type { DayStep } from "@/features/learning/queries";
import { TENSE_INFO } from "@/features/writing/tenses";

type Labels = Record<DayStep["kind"], string> & {
  boxMove: string;
  clean: string;
  mistakes: Plural;
  empty: string;
  loading: string;
  unexpected: string;
};

// Background plus its matching text colour (box-5 and primary have their own).
const tones: Record<DayStep["kind"], string> = {
  added: "bg-box-2 text-on-box",
  known: "bg-box-4 text-on-box",
  remembered: "bg-primary text-on-primary",
  forgot: "bg-box-1 text-on-box",
  mastered: "bg-box-5 text-on-box-5",
  practice: "bg-box-3 text-on-box-3",
};

const ms = (iso: string) => Date.parse(iso);

// Friends and duels of the day: the page already has them, with their time.
export type DayEvent = { at: string; kind: "friend" | "duel"; label: string; href?: string };

// The day's date as a button; it unfolds the whole day, event by event,
// right under the date, pushing the next day down.
export function DayDetails({
  day,
  title,
  locale,
  timeLocale,
  labels,
  events = [],
  children,
}: {
  day: string;
  title: string;
  locale: Locale;
  timeLocale: string;
  labels: Labels;
  events?: DayEvent[];
  // The day's summary, shown only while folded.
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [steps, setSteps] = useState<DayStep[] | null>(null);
  const [unlocks, setUnlocks] = useState<DayUnlock[]>([]);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();
  const regionId = useId();
  const time = new Intl.DateTimeFormat(timeLocale, {
    timeStyle: "short",
    timeZone: "UTC",
  });

  const toggle = () => {
    setOpen(!open);
    if (open || steps) return;
    setFailed(false);
    startTransition(async () => {
      const result = await getDayStepsAction(day);
      if (result.success) {
        setSteps(result.steps);
        setUnlocks(result.unlocks);
      } else setFailed(true);
    });
  };

  return (
    <>
      <h2 className="font-black uppercase">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={regionId}
          className="group flex min-h-11 cursor-pointer items-center gap-2 text-left font-black uppercase"
        >
          <time dateTime={day}>{title}</time>
          <ChevronDown
            className={`h-5 w-5 shrink-0 transition-transform duration-300 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
      </h2>

      {/* 0fr → 1fr animates to the content's real height, both ways. */}
      <div
        id={regionId}
        inert={!open}
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          {pending && !steps ? (
            <p className="mt-3 mb-2 font-semibold text-muted">
              {labels.loading}
            </p>
          ) : failed ? (
            <p role="alert" className="mt-3 mb-2 font-semibold">
              {labels.unexpected}
            </p>
          ) : steps?.length === 0 && events.length === 0 ? (
            <p className="mt-3 mb-2 font-semibold text-muted">{labels.empty}</p>
          ) : (
            // Oldest first, so the day reads in the order it happened.
            <ol className="mt-3 mb-2 ml-2 space-y-5 border-l-[3px] border-line">
              {/* Unlocks with no known moment open the day. */}
              {unlocks
                .filter((u) => u.at === null)
                .map((u) => (
                  <UnlockRow key={u.label} unlock={u} time={time} />
                ))}
              {steps?.map((step, i) => (
                <Fragment key={i}>
                  {events
                    .filter((e) => ms(e.at) <= ms(step.at) && (i === 0 || ms(e.at) > ms(steps[i - 1].at)))
                    .map((e) => (
                      <EventRow key={`${e.kind}-${e.at}`} event={e} time={time} />
                    ))}
                  <li className="relative pl-6">
                    <span
                      aria-hidden="true"
                      className={`absolute top-1 -left-[9.5px] h-4 w-4 border-[2px] border-line ${tones[step.kind]}`}
                    />
                    <p className="flex flex-wrap items-baseline gap-x-2">
                      <time
                        dateTime={step.at}
                        className="font-display text-sm font-black text-muted tabular-nums"
                      >
                        {time.format(new Date(step.at))}
                      </time>
                      {/* Same chip as friends and duels, in the step's colour. */}
                      <Link
                        href={`/learn/words/${step.wordId}`}
                        className={chipClasses(tones[step.kind], true)}
                      >
                        {labels[step.kind]}:<span lang="en">{step.lemma}</span>
                      </Link>
                      {step.xp > 0 && (
                        <span className="font-display text-sm text-muted">
                          +{step.xp} XP
                        </span>
                      )}
                    </p>
                    {step.from !== undefined && step.to !== undefined && (
                      <p className="mt-1 text-sm font-semibold">
                        <span
                          className={`border-[2px] border-line px-1.5 ${leitnerBoxStyles[step.to]}`}
                        >
                          {fill(labels.boxMove, {
                            from: step.from,
                            to: step.to,
                          })}
                        </span>
                      </p>
                    )}
                    {step.practice && (
                      <>
                        <p lang="en" className="mt-1 font-semibold break-words">
                          {step.practice.sentence}
                        </p>
                        <p className="text-sm font-semibold">
                          {step.practice.tense && (
                            <span lang="en">
                              {step.practice.tenseOk ? "✓" : "✗"}{" "}
                              {TENSE_INFO[step.practice.tense].name} ·{" "}
                            </span>
                          )}
                          {step.practice.issues.length === 0
                            ? labels.clean
                            : plural(
                                locale,
                                step.practice.issues.length,
                                labels.mistakes,
                              )}
                        </p>
                      </>
                    )}
                  </li>
                  {/* An unlock follows the step that earned it. */}
                  {unlocks
                    .filter(
                      (u) => u.at === step.at && steps[i + 1]?.at !== step.at,
                    )
                    .map((u) => (
                      <UnlockRow key={u.label} unlock={u} time={time} />
                    ))}
                </Fragment>
              ))}
              {events
                .filter((e) => !steps?.length || ms(e.at) > ms(steps[steps.length - 1].at))
                .map((e) => (
                  <EventRow key={`${e.kind}-${e.at}`} event={e} time={time} />
                ))}
            </ol>
          )}
        </div>
      </div>
      {!open && children}
    </>
  );
}

function UnlockRow({
  unlock,
  time,
}: {
  unlock: DayUnlock;
  time: Intl.DateTimeFormat;
}) {
  return (
    <li className="relative pl-6">
      <span
        aria-hidden="true"
        className="absolute top-1 -left-[9.5px] h-4 w-4 border-[2px] border-line bg-primary"
      />
      <p className="flex flex-wrap items-baseline gap-x-2">
        {unlock.at && (
          <time
            dateTime={unlock.at}
            className="font-display text-sm font-black text-muted tabular-nums"
          >
            {time.format(new Date(unlock.at))}
          </time>
        )}
        <span className={chipClasses("bg-chip text-on-box")}>
          <Trophy className="h-4 w-4 shrink-0" aria-hidden="true" />
          {unlock.heading}: {unlock.label}
        </span>
      </p>
    </li>
  );
}

function EventRow({ event, time }: { event: DayEvent; time: Intl.DateTimeFormat }) {
  const Icon = event.kind === "duel" ? Swords : UserPlus;
  const tone = event.kind === "duel" ? "bg-box-4 text-on-box" : "bg-box-3 text-on-box-3";
  const content = (
    <>
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      {event.label}
    </>
  );
  return (
    <li className="relative pl-6">
      <span
        aria-hidden="true"
        className={`absolute top-1 -left-[9.5px] h-4 w-4 border-[2px] border-line ${event.kind === "duel" ? "bg-box-4" : "bg-box-3"}`}
      />
      <p className="flex flex-wrap items-baseline gap-x-2">
        <time dateTime={event.at} className="font-display text-sm font-black text-muted tabular-nums">
          {time.format(new Date(event.at))}
        </time>
        {event.href ? (
          <Link href={event.href} className={chipClasses(tone, true)}>
            {content}
          </Link>
        ) : (
          <span className={chipClasses(tone)}>{content}</span>
        )}
      </p>
    </li>
  );
}
