import type { Metadata } from "next";

import { AddWordForm } from "@/components/learn/add-word-form";
import { BackLink } from "@/components/learn/back-link";
import { getPlatformI18n } from "@/features/i18n/platform";
import { getLearningSettings } from "@/features/settings/profile";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getPlatformI18n();
  return { title: t.meta.addWord };
}

export default async function AddWordPage() {
  const [{ settings }, { t }] = await Promise.all([getLearningSettings(), getPlatformI18n()]);

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0 lg:flex lg:flex-wrap lg:items-baseline lg:gap-x-5 lg:space-y-0">
          <h1 className="text-3xl font-black tracking-tight uppercase sm:text-4xl">
            {t.addWord.title}<span className="text-primary">.</span>
          </h1>
          <p className="mt-2 font-semibold text-muted lg:mt-0">{t.addWord.lead}</p>
        </div>
        <BackLink href="/learn/new-words" label={t.common.learn} />
      </header>
      <AddWordForm language={settings.translationLanguage} t={t.addWord} common={t.common} />
    </div>
  );
}
