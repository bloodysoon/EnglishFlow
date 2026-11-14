"use server";

import { revalidatePath } from "next/cache";

import { DICTIONARY_LANGUAGES } from "@/features/dictionary/kaikki";
import { wordEditSchema } from "../schemas";
import { getAdmin } from "../server";
import type { AdminActionResult } from "./result";

type ExistingTranslation = { language: string; translation: string; alternatives: string[]; source: string };

export async function updateWordAction(input: unknown): Promise<AdminActionResult> {
  const parsed = wordEditSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_data" };

  const admin = await getAdmin();
  if (!admin) return { success: false, error: "forbidden" };
  const { supabase } = admin;
  const { wordId, level, translations } = parsed.data;

  try {
    const { data: word, error: wordError } = await supabase
      .from("words")
      .select("id, cefr_level, level_source, word_translations(language, translation, alternatives, source)")
      .eq("id", wordId)
      .maybeSingle();

    if (wordError) throw wordError;
    if (!word) return { success: false, error: "not_found" };

    // A level picked by hand is marked manual; an unchanged one keeps its
    // source (credits for CEFR-J / Octanove).
    const levelChanged = word.cefr_level !== level;
    const { error: levelError } = await supabase
      .from("words")
      .update({
        cefr_level: level,
        level_source: level === null ? null : levelChanged ? "manual" : word.level_source,
      })
      .eq("id", wordId);
    if (levelError) throw levelError;

    const existing = new Map(
      ((word.word_translations ?? []) as ExistingTranslation[]).map((t) => [t.language, t]),
    );

    for (const language of DICTIONARY_LANGUAGES) {
      const edit = translations[language];

      if (!edit) {
        const { error } = await supabase.from("word_translations").delete().eq("word_id", wordId).eq("language", language);
        if (error) throw error;
        continue;
      }

      const before = existing.get(language);
      const textChanged =
        !before ||
        before.translation !== edit.translation ||
        JSON.stringify(before.alternatives ?? []) !== JSON.stringify(edit.alternatives);

      const { error } = await supabase.from("word_translations").upsert({
        word_id: wordId,
        language,
        translation: edit.translation,
        alternatives: edit.alternatives,
        reviewed: edit.reviewed,
        source: textChanged ? "manual" : before.source,
      });
      if (error) throw error;
    }
  } catch (error) {
    console.error("[Admin] Saving word failed", { code: (error as { code?: string })?.code });
    return { success: false, error: "unexpected" };
  }

  revalidatePath("/admin/word-sets", "layout");
  return { success: true };
}
