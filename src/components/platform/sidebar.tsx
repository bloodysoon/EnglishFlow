"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  LayoutDashboard,
  LogOut,
  Settings,
  Trophy,
  UserRound,
} from "lucide-react";

import { ThemeToggle } from "@/components/ui/theme-toggle";
import { logoutAction } from "@/features/auth/actions/logout.action";
import type { ThemePreference } from "@/features/theme/theme";

// `ready: false` sections have no route yet: they render as a non-clickable
// "Soon" item instead of a link that would 404. Flip to true once the page exists.
const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, ready: true },
  { label: "Learn", href: "/learn", icon: BookOpen, ready: false },
  { label: "Statistics", href: "/statistics", icon: BarChart3, ready: false },
  { label: "Achievements", href: "/achievements", icon: Trophy, ready: false },
  { label: "Settings", href: "/settings", icon: Settings, ready: false },
];

type PlatformSidebarProps = {
  email: string;
  themePreference: ThemePreference;
  themeLabels: { label: string; toLight: string; toDark: string };
};

export function PlatformSidebar({ email, themePreference, themeLabels }: PlatformSidebarProps) {
  const pathname = usePathname();

  const initial = email.charAt(0).toUpperCase() || "U";

  return (
    <aside className="border-b-[3px] border-line bg-surface lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-64 lg:shrink-0 lg:flex-col lg:border-r-[3px] lg:border-b-0">
      {/* Logo and theme */}
      <div className="flex items-center justify-between gap-3 border-b-[3px] border-line px-5 py-4">
        <Link href="/dashboard" className="group font-display inline-flex min-h-11 items-center text-xl font-black tracking-tight">
          ELEVO
          <span
            aria-hidden="true"
            className="inline-block text-primary transition-transform duration-500 ease-out group-hover:rotate-180 motion-reduce:transition-none"
          >
            ✳
          </span>
        </Link>

        <ThemeToggle initialPreference={themePreference} labels={themeLabels} />
      </div>

      {/* Navigation */}
      <nav
        aria-label="Platform navigation"
        className="flex gap-2 overflow-x-auto p-3 lg:flex-col lg:gap-2 lg:p-4"
      >
        {navigation.map((item) => {
          const Icon = item.icon;

          if (!item.ready) {
            return (
              <span
                key={item.href}
                className="flex shrink-0 cursor-not-allowed items-center gap-2.5 border-[2px] border-dashed border-line px-3 py-3 text-sm font-black text-muted uppercase"
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
                <span className="ml-auto shrink-0 border-[2px] border-line bg-raised px-1 py-0.5 text-[10px] leading-none text-fg">
                  Soon
                </span>
              </span>
            );
          }

          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex shrink-0 items-center gap-3 border-[2px] border-line px-3 py-3 text-sm font-black uppercase transition-[transform,background-color,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-brutal-sm motion-reduce:transition-none ${
                active
                  ? "bg-chip text-on-box shadow-brutal-sm"
                  : "bg-raised text-fg hover:bg-box-2 hover:text-on-box"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User profile */}
      <div className="border-t-[3px] border-line p-4 lg:mt-auto">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center border-[2px] border-line bg-primary text-lg font-black text-on-primary shadow-brutal-sm">
            {initial}
          </div>

          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 text-xs font-black text-muted uppercase">
              <UserRound className="h-3 w-3" />
              Your account
            </p>

            <p className="mt-1 truncate text-sm font-bold" title={email}>
              {email}
            </p>
          </div>
        </div>

        {/* Logout */}
        <form action={logoutAction} className="mt-4">
          <button
            type="submit"
            className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 border-[2px] border-line bg-raised px-4 py-3 text-sm font-black text-fg uppercase transition-[transform,background-color,box-shadow] duration-150 hover:-translate-y-0.5 hover:bg-box-1 hover:text-on-box hover:shadow-brutal-sm active:translate-y-0 active:shadow-none motion-reduce:transition-none"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </form>
      </div>
    </aside>
  );
}
