import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ReviewSession } from "@/components/learn/review-session";
import { buttonClasses } from "@/components/ui/button";
import { getLearningOverview, getReviewQueue } from "@/features/learning/queries";
import { introduceTodaysWords } from "@/features/learning/server";
import { getLearningSettings } from "@/features/settings/profile";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Review" };

const dayFormat = new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

export default async function ReviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // the platform layout already redirects

  await introduceTodaysWords(supabase);
  const [{ settings }, overview] = await Promise.all([getLearningSettings(), getLearningOverview(supabase)]);
  const cards = await getReviewQueue(supabase, user.id, settings.translationLanguage, overview.today);

  return (
    <div className="space-y-8">
      <Link
        href="/learn"
        className="group inline-flex min-h-11 items-center gap-2 text-sm font-black uppercase underline decoration-[3px] underline-offset-4 hover:decoration-mark"
      >
        <ArrowLeft
          className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1 motion-reduce:transition-none"
          aria-hidden="true"
        />
        Learn
      </Link>

      <h1 className="text-3xl font-black tracking-tight uppercase sm:text-4xl">
        Review<span className="text-primary">.</span>
      </h1>

      {cards.length > 0 ? (
        <ReviewSession cards={cards} language={settings.translationLanguage} />
      ) : (
        <section className="max-w-xl border-[3px] border-line bg-raised p-6 shadow-brutal sm:p-8">
          <h2 className="font-display text-2xl font-black uppercase">Nothing to review right now</h2>
          <p className="mt-3 font-semibold text-muted">
            {overview.total === 0
              ? "Start a word set to get your first words."
              : overview.nextDueOn
                ? `Your next words are due on ${dayFormat.format(new Date(`${overview.nextDueOn}T00:00:00Z`))}.`
                : overview.queued > 0
                  ? "New words from your sets arrive tomorrow."
                  : "Start another set for new words."}
          </p>
          <Link href="/learn" className={buttonClasses({ className: "mt-6" })}>
            {overview.total === 0 ? "Choose a word set" : "Back to word sets"}
          </Link>
        </section>
      )}
    </div>
  );
}
