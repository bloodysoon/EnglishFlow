import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Flame,
  Headphones,
  Languages,
  Layers3,
  LockKeyhole,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";

import { buttonClasses } from "@/components/ui/button";
import { riseStyle } from "@/components/ui/rise";

// Box colours double as the app's accent palette (globals.css). Each
// background comes with the text colour that keeps contrast in both themes.
const stats = [
  {
    label: "Current streak",
    value: "7 days",
    detail: "Keep your momentum",
    icon: Flame,
    tone: "bg-box-2 text-on-box",
  },
  {
    label: "Total XP",
    value: "1,240",
    detail: "Level 4 learner",
    icon: Zap,
    tone: "bg-box-3 text-on-box-3",
  },
  {
    label: "English level",
    value: "B1",
    detail: "Intermediate",
    icon: Trophy,
    tone: "bg-raised text-fg",
  },
];

const exercises = [
  {
    title: "Vocabulary",
    description: "Remember words with the Leitner method.",
    icon: Layers3,
    tone: "bg-box-5 text-on-box-5",
    available: true,
  },
  {
    title: "Grammar",
    description: "Build stronger sentences and master tenses.",
    icon: BookOpen,
    tone: "bg-raised text-fg",
    available: false,
  },
  {
    title: "Listening",
    description: "Train your ears with real English.",
    icon: Headphones,
    tone: "bg-box-1 text-on-box",
    available: false,
  },
  {
    title: "Translation",
    description: "Practice expressing ideas naturally.",
    icon: Languages,
    tone: "bg-box-4 text-on-box",
    available: false,
  },
];

const card = "border-[3px] border-line shadow-brutal";

export default function DashboardPage() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <header className="rise space-y-4" style={riseStyle(0)}>
        <h1 className="text-3xl font-black tracking-tight uppercase sm:text-4xl">
          Dashboard<span className="text-primary">.</span>
        </h1>

        {/* Demo notice: every number on this page is sample data until the
            vocabulary module ships. Remove this once stats are real. */}
        <div role="note" className="flex items-start gap-3 border-[3px] border-line bg-raised p-4 shadow-brutal-md">
          <span className="inline-flex shrink-0 -rotate-2 items-center gap-1.5 border-[2px] border-line bg-box-1 px-2 py-1 text-xs font-black text-on-box uppercase">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Demo
          </span>
          <p className="text-sm font-semibold sm:text-base">
            This is a preview. The streak, XP and level below are sample data,
            not your progress. Your real stats start with the vocabulary module.
          </p>
        </div>
      </header>

      {/* Welcome */}
      <section
        aria-labelledby="welcome-heading"
        className={`rise relative overflow-hidden bg-chip p-6 text-on-box sm:p-9 ${card}`}
        style={riseStyle(1)}
      >
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block -rotate-2 border-[2px] border-line bg-raised px-3 py-1 text-xs font-black text-fg uppercase shadow-brutal-sm">
            Your next step starts here ✳
          </span>

          <h2
            id="welcome-heading"
            className="mt-6 flex flex-col items-start gap-3 text-3xl leading-tight font-black tracking-tight uppercase sm:text-5xl"
          >
            <span>Welcome to Elevo.</span>
            <span className="brutal-lift text-[0.7em] whitespace-normal text-fg">Keep moving forward.</span>
          </h2>

          <p className="mt-5 max-w-lg text-base font-semibold sm:text-lg">
            Every practice session counts. Build consistency, strengthen your
            skills, and make your English stick.
          </p>

          <a href="#learning-path" className={buttonClasses({ variant: "primary", className: "group mt-7" })}>
            Explore exercises
            <ArrowDown
              className="h-5 w-5 transition-transform duration-200 group-hover:translate-y-0.5 motion-reduce:transition-none"
              aria-hidden="true"
            />
          </a>
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 -bottom-14 hidden text-[15rem] leading-none font-black text-on-box opacity-15 xl:block"
        >
          ✳
        </div>
      </section>

      {/* Stats */}
      <section aria-labelledby="overview-heading" className="rise" style={riseStyle(2)}>
        <h2 id="overview-heading" className="mb-4 flex flex-wrap items-center gap-3 text-xl font-black uppercase">
          Your progress
          <span className="border-[2px] border-line bg-box-1 px-2 py-0.5 text-xs text-on-box">Sample data</span>
        </h2>

        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <article key={stat.label} className={`p-5 ${card} ${stat.tone}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-black tracking-wide uppercase">{stat.label}</p>
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>

                <p className="font-display mt-5 text-3xl font-black tracking-tight sm:text-4xl">{stat.value}</p>

                <p className="mt-2 text-sm font-semibold">{stat.detail}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* Learning modules */}
      <section id="learning-path" aria-labelledby="practice-heading" className="scroll-mt-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="practice-heading" className="text-xl font-black uppercase">
            Choose your practice
          </h2>
          <span className="text-xs font-bold text-muted uppercase">More exercises coming soon</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {exercises.map((exercise) => {
            const Icon = exercise.icon;

            return (
              <article key={exercise.title} className={`flex min-h-56 flex-col p-6 ${card} ${exercise.tone}`}>
                <div className="flex items-start justify-between gap-3">
                  <Icon className="h-9 w-9" aria-hidden="true" />

                  {!exercise.available && (
                    <span className="inline-flex items-center gap-1 border-[2px] border-line bg-raised px-2 py-1 text-[10px] font-black text-fg uppercase">
                      <LockKeyhole className="h-3 w-3" aria-hidden="true" />
                      Coming soon
                    </span>
                  )}
                </div>

                <h3 className="mt-5 text-2xl font-black uppercase">{exercise.title}</h3>

                <p className="mt-2 max-w-sm text-sm font-medium">{exercise.description}</p>

                <div className="mt-auto pt-5">
                  {/* Status labels, not actions: no button styling or arrow. */}
                  <span className="text-xs font-black uppercase">
                    {exercise.available ? "Next up · first module" : "In development"}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Daily goal and level */}
      <section className="grid gap-5 lg:grid-cols-2">
        <article className={`bg-raised p-6 ${card}`}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black uppercase">Daily goal</h2>
            <Target className="h-6 w-6 text-primary" aria-hidden="true" />
          </div>

          <div className="mt-5 flex items-end justify-between gap-3">
            <p className="font-display text-3xl font-black">13 / 20</p>
            <span className="text-xs font-black uppercase">Minutes</span>
          </div>

          <div
            role="progressbar"
            aria-label="Demo daily learning goal"
            aria-valuenow={13}
            aria-valuemin={0}
            aria-valuemax={20}
            className="mt-4 h-5 overflow-hidden border-[3px] border-line bg-surface"
          >
            <div className="h-full w-[65%] bg-box-3" />
          </div>

          <p className="mt-3 text-sm font-semibold text-muted">Just 7 more minutes to reach your daily goal.</p>
        </article>

        <article className={`bg-raised p-6 ${card}`}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black uppercase">Learner level</h2>
            <Zap className="h-6 w-6 text-primary" aria-hidden="true" />
          </div>

          <div className="mt-5 flex items-end justify-between gap-3">
            <p className="font-display text-3xl font-black">Level 4</p>
            <span className="text-xs font-black uppercase">1,240 XP</span>
          </div>

          <div
            role="progressbar"
            aria-label="Demo learner level progress"
            aria-valuenow={60}
            aria-valuemin={0}
            aria-valuemax={100}
            className="mt-4 h-5 overflow-hidden border-[3px] border-line bg-surface"
          >
            <div className="h-full w-[60%] bg-primary" />
          </div>

          <p className="mt-3 text-sm font-semibold text-muted">Keep practicing to unlock your next level.</p>
        </article>
      </section>

      {/* Coming next */}
      <section className={`flex flex-wrap items-center justify-between gap-4 bg-box-4 p-5 text-on-box ${card}`}>
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-7 w-7 shrink-0" aria-hidden="true" />
          <div>
            <h2 className="font-black uppercase">Your learning journey</h2>
            <p className="text-sm font-semibold">Vocabulary flashcards are our first upcoming module.</p>
          </div>
        </div>

        <Link
          href="/"
          className="group inline-flex min-h-11 items-center gap-2 text-sm font-black uppercase underline decoration-[3px] underline-offset-4"
        >
          Back to home
          <ArrowRight
            className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none"
            aria-hidden="true"
          />
        </Link>
      </section>
    </div>
  );
}
