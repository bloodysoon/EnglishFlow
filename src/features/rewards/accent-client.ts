import { ACCENT_COOKIE, type AccentId } from "./levels";

// Browser only. Applies an accent colour at once and remembers it.
export function applyAccent(id: AccentId) {
  document.cookie = `${ACCENT_COOKIE}=${id}; path=/; max-age=31536000; samesite=lax`;
  if (id === "forest") delete document.documentElement.dataset.accent;
  else document.documentElement.dataset.accent = id;
}
