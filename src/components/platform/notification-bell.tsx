"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Award, Bell, CalendarCheck, ChevronDown, Medal, Tags, TrendingUp, UserPlus, type LucideIcon } from "lucide-react";

import { leitnerBoxStyles } from "@/components/landing/leitner-box-styles";
import { fill, type Locale } from "@/features/i18n/locales";
import type { PlatformDictionary } from "@/features/i18n/platform";
import { plural } from "@/features/i18n/plural";
import { getNotificationsAction, type Notifications } from "@/features/notifications/actions/get-notifications.action";
import { unseenNotices, type AchievementNotice, type NoticeKind } from "@/features/notifications/notifications";
import { TIME_ZONE_COOKIE } from "@/lib/timezone";

// shortcut: "seen" lives in this browser only, so another device shows the
// same achievements once more; move it to profiles if that bothers anyone.
const seenKey = (userId: string) => `ef-seen-achievements:${userId}`;

function readSeen(userId: string): string[] | null {
  try {
    const raw = localStorage.getItem(seenKey(userId));
    return raw ? (JSON.parse(raw) as string[]) : null;
  } catch {
    return null;
  }
}

// Adds to what was seen, so kinds switched off in settings are not forgotten.
function writeSeen(userId: string, keys: string[]) {
  try {
    const all = new Set([...(readSeen(userId) ?? []), ...keys]);
    localStorage.setItem(seenKey(userId), JSON.stringify([...all]));
  } catch {
    // Private mode or blocked storage: the notices just show again next time.
  }
}

const ICONS: Record<NoticeKind, LucideIcon> = {
  badge: Award,
  milestone: Medal,
  level: TrendingUp,
  topic: Tags,
  challenge: CalendarCheck,
};

// Server code counts "night" and "morning" badges in this zone.
function rememberTimeZone() {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // IANA names ("Europe/Chisinau") are cookie-safe as they are.
    if (zone) document.cookie = `${TIME_ZONE_COOKIE}=${zone}; path=/; max-age=31536000; samesite=lax`;
  } catch {
    // No zone: the server uses UTC.
  }
}

const KIND_LABELS: Record<NoticeKind, (l: PlatformDictionary["notifications"]) => string> = {
  badge: (l) => l.newBadge,
  milestone: (l) => l.newMilestone,
  level: (l) => l.newLevel,
  topic: (l) => l.newTopic,
  challenge: (l) => l.newChallenge,
};

type NotificationBellProps = {
  labels: PlatformDictionary["notifications"];
  locale: Locale;
  // The sidebar shows the same count on Learn, without a second request.
  onDueCount?: (count: number) => void;
};

export function NotificationBell({ labels, locale, onDueCount }: NotificationBellProps) {
  const pathname = usePathname();
  const [data, setData] = useState<Notifications | null>(null);
  const [fresh, setFresh] = useState<AchievementNotice[]>([]);
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(rememberTimeZone, []);

  // Reload after every navigation: a review or a sentence changes what is due and earned.
  useEffect(() => {
    let live = true;
    getNotificationsAction()
      .then((result) => {
        if (!live) return;
        if (!result.success) return setFailed(true);
        const { userId, achievements } = result.notifications;
        setFailed(false);
        setData(result.notifications);
        onDueCount?.(result.notifications.dueCount);
        if (!achievements) return setFresh([]);
        const seen = readSeen(userId);
        if (seen === null) writeSeen(userId, achievements.map((n) => n.key));
        setFresh(unseenNotices(achievements, seen));
      })
      .catch(() => live && setFailed(true));
    return () => {
      live = false;
    };
  }, [pathname, onDueCount]);

  // Closing the panel marks the achievements in it as seen.
  const close = useCallback(
    (refocus: boolean) => {
      setOpen(false);
      if (data?.achievements && fresh.length > 0) {
        writeSeen(data.userId, data.achievements.map((n) => n.key));
        setFresh([]);
      }
      if (refocus) buttonRef.current?.focus();
    },
    [data, fresh.length],
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close(true);
    const onPointer = (e: PointerEvent) => !rootRef.current?.contains(e.target as Node) && close(false);
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open, close]);

  const dueCount = data?.dueCount ?? 0;
  // Like due words, requests stay in the bell until answered on /friends.
  const requests = data?.friendRequests ?? [];
  const count = fresh.length + (dueCount > 0 ? 1 : 0) + (requests.length > 0 ? 1 : 0);
  const chip = "shrink-0 border-[2px] border-line px-1.5 py-0.5 text-[10px] leading-none font-black uppercase";

  return (
    // lg:z-[60]: on desktop the menu column below is a z-50 flex item and would cover the panel.
    // Not positioned below lg, so the panel hangs from the whole top bar and stays on screen.
    <div ref={rootRef} className="lg:relative lg:z-[60]">
      <button
        ref={buttonRef}
        type="button"
        aria-label={count > 0 ? `${labels.label} (${count})` : labels.label}
        aria-expanded={open}
        aria-controls="notification-panel"
        onClick={() => (open ? close(false) : setOpen(true))}
        className="relative flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center border-[2px] border-line bg-raised text-fg shadow-brutal-sm hover:bg-box-2 hover:text-on-box"
      >
        <Bell className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
        {count > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center border-[2px] border-line bg-primary px-1 text-[10px] leading-none font-black text-on-primary"
          >
            {count}
          </span>
        )}
      </button>

      {open && (
        <div
          id="notification-panel"
          role="region"
          aria-label={labels.label}
          className="absolute top-full right-4 left-4 z-50 mt-3 max-h-[min(32rem,75dvh)] overflow-y-auto border-[3px] border-line bg-raised text-fg shadow-brutal sm:left-auto sm:w-[22rem] lg:right-auto lg:left-0"
        >
          <p className="border-b-[3px] border-line px-4 py-3 text-sm font-black uppercase">{labels.label}</p>

          {failed && !data ? (
            <p className="p-4 text-sm font-semibold text-muted">{labels.error}</p>
          ) : count === 0 ? (
            <p className="p-4 text-sm font-semibold text-muted">{labels.empty}</p>
          ) : (
            <ul className="divide-y-[2px] divide-line">
              {requests.length > 0 && (
                <li>
                  <Link
                    href="/friends"
                    onClick={() => close(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-box-2 hover:text-on-box"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center border-[2px] border-line bg-box-3 text-on-box">
                      <UserPlus className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 text-sm leading-tight font-black break-words">
                      {requests.length === 1
                        ? fill(labels.friendRequest, { name: requests[0] })
                        : plural(locale, requests.length, labels.friendRequests)}
                    </span>
                  </Link>
                </li>
              )}

              {fresh.map((notice) => {
                const Icon = ICONS[notice.kind];
                return (
                  <li key={notice.key}>
                    <Link
                      href="/achievements"
                      onClick={() => close(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-box-2 hover:text-on-box"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center border-[2px] border-line bg-box-3 text-on-box">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[10px] font-black tracking-wider text-muted uppercase">
                          {KIND_LABELS[notice.kind](labels)}
                        </span>
                        <span className="block text-sm leading-tight font-black">{notice.title}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}

              {data && dueCount === 1 && data.due[0] && (
                <li>
                  <Link
                    href="/learn/review"
                    onClick={() => close(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm font-black hover:bg-box-2 hover:text-on-box"
                  >
                    <span className="min-w-0 flex-1 break-words">
                      {fill(labels.wordReady, { word: data.due[0].lemma })}
                    </span>
                    <span className={`${chip} ${leitnerBoxStyles[data.due[0].box]}`}>
                      {fill(labels.box, { box: data.due[0].box })}
                    </span>
                  </Link>
                </li>
              )}

              {data && dueCount > 1 && (
                <li>
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 text-sm font-black hover:bg-box-2 hover:text-on-box [&::-webkit-details-marker]:hidden">
                      <span className="min-w-0 flex-1">{plural(locale, dueCount, labels.wordsReady)}</span>
                      <ChevronDown
                        className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
                        aria-hidden="true"
                      />
                    </summary>
                    <ul className="space-y-1.5 px-4 pb-3">
                      {data.due.map((word, i) => (
                        <li key={`${word.lemma}-${i}`} className="flex items-center gap-2 text-sm font-bold">
                          <span className="min-w-0 flex-1 truncate">{word.lemma}</span>
                          <span className={`${chip} ${leitnerBoxStyles[word.box]}`}>
                            {fill(labels.box, { box: word.box })}
                          </span>
                        </li>
                      ))}
                      {dueCount > data.due.length && (
                        <li className="text-xs font-bold text-muted">
                          {fill(labels.more, { n: dueCount - data.due.length })}
                        </li>
                      )}
                    </ul>
                    <div className="px-4 pb-4">
                      <Link
                        href="/learn/review"
                        onClick={() => close(false)}
                        className="inline-flex min-h-11 items-center border-[2px] border-line bg-primary px-4 text-sm font-black text-on-primary uppercase shadow-brutal-sm hover:-translate-y-0.5 motion-reduce:transition-none"
                      >
                        {labels.startReview}
                      </Link>
                    </div>
                  </details>
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
