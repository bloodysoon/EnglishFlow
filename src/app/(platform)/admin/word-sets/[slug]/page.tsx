import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { PublishToggle } from "@/components/admin/publish-toggle";
import { WordEditor } from "@/components/admin/word-editor";
import { getAdmin } from "@/features/admin/server";
import { getWordSet, summarizeWordSet } from "@/features/admin/word-sets";

export const metadata: Metadata = { title: "Edit word set" };

export default async function AdminWordSetPage({ params }: PageProps<"/admin/word-sets/[slug]">) {
  const admin = await getAdmin();
  if (!admin) notFound();

  const { slug } = await params;
  const set = await getWordSet(admin.supabase, slug);
  if (!set) notFound();

  const summary = summarizeWordSet(set.words);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/word-sets"
        className="group inline-flex min-h-11 items-center gap-2 text-sm font-black uppercase underline decoration-[3px] underline-offset-4 hover:decoration-mark"
      >
        <ArrowLeft
          className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-1 motion-reduce:transition-none"
          aria-hidden="true"
        />
        All word sets
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4 border-[3px] border-line bg-surface p-5 shadow-brutal">
        <div>
          <h2 className="text-2xl font-black uppercase">{set.title}</h2>
          <p className="mt-1 font-semibold text-muted">
            {set.slug}
            {set.level && ` · ${set.level}`} · {summary.words} words · RU {summary.reviewed.ru}/{summary.words} reviewed · RO{" "}
            {summary.reviewed.ro}/{summary.words} reviewed
          </p>
        </div>
        <PublishToggle setId={set.id} title={set.title} published={set.published} />
      </div>

      <ul className="space-y-5">
        {set.words.map((word) => (
          <li key={word.id}>
            <WordEditor word={word} />
          </li>
        ))}
      </ul>
    </div>
  );
}
