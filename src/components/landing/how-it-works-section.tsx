import { LeitnerDecorations } from "@/components/landing/leitner-decorations";
import { SectionScrollLink } from "@/components/landing/section-scroll-link";

const steps = [
  {
    number: "01",
    title: "LEARN",
    emoji: "📚",
    description: "Discover new English words.",
    color: "bg-brand-green",
  },
  {
    number: "02",
    title: "REVIEW",
    emoji: "🧠",
    description: "Review words before you forget.",
    color: "bg-brand-pink",
  },
  {
    number: "03",
    title: "MASTER",
    emoji: "⚡",
    description: "Turn new words into lasting knowledge.",
    color: "bg-brand-cream",
  },
];

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="
        relative flex min-h-[calc(100dvh-83px)] scroll-mt-20
        flex-col justify-center
        overflow-hidden border-t-[3px] border-brand-ink
        bg-brand-cream px-4
        pt-12 pb-36
        sm:px-8 sm:pt-16 sm:pb-40
      "
    >
      {/* Animated Leitner decorations */}
      <LeitnerDecorations />

      {/* Main section content */}
      <div className="relative z-10 mx-auto w-full max-w-6xl 2xl:max-w-4xl">
        {/* Section heading */}
        <div className="mb-10 text-center">
          <span className="inline-block -rotate-2 bg-brand-pink px-3 py-1 text-sm font-black uppercase">
            The Leitner Method
          </span>

          <h2 className="mt-5 text-3xl font-black uppercase tracking-tight sm:text-5xl">
            How it works
          </h2>

          <p className="mt-3 font-bold">
            Three simple steps to stronger vocabulary.
          </p>
        </div>

        {/* Learning steps */}
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <article
              key={step.number}
              className={`
                ${step.color}
                border-[3px] border-brand-ink
                p-6 shadow-[6px_6px_0_#171717]
                transition-[transform,box-shadow] duration-200
                hover:-translate-y-2
                hover:shadow-[9px_9px_0_#171717]
                motion-reduce:transition-none
              `}
            >
              <div className="flex items-start justify-between">
                <span className="text-lg font-black">{step.number}</span>

                <span className="text-4xl" aria-hidden="true">
                  {step.emoji}
                </span>
              </div>

              <h3 className="mt-8 text-3xl font-black uppercase">
                {step.title}
              </h3>

              <p className="mt-3 font-bold">{step.description}</p>
            </article>
          ))}
        </div>
      </div>

      {/* Bottom scroll navigation */}
      <SectionScrollLink
        href="#join-us"
        label="Ready to start?"
        variant="purple"
      />
    </section>
  );
}
