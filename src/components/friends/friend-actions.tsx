"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { updateFriendAction } from "@/features/friends/actions/friends.action";
import type { FriendKind } from "@/features/friends/friends";
import { fill } from "@/features/i18n/locales";
import type { PlatformDictionary } from "@/features/i18n/platform";

type Action = "accept" | "remove" | "block";

// The buttons each kind of row offers. Removing a friend and blocking ask first.
const BUTTONS: Record<FriendKind, { action: Action; label: keyof PlatformDictionary["friends"]; confirm?: "confirmRemove" | "confirmBlock" }[]> = {
  incoming: [
    { action: "accept", label: "accept" },
    { action: "remove", label: "decline" },
    { action: "block", label: "block", confirm: "confirmBlock" },
  ],
  friend: [
    { action: "remove", label: "remove", confirm: "confirmRemove" },
    { action: "block", label: "block", confirm: "confirmBlock" },
  ],
  outgoing: [{ action: "remove", label: "cancel" }],
  blocked: [{ action: "remove", label: "unblock" }],
};

export function FriendActions({
  userId,
  username,
  kind,
  t,
  unexpected,
  doneHref,
}: {
  userId: string;
  username: string;
  kind: FriendKind;
  t: PlatformDictionary["friends"];
  unexpected: string;
  // Where to go once done, for pages that stop existing (a friend's profile).
  doneHref?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function run(action: Action, confirmKey?: "confirmRemove" | "confirmBlock") {
    if (busy) return;
    if (confirmKey && !window.confirm(fill(t[confirmKey], { name: username }))) return;
    setBusy(true);
    setError(false);
    try {
      // On success the action revalidates /friends and the row moves or goes.
      const result = await updateFriendAction(action, userId);
      if (!result.success) setError(true);
      else if (doneHref) router.push(doneHref);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {BUTTONS[kind].map((b) => (
        <Button
          key={b.label}
          type="button"
          size="sm"
          variant={b.action === "accept" ? "primary" : "secondary"}
          aria-disabled={busy || undefined}
          onClick={() => run(b.action, b.confirm)}
        >
          {t[b.label] as string}
        </Button>
      ))}
      {error && (
        <p role="alert" className="w-full text-sm font-bold text-mark">
          {unexpected}
        </p>
      )}
    </div>
  );
}
