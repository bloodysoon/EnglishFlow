import type { Metadata } from "next";

import { AddWordForm } from "@/components/learn/add-word-form";
import { BackLink } from "@/components/learn/back-link";
import { getLearningSettings } from "@/features/settings/profile";

export const metadata: Metadata = { title: "Add a word" };

export default async function AddWordPage() {
  const { settings } = await getLearningSettings();

  return (
    <div className="space-y-8">
      <BackLink href="/learn" label="Learn" />
      <header>
        <h1 className="text-3xl font-black tracking-tight uppercase sm:text-4xl">
          Add a word<span className="text-primary">.</span>
        </h1>
        <p className="mt-2 font-semibold text-muted">
          Met a word you want to keep? Add it and it joins today&apos;s review. Your own words are visible only to you.
        </p>
      </header>
      <AddWordForm language={settings.translationLanguage} />
    </div>
  );
}
