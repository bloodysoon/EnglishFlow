"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ChoiceGroup } from "@/components/ui/choice-group";
import { inviteDuelAction, respondDuelAction } from "@/features/duels/actions/duels.action";
import { LEAGUE_LEVELS, LEAGUES, type League } from "@/features/duels/duels";
import type { PlatformDictionary } from "@/features/i18n/platform";

type Labels = PlatformDictionary["duels"];

function errorText(error: string, t: Labels, common: PlatformDictionary["common"]) {
  if (error === "not_friends") return t.notFriends;
  if (error === "busy") return t.busy;
  if (error === "not_signed_in") return common.sessionEnded;
  return common.unexpected;
}

// Pick a friend and a league, send the invite, then wait on the match screen.
export function DuelLauncher({
  friends,
  initialFriend,
  initialLeague,
  t,
  common,
}: {
  friends: { id: string; username: string }[];
  initialFriend?: string;
  initialLeague?: League;
  t: Labels;
  common: PlatformDictionary["common"];
}) {
  const router = useRouter();
  const [friendId, setFriendId] = useState(friends.find((f) => f.username === initialFriend)?.id ?? friends[0]?.id ?? "");
  const [league, setLeague] = useState<League>(initialLeague ?? "beginner");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await inviteDuelAction({ friendId, league });
      if (result.success) router.push(`/duels/${result.duelId}`);
      else setError(errorText(result.error, t, common));
    } catch {
      setError(common.unexpected);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={send} className="space-y-5">
      <label className="block">
        <span className="font-black uppercase">{t.friend}</span>
        <select
          value={friendId}
          onChange={(e) => setFriendId(e.target.value)}
          className="mt-2 block min-h-12 w-full border-[3px] border-line bg-raised px-3 font-bold text-fg shadow-brutal-sm focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-fg sm:max-w-sm"
        >
          {friends.map((f) => (
            <option key={f.id} value={f.id}>
              @{f.username}
            </option>
          ))}
        </select>
      </label>

      <ChoiceGroup
        name="league"
        legend={t.league}
        value={league}
        onChange={setLeague}
        choices={LEAGUES.map((l) => ({ value: l, label: t.leagues[l], hint: LEAGUE_LEVELS[l] }))}
      />

      <Button type="submit" aria-disabled={busy || undefined}>
        {busy ? t.challenging : t.challenge}
      </Button>
      {error && (
        <p role="alert" className="text-sm font-bold text-mark">
          {error}
        </p>
      )}
    </form>
  );
}

// Accept / decline buttons for an invite (list rows and the match screen).
export function DuelInviteActions({
  duelId,
  mine,
  t,
  common,
  onDone,
}: {
  duelId: string;
  // I sent it: only "Cancel".
  mine: boolean;
  t: Labels;
  common: PlatformDictionary["common"];
  onDone?: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: "accept" | "decline" | "cancel") {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await respondDuelAction({ duelId, action });
      if (!result.success) setError(errorText(result.error, t, common));
      else if (!result.open) setError(t.gone);
      else if (action === "accept") router.push(`/duels/${duelId}`);
      onDone?.();
    } catch {
      setError(common.unexpected);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {mine ? (
        <Button size="sm" variant="secondary" aria-disabled={busy || undefined} onClick={() => run("cancel")}>
          {t.cancel}
        </Button>
      ) : (
        <>
          <Button size="sm" aria-disabled={busy || undefined} onClick={() => run("accept")}>
            {t.accept}
          </Button>
          <Button size="sm" variant="secondary" aria-disabled={busy || undefined} onClick={() => run("decline")}>
            {t.decline}
          </Button>
        </>
      )}
      {error && (
        <p role="alert" className="w-full text-sm font-bold text-mark">
          {error}
        </p>
      )}
    </div>
  );
}
