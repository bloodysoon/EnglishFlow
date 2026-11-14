import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { PublishToggle } from "@/components/admin/publish-toggle";
import { getAdmin } from "@/features/admin/server";
import { listWordSets, summarizeWordSet } from "@/features/admin/word-sets";

export const metadata: Metadata = { title: "Word sets" };

export default async function AdminWordSetsPage() {
  const admin = await getAdmin();
  if (!admin) notFound();

  const sets = await listWordSets(admin.supabase);

  if (sets.length === 0) {
    return (
      <div className="max-w-2xl border-[3px] border-line bg-surface p-6 shadow-brutal">
        <h2 className="text-xl font-black uppercase">No word sets yet</h2>
        <p className="mt-2 font-semibold text-muted">
          Sets are imported with <code className="font-black">npm run words:fetch</code> and{" "}
          <code className="font-black">npm run words:seed</code> (see content/word-sets/README.md). Once seeded, they
          show up here to review and publish.
        </p>
      </div>
    );
  }

  return (
    <ul className="grid gap-5 lg:grid-cols-2">
      {sets.map((set) => {
        const summary = summarizeWordSet(set.words);
        const ready = summary.missingTranslations === 0 && summary.reviewed.ru === summary.words && summary.reviewed.ro === summary.words;

        return (
          <li key={set.id} className="flex flex-col border-[3px] border-line bg-surface p-5 shadow-brutal">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-black uppercase">{set.title}</h2>
                <p className="mt-1 text-sm font-semibold text-muted">
                  {set.slug}
                  {set.level && ` · ${set.level}`} · {summary.words} words
                </p>
              </div>
              <span
                className={`border-[2px] border-line px-2 py-1 text-xs font-black uppercase ${
                  set.published ? "bg-chip text-on-box" : "bg-raised text-fg"
                }`}
              >
                {set.published ? "Published" : "Draft"}
              </span>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              {[
                ["RU reviewed", `${summary.reviewed.ru}/${summary.words}`],
                ["RO reviewed", `${summary.reviewed.ro}/${summary.words}`],
                ["Missing", String(summary.missingTranslations)],
                ["No level", String(summary.missingLevels)],
              ].map(([label, value]) => (
                <div key={label} className="border-[2px] border-line bg-raised px-3 py-2">
                  <dt className="text-xs font-black uppercase text-muted">{label}</dt>
                  <dd className="font-display text-lg font-black">{value}</dd>
                </div>
              ))}
            </dl>

            {!ready && (
              <p className="mt-4 text-sm font-semibold text-muted">
                Learners only see reviewed translations. Review the rest before publishing.
              </p>
            )}

            <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
              <PublishToggle setId={set.id} title={set.title} published={set.published} />
              <Link
                href={`/admin/word-sets/${set.slug}`}
                className="group inline-flex min-h-11 items-center gap-2 text-sm font-black uppercase underline decoration-[3px] underline-offset-4 hover:decoration-mark"
              >
                Edit words
                <ArrowRight
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </Link>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
