"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { sendFriendRequestAction } from "@/features/friends/actions/friends.action";
import type { PlatformDictionary } from "@/features/i18n/platform";
import { usernameSchema } from "@/features/profile/profile";

// With `username` it is a single button (the public profile page);
// without it, a field to type one (the friends page).
export function AddFriendForm({
  username: fixed,
  t,
  sessionEnded,
  unexpected,
}: {
  username?: string;
  t: PlatformDictionary["friends"];
  sessionEnded: string;
  unexpected: string;
}) {
  const [username, setUsername] = useState(fixed ?? "");
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const valid = usernameSchema.safeParse(username).success;

  async function handleSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSending) return;
    if (!valid) {
      setMessage({ text: t.invalid, ok: false });
      return;
    }

    setIsSending(true);
    setMessage(null);
    try {
      const result = await sendFriendRequestAction(username);
      if (result.success) {
        const ok = result.result === "sent" || result.result === "accepted";
        setMessage({ text: t.results[result.result], ok });
        if (ok && !fixed) setUsername("");
      } else {
        const errors = { invalid_data: t.invalid, not_signed_in: sessionEnded, unexpected };
        setMessage({ text: errors[result.error], ok: false });
      }
    } catch {
      setMessage({ text: unexpected, ok: false });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        {!fixed && (
          <div className="w-full max-w-xs">
            {/* The section heading above says the same; screen readers still need a label. */}
            <Label htmlFor="friend-username" className="sr-only">
              {t.addTitle}
            </Label>
            <div className="flex items-stretch">
              <span aria-hidden="true" className="flex items-center border-[3px] border-r-0 border-line bg-canvas px-3 font-black text-muted">
                @
              </span>
              <Input
                id="friend-username"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                maxLength={20}
                value={username}
                onChange={(event) => {
                  setUsername(event.target.value);
                  setMessage(null);
                }}
              />
            </div>
          </div>
        )}
        <Button type="submit" aria-disabled={isSending || undefined}>
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          {isSending ? t.adding : fixed ? t.addFriend : t.add}
        </Button>
      </div>
      <p role="status" className="text-sm font-bold">
        {message && <span className={message.ok ? undefined : "text-mark"}>{message.text}</span>}
      </p>
    </form>
  );
}
