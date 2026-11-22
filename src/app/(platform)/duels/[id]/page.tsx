import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { DuelMatch } from "@/components/duels/duel-match";
import { BackLink } from "@/components/learn/back-link";
import { duelIdSchema, duelStateSchema } from "@/features/duels/duels";
import { getPlatformI18n } from "@/features/i18n/platform";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getPlatformI18n();
  return { title: t.meta.duels };
}

export default async function DuelPage({ params }: Props) {
  const parsedId = duelIdSchema.safeParse((await params).id);
  if (!parsedId.success) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // duel_state returns null for a duel I am not in.
  const [{ data, error }, { t }] = await Promise.all([
    supabase.rpc("duel_state", { p_duel: parsedId.data }),
    getPlatformI18n(),
  ]);
  if (error) throw error;
  const state = duelStateSchema.safeParse(data);
  if (!state.success) notFound();

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <BackLink href="/duels" label={t.duels.back} />
      </div>
      <DuelMatch initial={state.data} t={t.duels} common={t.common} />
    </div>
  );
}
