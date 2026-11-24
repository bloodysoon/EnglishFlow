"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Swords, X } from "lucide-react";

import { duelSummarySchema } from "@/features/duels/duels";
import { fill } from "@/features/i18n/locales";
import type { PlatformDictionary } from "@/features/i18n/platform";
import { createClient } from "@/lib/supabase/client";

// A live "@ana challenges you" banner on every platform page, so a friend
// sees an invite without sitting on /duels. Realtime only delivers rows I
// may read (RLS), the filter just saves traffic.
export function DuelInviteListener({ userId, t }: { userId: string; t: PlatformDictionary["duels"] }) {
  const supabase = useMemo(() => createClient(), []);
  const pathname = usePathname();
  const router = useRouter();
  const [invite, setInvite] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`duel-invites:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "duels", filter: `opponent=eq.${userId}` },
        async (payload) => {
          const duelId = (payload.new as { id?: string }).id;
          const { data } = await supabase.rpc("duels_list");
          const row = duelSummarySchema.array().safeParse(data ?? []).data?.find((d) => d.id === duelId);
          if (row?.status === "invited") setInvite({ id: row.id, name: row.them_username ?? "?" });
          // Server-rendered lists (the /duels invites) pick it up too.
          router.refresh();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userId, router]);

  // Hidden only on that duel's own screen, which already shows the invite.
  if (!invite || pathname === `/duels/${invite.id}`) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-[calc(--spacing(4)+env(safe-area-inset-bottom))] z-50 flex items-center gap-3 border-[3px] border-line bg-box-2 p-3 text-on-box shadow-brutal sm:left-auto sm:max-w-sm"
    >
      <Swords className="h-6 w-6 shrink-0" aria-hidden="true" />
      <p className="min-w-0 flex-1 font-black break-words">{fill(t.toast, { name: invite.name })}</p>
      <Link
        href={`/duels/${invite.id}`}
        onClick={() => setInvite(null)}
        className="shrink-0 border-[3px] border-line bg-raised px-3 py-2 font-black text-fg focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-fg"
      >
        {t.see}
      </Link>
      <button
        type="button"
        onClick={() => setInvite(null)}
        aria-label={t.hide}
        className="grid h-11 w-11 shrink-0 place-items-center focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-fg"
      >
        <X className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  );
}
