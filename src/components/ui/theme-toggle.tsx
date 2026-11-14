"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";
import { Moon, Sun } from "lucide-react";

import {
  THEME_COOKIE,
  THEME_COOKIE_MAX_AGE,
  resolveTheme,
  type ThemePreference,
} from "@/features/theme/theme";

const DARK_QUERY = "(prefers-color-scheme: dark)";

function subscribeToSystemTheme(onChange: () => void) {
  const media = window.matchMedia(DARK_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

const getSystemPrefersDark = () => window.matchMedia(DARK_QUERY).matches;
// The server cannot know the OS theme; CSS already paints the right one,
// only the button's pressed state settles after hydration.
const getServerPrefersDark = () => false;

type ThemeToggleProps = {
  initialPreference: ThemePreference;
  labels: { label: string; toLight: string; toDark: string };
};

export function ThemeToggle({ initialPreference, labels }: ThemeToggleProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [preference, setPreference] = useState(initialPreference);
  const systemPrefersDark = useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemPrefersDark,
    getServerPrefersDark,
  );

  const isDark = resolveTheme(preference, systemPrefersDark) === "dark";

  function applyTheme(next: ThemePreference) {
    // <html data-theme> drives the tokens in globals.css.
    document.documentElement.setAttribute("data-theme", next);
    document.cookie = `${THEME_COOKIE}=${next}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; samesite=lax`;
    setPreference(next);
  }

  function handleClick() {
    const next: ThemePreference = isDark ? "light" : "dark";
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (!document.startViewTransition || reduceMotion) {
      applyTheme(next);
      return;
    }

    // Reveal the new theme as a circle growing out of the button.
    const rect = buttonRef.current?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth;
    const y = rect ? rect.top + rect.height / 2 : 0;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y),
    );

    const transition = document.startViewTransition(() => {
      flushSync(() => applyTheme(next));
    });

    transition.ready
      .then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${radius}px at ${x}px ${y}px)`,
            ],
          },
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

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleClick}
      aria-pressed={isDark}
      aria-label={labels.label}
      title={isDark ? labels.toLight : labels.toDark}
      className="
        group relative flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center overflow-hidden
        border-[3px] border-line bg-raised text-fg shadow-brutal-sm
        transition-[transform,box-shadow,background-color] duration-150
        hover:-translate-y-0.5 hover:bg-box-2 hover:text-on-box hover:shadow-brutal-md
        active:translate-x-0.5 active:translate-y-0.5 active:shadow-none
        motion-reduce:transition-none
      "
    >
      {/* Both icons are always rendered; CSS swaps them so the right one
          shows before hydration too. */}
      <Sun
        aria-hidden="true"
        strokeWidth={2.75}
        className="theme-icon-sun absolute h-5 w-5 transition-transform duration-500 ease-out motion-reduce:transition-none"
      />
      <Moon
        aria-hidden="true"
        strokeWidth={2.75}
        className="theme-icon-moon absolute h-5 w-5 transition-transform duration-500 ease-out motion-reduce:transition-none"
      />
    </button>
  );
}
