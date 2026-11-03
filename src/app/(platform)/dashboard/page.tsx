import Link from "next/link";
import {
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

const stats = [
  {
    label: "Current streak",
    value: "7 days",
    detail: "Keep your momentum",
    icon: Flame,
    background: "bg-brand-orange",
  },
  {
    label: "Total XP",
    value: "1,240",
    detail: "Level 4 learner",
    icon: Zap,
    background: "bg-brand-green",
  },
  {
    label: "English level",
    value: "B1",
    detail: "Intermediate",
    icon: Trophy,
    background: "bg-white",
  },
];

const exercises = [
  {
    title: "Vocabulary",
    description: "Remember words with the Leitner method.",
    icon: Layers3,
    background: "bg-brand-purple",
    textColor: "text-white",
    available: true,
  },
  {
    title: "Grammar",
    description: "Build stronger sentences and master tenses.",
    icon: BookOpen,
    background: "bg-white",
    textColor: "text-brand-ink",
    available: false,
  },
  {
    title: "Listening",
    description: "Train your ears with real English.",
    icon: Headphones,
    background: "bg-brand-pink",
    textColor: "text-brand-ink",
    available: false,
  },
  {
    title: "Translation",
    description: "Practice expressing ideas naturally.",
    icon: Languages,
    background: "bg-brand-green",
    textColor: "text-brand-ink",
    available: false,
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-neutral-600">
            Your learning space
          </p>
          <h1 className="mt-2 text-3xl font-black uppercase tracking-tight sm:text-4xl">
            Dashboard<span className="text-brand-purple">.</span>
          </h1>
        </div>

        <span className="inline-flex items-center gap-2 border-[2px] border-brand-ink bg-white px-3 py-2 text-xs font-black uppercase shadow-[3px_3px_0_#171717]">
          <Sparkles className="h-4 w-4 text-brand-purple" />
          Demo preview
        </span>
      </header>

      {/* Welcome */}
      <section className="relative overflow-hidden border-[3px] border-brand-ink bg-brand-orange p-6 shadow-[6px_6px_0_#171717] sm:p-9">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-block -rotate-2 border-[2px] border-brand-ink bg-brand-green px-3 py-1 text-xs font-black uppercase">
            Your next step starts here ✳
          </span>

          <h2 className="mt-6 text-3xl leading-tight font-black uppercase tracking-tight sm:text-5xl">
            Welcome back.
            <span className="block">Keep moving forward.</span>
          </h2>

          <p className="mt-4 max-w-lg text-base font-semibold sm:text-lg">
            Every practice session counts. Build consistency, strengthen your
            skills, and make your English stick.
          </p>

          <a
            href="#learning-path"
            className="mt-7 inline-flex items-center gap-3 border-[3px] border-brand-ink bg-brand-purple px-5 py-3 text-sm font-black uppercase text-white shadow-[5px_5px_0_#171717] transition-transform hover:-translate-y-1 motion-reduce:transition-none"
          >
            Explore exercises
            <ArrowRight className="h-5 w-5" />
          </a>
        </div>

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -bottom-12 hidden rotate-[-15deg] text-[15rem] leading-none font-black text-brand-cream/50 xl:block"
        >
          ✳
        </div>
      </section>

      {/* Stats */}
      <section aria-labelledby="overview-heading">
        <h2 id="overview-heading" className="mb-4 text-xl font-black uppercase">
          Your progress
        </h2>

        <div className="grid gap-4 sm:grid-cols-3">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <article
                key={stat.label}
                className={`border-[3px] border-brand-ink p-5 shadow-[5px_5px_0_#171717] ${stat.background}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-black uppercase tracking-wide">
                    {stat.label}
                  </p>
                  <Icon className="h-6 w-6" />
                </div>

                <p className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
                  {stat.value}
                </p>

                <p className="mt-2 text-sm font-semibold">{stat.detail}</p>
              </article>
            );
          })}
        </div>
      </section>

      {/* Learning modules */}
      <section id="learning-path" className="scroll-mt-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-black uppercase">Choose your practice</h2>
          <span className="text-xs font-bold uppercase text-neutral-600">
            More exercises coming soon
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {exercises.map((exercise) => {
            const Icon = exercise.icon;

            return (
              <article
                key={exercise.title}
                className={`flex min-h-56 flex-col border-[3px] border-brand-ink p-6 shadow-[5px_5px_0_#171717] ${exercise.background} ${exercise.textColor}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <Icon className="h-9 w-9" />

                  {!exercise.available && (
                    <span className="inline-flex items-center gap-1 border-[2px] border-brand-ink bg-white px-2 py-1 text-[10px] font-black uppercase text-brand-ink">
                      <LockKeyhole className="h-3 w-3" />
                      Coming soon
                    </span>
                  )}
                </div>

                <h3 className="mt-5 text-2xl font-black uppercase">
                  {exercise.title}
                </h3>

                <p className="mt-2 max-w-sm text-sm font-medium">
                  {exercise.description}
                </p>

                <div className="mt-auto pt-5">
                  {exercise.available ? (
                    <span className="inline-flex items-center gap-2 border-[2px] border-brand-ink bg-brand-green px-4 py-2 text-xs font-black uppercase text-brand-ink">
                      First module planned
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  ) : (
                    <span className="text-xs font-black uppercase opacity-70">
                      In development
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Daily goal and level */}
      <section className="grid gap-5 lg:grid-cols-2">
        <article className="border-[3px] border-brand-ink bg-white p-6 shadow-[5px_5px_0_#171717]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black uppercase">Daily goal</h2>
            <Target className="h-6 w-6 text-brand-purple" />
          </div>

          <div className="mt-5 flex items-end justify-between gap-3">
            <p className="text-3xl font-black">13 / 20</p>
            <span className="text-xs font-black uppercase">Minutes</span>
          </div>

          <div
            role="progressbar"
            aria-label="Demo daily learning goal"
            aria-valuenow={13}
            aria-valuemin={0}
            aria-valuemax={20}
            className="mt-4 h-5 overflow-hidden border-[2px] border-brand-ink bg-neutral-100"
          >
            <div className="h-full w-[65%] bg-brand-green" />
          </div>

          <p className="mt-3 text-sm font-semibold text-neutral-600">
            Just 7 more minutes to reach your daily goal.
          </p>
        </article>

        <article className="border-[3px] border-brand-ink bg-white p-6 shadow-[5px_5px_0_#171717]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black uppercase">Learner level</h2>
            <Zap className="h-6 w-6 text-brand-purple" />
          </div>

          <div className="mt-5 flex items-end justify-between gap-3">
            <p className="text-3xl font-black">Level 4</p>
            <span className="text-xs font-black uppercase">1,240 XP</span>
          </div>

          <div
            role="progressbar"
            aria-label="Demo learner level progress"
            aria-valuenow={60}
            aria-valuemin={0}
            aria-valuemax={100}
            className="mt-4 h-5 overflow-hidden border-[2px] border-brand-ink bg-neutral-100"
          >
            <div className="h-full w-[60%] bg-brand-purple" />
          </div>

          <p className="mt-3 text-sm font-semibold text-neutral-600">
            Keep practicing to unlock your next level.
          </p>
        </article>
      </section>

      {/* Coming next */}
      <section className="flex flex-wrap items-center justify-between gap-4 border-[3px] border-brand-ink bg-brand-green p-5 shadow-[5px_5px_0_#171717]">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="h-7 w-7 shrink-0" />
          <div>
            <h2 className="font-black uppercase">Your learning journey</h2>
            <p className="text-sm font-semibold">
              Vocabulary flashcards are our first upcoming module.
            </p>
          </div>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-black uppercase underline underline-offset-4"
        >
          Back to home
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
