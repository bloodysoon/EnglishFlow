// Which info panels on Learn (and the progress on Review) the learner has folded away. Shared by the
// server (reads the cookie, renders the right state) and the client
// (writes it), so it must not live in a "use client" file.

export const LEARN_HIDDEN_COOKIE = "ef-learn-hidden";
const PANELS = ["today", "session", "review"] as const;
export type PanelId = (typeof PANELS)[number];

export function parseHiddenPanels(value: string | undefined): PanelId[] {
  return (value ?? "").split(",").filter((id): id is PanelId => (PANELS as readonly string[]).includes(id));
}
