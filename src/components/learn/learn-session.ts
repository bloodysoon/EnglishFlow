"use client";

import { useSyncExternalStore } from "react";

// "Current session" numbers on Learn, shared by the word card (writes) and
// the session panel and its header chip (read). They live in the tab
// (sessionStorage): they survive a reload, a filter change and a trip to
// another page, and end when the tab closes.

const SESSION_KEY = "ef-learn-session";
export type Session = { seen: number; added: number; known: number };

const EMPTY: Session = { seen: 0, added: 0, known: 0 };
let current: Session | null = null; // null until first read in the browser
const listeners = new Set<() => void>();

function read(): Session {
  if (current) return current;
  try {
    const s = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? "null") as Partial<Session> | null;
    const ok = (n: unknown) => Number.isInteger(n) && (n as number) >= 0;
    current =
      s && ok(s.seen) && ok(s.added) && ok(s.known) ? { seen: s.seen!, added: s.added!, known: s.known! } : EMPTY;
  } catch {
    current = EMPTY; // storage blocked or the value is not ours
  }
  return current;
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

// Server and first client render agree on zeros; the saved numbers follow.
export const useLearnSession = () => useSyncExternalStore(subscribe, read, () => EMPTY);

// known: true = "I know it", false = "Learn it", null = skipped. by: 1, or -1 to undo.
export function countInSession(known: boolean | null, by: 1 | -1) {
  const s = read();
  current = {
    seen: Math.max(0, s.seen + by),
    added: Math.max(0, s.added + (known === false ? by : 0)),
    known: Math.max(0, s.known + (known === true ? by : 0)),
  };
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(current));
  } catch {} // storage blocked: the numbers still work until reload
  listeners.forEach((listener) => listener());
}
