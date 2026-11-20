import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DuelInviteActions, DuelLauncher } from "@/components/duels/duel-launcher";
import { SettingsSection } from "@/components/settings/settings-section";
import { buttonClasses } from "@/components/ui/button";
import { riseStyle } from "@/components/ui/rise";
import { LEAGUES, type DuelSummary, type League } from "@/features/duels/duels";
import { getDuels } from "@/features/duels/queries";
import { getFriends } from "@/features/friends/queries";
import { fill } from "@/features/i18n/locales";
import { dateLocale, getPlatformI18n } from "@/features/i18n/platform";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getPlatformI18n();
  return { title: t.meta.duels };
}

type Props = { searchParams: Promise<{ friend?: string; league?: string }> };

export default async function DuelsPage({ searchParams }: Props) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // ?friend=&league= prefill the form (the match screen's "Rematch").
  const [friends, duels, { locale, t }, query] = await Promise.all([
    getFriends(supabase),
    getDuels(supabase),
    getPlatformI18n(),
    searchParams,
  ]);
  const d = t.duels;
  const myFriends = friends.filter((f) => f.kind === "friend").map((f) => ({ id: f.id, username: f.username }));
  const initialLeague = LEAGUES.find((l) => l === query.league);
  const incoming = duels.filter((x) => x.status === "invited" && !x.is_challenger);
  const history = duels.filter((x) => x.status !== "declined" && !(x.status === "invited" && !x.is_challenger));
  const date = new Intl.DateTimeFormat(dateLocale(locale), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  const label = (x: DuelSummary) =>
    x.result ? d.results[x.result] : x.status === "finished" ? d.results.draw : d.status[x.status];

  return (
    <div className="space-y-10">
      <header className="rise space-y-3 lg:flex lg:flex-wrap lg:items-baseline lg:gap-x-5 lg:space-y-0" style={riseStyle(0)}>
        <h1 className="text-3xl font-black tracking-tight uppercase sm:text-4xl">
          {d.title}
          <span className="text-primary">.</span>
        </h1>
        <p className="max-w-xl font-semibold text-muted">{d.lead}</p>
      </header>

      {incoming.length > 0 && (
        <section className="rise space-y-3" style={riseStyle(1)} aria-labelledby="duels-incoming">
          <h2 id="duels-incoming" className="text-xl font-black uppercase">
            {d.incoming}
          </h2>
          <ul className="space-y-3">
            {incoming.map((x) => (
              <li
                key={x.id}
                className="flex flex-wrap items-center justify-between gap-3 border-[3px] border-line bg-box-2 p-3 text-on-box shadow-brutal-sm sm:p-4"
              >
                <p className="min-w-0 font-black break-all">
                  {fill(d.invitedYou, { name: x.them_username ?? "?" })}{" "}
                  <span className="font-semibold">· {d.leagues[x.league]}</span>
                </p>
                <DuelInviteActions duelId={x.id} mine={false} t={d} common={t.common} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="rise" style={riseStyle(2)}>
        <SettingsSection id="new-duel" title={d.newTitle} description={d.newHint}>
          {myFriends.length > 0 ? (
            <DuelLauncher
              friends={myFriends}
              initialFriend={query.friend}
              initialLeague={initialLeague as League | undefined}
              t={d}
              common={t.common}
            />
          ) : (
            <div className="space-y-4">
              <p className="font-semibold">{d.noFriends}</p>
              <Link href="/friends" className={buttonClasses({ size: "sm" })}>
                {d.findFriends}
              </Link>
            </div>
          )}
        </SettingsSection>
      </div>

      <section className="rise space-y-3" style={riseStyle(3)} aria-labelledby="duels-history">
        <h2 id="duels-history" className="text-xl font-black uppercase">
          {d.history}
        </h2>
        {history.length === 0 ? (
          <p className="font-semibold text-muted">{d.empty}</p>
        ) : (
          <ul className="space-y-3">
            {history.map((x) => (
              <li key={x.id}>
                <Link
                  href={`/duels/${x.id}`}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-[3px] border-line bg-raised p-3 shadow-brutal-sm transition-transform hover:-translate-y-0.5 focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-fg motion-reduce:transition-none sm:p-4"
                >
                  <span className="min-w-0">
                    <span className="block font-black break-all">{fill(d.vs, { name: x.them_username ?? "?" })}</span>
                    <span className="block text-sm font-semibold text-muted">
                      {d.leagues[x.league]} · {date.format(new Date(x.created_at))}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className={`block font-black uppercase ${x.result === "win" ? "text-primary" : ""}`}>{label(x)}</span>
                    {x.status === "finished" && (
                      <span className="block font-black tabular-nums">
                        {x.my_score} : {x.their_score}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
