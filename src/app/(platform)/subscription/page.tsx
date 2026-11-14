import type { Metadata } from "next";
import { Check } from "lucide-react";

import { riseStyle } from "@/components/ui/rise";
import { getPlatformI18n } from "@/features/i18n/platform";
import { plural } from "@/features/i18n/plural";
import { PLAN_ORDER, PLANS, getPlan, type Plan } from "@/features/subscription/plans";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getPlatformI18n();
  return { title: t.meta.subscription };
}

const colors: Record<Plan, string> = {
  free: "bg-surface",
  pro: "bg-box-2 text-on-box",
  unlimited: "bg-box-4 text-on-box",
};

export default async function SubscriptionPage() {
  const [plan, { locale, t }] = await Promise.all([getPlan(await createClient()), getPlatformI18n()]);
  const s = t.subscription;

  return (
    <div className="max-w-5xl space-y-8">
      <h1 className="rise text-3xl font-black tracking-tight uppercase sm:text-4xl" style={riseStyle(0)}>
        {s.title}<span className="text-primary">.</span>
      </h1>

      <ul className="grid gap-5 md:grid-cols-3">
        {PLAN_ORDER.map((id, i) => {
          const p = PLANS[id];
          const { name, tagline } = s.plans[id];
          const current = id === plan;
          const higher = i > PLAN_ORDER.indexOf(plan);

          return (
            <li
              key={id}
              className={`rise flex flex-col border-[3px] border-line p-5 sm:p-6 ${colors[id]} ${
                current ? "shadow-brutal-lg" : "shadow-brutal"
              }`}
              style={riseStyle(i + 1)}
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-2xl font-black uppercase">{name}</h2>
                {current && (
                  <span className="shrink-0 border-[2px] border-line bg-chip px-2 py-0.5 text-xs font-black text-on-box uppercase">
                    {s.yourPlan}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm font-black">{tagline}</p>

              <ul className="mt-5 space-y-3">
                {[
                  p.newWordsPerDay === null ? s.unlimitedNewWords : plural(locale, p.newWordsPerDay, s.newWords),
                  p.customWordsPerDay === null ? s.unlimitedOwnWords : plural(locale, p.customWordsPerDay, s.ownWords),
                  s.allSets,
                  s.dailyReviews,
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 font-semibold">
                    <Check className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={3} aria-hidden="true" />
                    {f}
                  </li>
                ))}
              </ul>

              {higher && (
                // shortcut: plans are switched on by hand in Supabase; replace with checkout once payments exist.
                <p className="mt-auto border-t-[3px] border-line pt-4 text-sm font-black">
                  {s.contact}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
