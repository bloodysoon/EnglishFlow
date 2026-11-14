"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

import { changeTheme, onThemeChange } from "@/features/theme/client";
import { resolveTheme, type ThemePreference } from "@/features/theme/theme";

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

  // Another control (e.g. the settings page) changed the theme.
  useEffect(() => onThemeChange(setPreference), []);

  function handleClick() {
    changeTheme(isDark ? "light" : "dark", buttonRef.current);
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
