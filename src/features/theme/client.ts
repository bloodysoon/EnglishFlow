import { flushSync } from "react-dom";

import { THEME_COOKIE, THEME_COOKIE_MAX_AGE, type ThemePreference } from "./theme";

// Browser only. Every place that changes the theme (the toggle, the
// settings page) goes through here, so they stay in sync.

const THEME_CHANGE_EVENT = "ef-theme-change";

function saveThemePreference(next: ThemePreference) {
  // <html data-theme> drives the tokens in globals.css.
  document.documentElement.setAttribute("data-theme", next);
  document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; samesite=lax`;
  window.dispatchEvent(new CustomEvent<ThemePreference>(THEME_CHANGE_EVENT, { detail: next }));
}

export function onThemeChange(listener: (preference: ThemePreference) => void): () => void {
  const handler = (event: Event) => listener((event as CustomEvent<ThemePreference>).detail);
  window.addEventListener(THEME_CHANGE_EVENT, handler);
  return () => window.removeEventListener(THEME_CHANGE_EVENT, handler);
}

// Applies a theme, revealing it as a circle growing from `origin` (the
// control that was pressed) where the View Transitions API is available
// and motion is welcome.
export function changeTheme(next: ThemePreference, origin?: HTMLElement | null) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!document.startViewTransition || reduceMotion) {
    saveThemePreference(next);
    return;
  }

  const rect = origin?.getBoundingClientRect();
  const x = rect ? rect.left + rect.width / 2 : window.innerWidth;
  const y = rect ? rect.top + rect.height / 2 : 0;
  const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

  const transition = document.startViewTransition(() => {
    flushSync(() => saveThemePreference(next));
  });

  transition.ready
    .then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        {
          duration: 550,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    })
    .catch(() => {
      // Transition skipped (e.g. tab hidden): the theme is applied anyway.
    });
}
