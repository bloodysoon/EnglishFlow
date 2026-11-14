import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BackLink } from "@/components/learn/back-link";
import { SetWordPicker } from "@/components/learn/set-word-picker";
import { getSetForLearner } from "@/features/learning/word-lists";
import { getLearningSettings } from "@/features/settings/profile";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Word set" };

export default async function LearnSetPage({ params }: PageProps<"/learn/sets/[slug]">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // the platform layout already redirects

  const { slug } = await params;
  const { settings } = await getLearningSettings();
  const set = await getSetForLearner(supabase, user.id, slug, settings.translationLanguage);
  if (!set) notFound();

  const inMine = set.words.filter((w) => w.inMyWords).length;

  return (
    <div className="space-y-8">
      <BackLink href="/learn" label="Learn" />
      <header>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-black tracking-tight uppercase sm:text-4xl">{set.title.en ?? set.slug}</h1>
          {set.level && <span className="border-[2px] border-line bg-box-2 px-2 py-0.5 text-sm font-black text-on-box">{set.level}</span>}
        </div>
        {set.description?.en && <p className="mt-2 font-semibold text-muted">{set.description.en}</p>}
        <p className="mt-2 text-sm font-black uppercase">
          {set.words.length} words · {inMine} in your words
        </p>
      </header>

      <SetWordPicker words={set.words} language={settings.translationLanguage} />
    </div>
  );
}
