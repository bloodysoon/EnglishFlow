"use client";

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { Check, X } from "lucide-react";

import { leitnerBoxStyles } from "@/components/landing/leitner-box-styles";
import {
  CALENDAR_DAYS,
  PLAN_DAYS,
  SAMPLE,
  boxOn,
  planMonth,
  type ReviewEvent,
} from "@/components/landing/review-month-plan";
import { LEITNER_BOXES } from "@/features/leitner/boxes";
import { fill } from "@/features/i18n/locales";
import type { LandingDictionary } from "@/features/i18n/landing";

// The whole calendar's schedule, so the next review of each word can show
// ahead in it; only the first PLAN_DAYS are played.
const SCHEDULE = planMonth(SAMPLE, CALENDAR_DAYS);
const EVENTS = SCHEDULE.filter((e) => e.day <= PLAN_DAYS);
const DAYS = Array.from({ length: CALENDAR_DAYS }, (_, i) => i + 1);

// A review plays in four beats, as shares of its stretch of scroll:
// the word shows, "do you remember?", the verdict, then the move.
const THINK_AT = 0.25;
const VERDICT_AT = 0.5;
const MOVE_AT = 0.68;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const easeInOut = (v: number) =>
  v < 0.5 ? 2 * v * v : 1 - (-2 * v + 2) ** 2 / 2;

// Fills a "{word} … {from} … {to}" sentence with elements (the box chips).
function sentence(template: string, parts: Record<string, ReactNode>) {
  return template
    .split(/\{(\w+)\}/)
    .map((piece, i) =>
      i % 2 ? <Fragment key={i}>{parts[piece]}</Fragment> : piece,
    );
}

// A two-week calendar with eight days of reviews played in it by scrolling.
// Each day's reviews play one by one in the panel: the word, "do you
// remember?", the verdict, and the card sliding from its box to the next.
// Once a review has played, the calendar writes it on its day (in the
// colour of its new box), shows the word's next review dashed ahead, and
// the rows below move the word. Scrolling back plays it all back.
export function ReviewMonth({
  t,
  boxLabel,
  boxWord,
}: {
  t: LandingDictionary["review"];
  boxLabel: string; // "Box {box}"
  boxWord: string; // "Box"
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  // Days into the stretch, with the fraction of the current one.
  const [pos, setPos] = useState(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    // Reduced motion: no scrubbing, the finished stretch shows at once.
    const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const track = root.closest<HTMLElement>(".scene-track");
    const pin = root.closest<HTMLElement>(".scene-pin");
    let frame = 0;

    function measure() {
      frame = 0;
      if (still) return setPos(PLAN_DAYS);
      const range = track && pin ? track.offsetHeight - pin.offsetHeight : 0;
      // The days run while the section is pinned (on every width).
      const top = pin ? parseFloat(getComputedStyle(pin).top) || 0 : 0;
      const p =
        track && range > 1
          ? (top - track.getBoundingClientRect().top) / range
          : 1;
      // The last day ends right as the hold does, so the next bit of
      // scroll moves on to the next section.
      setPos(Math.round(clamp01(p) * PLAN_DAYS * 200) / 200);
    }

    function onScroll() {
      if (!frame) frame = requestAnimationFrame(measure);
    }

    measure();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    return () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  const day = Math.min(PLAN_DAYS, Math.floor(pos) + 1);
  const dayShare = pos >= PLAN_DAYS ? 1 : pos - Math.floor(pos);
  const today = EVENTS.filter((e) => e.day === day);

  // Today's reviews share the day's scroll, one after another.
  const local = dayShare * today.length;
  const playing = today.length
    ? Math.min(today.length - 1, Math.floor(local))
    : -1;
  const beat = today.length ? clamp01(local - playing) : 0;
  const current = today[playing];

  // A review counts once it has played to the end.
  const played = (e: ReviewEvent) =>
    e.day < day ||
    (e.day === day &&
      (today.indexOf(e) < playing ||
        (today.indexOf(e) === playing && beat >= 0.98)));
  const done = EVENTS.filter(played);
  // Each word's next review not yet played and still ahead: shown dashed.
  const upcoming = SAMPLE.map(({ word }) =>
    SCHEDULE.find((e) => e.word === word && !played(e) && e.day > day),
  ).filter((e) => e !== undefined);

  // A box number in its box's colour.
  const chip = (box: number) => (
    <span
      className={`mx-0.5 inline-flex h-6 min-w-6 items-center justify-center border-2 border-line px-1 align-middle text-xs font-black ${leitnerBoxStyles[box]}`}
    >
      {box}
    </span>
  );

  return (
    <div>
      <div ref={rootRef} className="mx-auto w-full max-w-[560px]">
        <p className="font-display text-4xl leading-none font-black tabular-nums uppercase sm:text-5xl">
          {fill(t.day, { n: day })}
        </p>

        {/* Today's review, played out */}
        <div className="relative mt-3 h-44 overflow-hidden border-[3px] sm:h-40 border-line bg-raised px-4 py-3 shadow-brutal-sm">
          {current ? (
            <Review
              key={`${current.day}-${current.word}`}
              e={current}
              beat={beat}
              t={t}
              boxLabel={boxLabel}
              chip={chip}
            />
          ) : (
            <Rest day={day} done={done} upcoming={upcoming} t={t} />
          )}
        </div>

        {/* The calendar: each played review on its day, the next ones dashed.
            Phones show each word's initial; the rows below name them. */}
        <ol
          aria-label={t.calendarLabel}
          className="mt-4 grid grid-cols-7 gap-1 sm:gap-1.5"
        >
          {DAYS.map((d) => {
            const reviews = done.filter((e) => e.day === d);
            const later = upcoming.filter((e) => e.day === d);
            const tone =
              d === day
                ? "-translate-y-1 bg-primary text-on-primary shadow-brutal-sm"
                : d < day
                  ? "bg-raised"
                  : "bg-surface text-muted";
            return (
              <li
                key={d}
                className={`flex h-11 flex-col gap-0.5 overflow-hidden border-2 border-line p-0.5 transition-[translate,background-color,box-shadow] duration-200 sm:h-16 sm:p-1 ${tone}`}
              >
                <span className="text-[0.625rem] leading-none font-black">
                  {d}
                </span>
                {reviews.map((e) => (
                  <span
                    key={e.word}
                    lang="en"
                    className={`chip-pop truncate border border-line px-0.5 text-[0.5rem] leading-tight font-black uppercase sm:text-[0.625rem] ${
                      e.remembered
                        ? leitnerBoxStyles[e.next]
                        : "bg-line text-canvas"
                    }`}
                  >
                    <span className="sm:hidden">
                      {e.remembered ? e.word[0] : `↺${e.word[0]}`}
                    </span>
                    <span className="max-sm:hidden">
                      {e.remembered ? e.word : `↺ ${e.word}`}
                    </span>
                  </span>
                ))}
                {later.map((e) => (
                  // Coming back on this day: dashed, not done yet.
                  <span
                    key={e.word}
                    lang="en"
                    className="truncate border border-dashed border-line px-0.5 text-[0.5rem] leading-tight font-black text-fg uppercase opacity-70 sm:text-[0.625rem]"
                  >
                    <span className="sm:hidden">{e.word[0]}</span>
                    <span className="max-sm:hidden">{e.word}</span>
                  </span>
                ))}
              </li>
            );
          })}
        </ol>

        {/* Where each word sits now */}
        <div className="mt-5 grid grid-cols-[5.5rem_1fr] items-end gap-x-3 sm:grid-cols-[6.5rem_1fr]">
          <span />
          <span
            aria-hidden="true"
            className="grid grid-cols-5 pb-1 text-center text-[0.625rem] font-black tracking-wider text-muted uppercase"
          >
            {LEITNER_BOXES.map(({ box }) => (
              <span key={box}>
                <span className="hidden sm:inline">{boxWord} </span>
                {box}
              </span>
            ))}
          </span>
        </div>
        <ul className="grid gap-1.5 sm:gap-2">
          {SAMPLE.map(({ word }) => {
            const box = boxOn(done, word, Infinity);
            const started = done.some((e) => e.word === word);
            return (
              <li
                key={word}
                className="grid grid-cols-[5.5rem_1fr] items-center gap-x-3 sm:grid-cols-[6.5rem_1fr]"
              >
                <span
                  lang="en"
                  className="font-display text-sm font-black uppercase"
                >
                  {/* The initial, as in the calendar on phones */}
                  <span className="border-b-2 border-line">{word[0]}</span>
                  {word.slice(1)}
                </span>
                <div
                  aria-hidden="true"
                  className="relative grid h-7 grid-cols-5 border-2 border-line bg-raised sm:h-9"
                >
                  {LEITNER_BOXES.map(({ box: b }) => (
                    <span
                      key={b}
                      className="border-l-2 border-line first:border-l-0"
                    />
                  ))}
                  <span
                    className={`absolute inset-y-0.5 flex w-[calc(20%-0.25rem)] items-center justify-center border-2 border-line text-[0.625rem] font-black shadow-brutal-sm transition-[left] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${leitnerBoxStyles[box]} ${started ? "" : "opacity-40"}`}
                    style={{ left: `calc(${(box - 1) * 20}% + 0.125rem)` }}
                  >
                    {box}
                  </span>
                </div>
                <span className="sr-only">{fill(boxLabel, { box })}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

// One review in the panel, by beat: the word in its box, "do you
// remember?", the verdict stamp, then the card sliding along the five boxes
// to its new one, with the move said in a sentence.
function Review({
  e,
  beat,
  t,
  boxLabel,
  chip,
}: {
  e: ReviewEvent;
  beat: number;
  t: LandingDictionary["review"];
  boxLabel: string;
  chip: (box: number) => ReactNode;
}) {
  const thinking = beat >= THINK_AT && beat < VERDICT_AT;
  const verdict = beat >= VERDICT_AT;
  const moving = beat >= MOVE_AT;
  const slide = easeInOut(clamp01((beat - MOVE_AT) / (0.95 - MOVE_AT)));
  const at = e.box + (e.next - e.box) * slide;

  return (
    <div className="flex h-full flex-col">
      {/* The word, with its box; then the question, then the verdict */}
      <div className="flex h-11 shrink-0 items-center justify-between gap-3 sm:h-12">
        <p className="card-in flex items-center gap-2">
          <span
            lang="en"
            className="font-display text-xl leading-none font-black uppercase sm:text-3xl"
          >
            {e.word}
          </span>
          {/* Phones: the shelf right below already shows the box. */}
          <span className="text-xs font-black whitespace-nowrap text-muted uppercase max-sm:hidden">
            {fill(boxLabel, { box: e.box })}
          </span>
        </p>

        {thinking && (
          <p
            key="think"
            className="card-in flex items-center gap-2 text-sm font-black"
          >
            {t.thinking}
            <span aria-hidden="true" className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-2 w-2 animate-pulse border border-line bg-fg"
                  style={{ animationDelay: `${i * 150}ms` }}
                />
              ))}
            </span>
          </p>
        )}
        {verdict && (
          <p
            key="verdict"
            className={`stamp flex shrink-0 rotate-[-6deg] items-center gap-1.5 border-[3px] border-line px-2 py-1 text-xs font-black whitespace-nowrap uppercase shadow-brutal-sm sm:px-2.5 sm:text-sm ${
              e.remembered ? "bg-box-3 text-on-box-3" : "bg-line text-canvas"
            }`}
            style={{ animationDelay: "0ms" }}
          >
            {e.remembered ? (
              <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
            ) : (
              <X className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
            )}
            {e.remembered ? t.gotIt : t.forgot}
          </p>
        )}
      </div>

      {/* The five boxes, always there; the card slides on to its new box when it moves */}
      <div className="mt-2 sm:mt-3">
        <div
          aria-hidden="true"
          className="relative grid h-8 grid-cols-5 border-2 border-line bg-canvas"
        >
          {LEITNER_BOXES.map(({ box }) => (
            <span
              key={box}
              className="flex items-center justify-center border-l-2 border-line text-[0.625rem] font-black text-muted first:border-l-0"
            >
              {box}
            </span>
          ))}
          <span
            lang="en"
            className={`absolute inset-y-0.5 flex w-[calc(20%-0.25rem)] items-center justify-center truncate border-2 border-line px-1 text-[0.625rem] font-black uppercase shadow-brutal-sm ${leitnerBoxStyles[slide < 0.5 ? e.box : e.next]}`}
            style={{
              left: `calc(${(at - 1) * 20}% + 0.125rem)`,
              translate: `0 ${-Math.sin(slide * Math.PI) * 10}px`,
            }}
          >
            {e.word}
          </span>
        </div>
        <p
          className={`mt-1.5 text-xs leading-6 font-bold transition-opacity duration-300 sm:text-sm ${moving ? "opacity-100" : "opacity-0"}`}
        >
          {sentence(e.remembered ? t.remembered : t.forgotten, {
            word: (
              <strong lang="en" className="font-black uppercase">
                {e.word}
              </strong>
            ),
            from: chip(e.box),
            to: chip(e.next),
          })}
        </p>
      </div>
    </div>
  );
}

// A day with nothing due: "0 min", the shelf at rest with every word in its
// box, and when the next words come back.
function Rest({
  day,
  done,
  upcoming,
  t,
}: {
  day: number;
  done: ReviewEvent[];
  upcoming: ReviewEvent[];
  t: LandingDictionary["review"];
}) {
  const nextDay = Math.min(...upcoming.map((e) => e.day));
  const nextWords = upcoming.filter((e) => e.day === nextDay);
  const started = SAMPLE.filter(({ word }) =>
    done.some((e) => e.word === word),
  );

  return (
    <div key={day} className="flex h-full flex-col">
      <div className="flex h-11 shrink-0 items-center justify-between gap-3 sm:h-12">
        <p className="card-in font-display text-base leading-tight font-black uppercase sm:text-xl">
          {t.nothingDue}
        </p>
        <p
          className="stamp shrink-0 rotate-[-6deg] border-[3px] border-line bg-box-3 px-2.5 py-1 text-sm font-black text-on-box-3 uppercase shadow-brutal-sm"
          style={{ animationDelay: "0ms" }}
        >
          {t.zeroMin}
        </p>
      </div>

      {/* Same place as on a review day: the shelf (at rest, each word in its
          box), then the line under it */}
      <div className="mt-2 sm:mt-3">
        <div
          aria-hidden="true"
          className="grid h-8 grid-cols-5 border-2 border-line bg-canvas"
        >
          {LEITNER_BOXES.map(({ box }) => {
            const here = started.filter(
              ({ word }) => boxOn(done, word, Infinity) === box,
            );
            return (
              <span
                key={box}
                className="flex items-center justify-center gap-0.5 overflow-hidden border-l-2 border-line px-0.5 text-[0.625rem] font-black text-muted first:border-l-0"
              >
                {here.length
                  ? here.map(({ word }) => (
                      <span
                        key={word}
                        lang="en"
                        className={`truncate border-2 border-line px-1 leading-4 uppercase ${leitnerBoxStyles[box]}`}
                      >
                        {/* Shortened to fit: phones get less room. */}
                        <span className="sm:hidden">
                          {here.length > 1 ? word[0] : word.slice(0, 3)}
                        </span>
                        <span className="hidden sm:inline">
                          {here.length > 1 ? word.slice(0, 3) : word}
                        </span>
                      </span>
                    ))
                  : box}
              </span>
            );
          })}
        </div>

        <p className="mt-1.5 min-h-6 text-xs leading-6 font-bold sm:text-sm">
          {Number.isFinite(nextDay) &&
            sentence(t.nextUp, {
              words: (
                <strong lang="en" className="font-black uppercase">
                  {nextWords.map((e) => e.word).join(", ")}
                </strong>
              ),
              n: nextDay,
            })}
        </p>
      </div>
    </div>
  );
}
