"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Backpack,
  BarChart3,
  BookOpen,
  ChevronDown,
  Gem,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Swords,
  X,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";

import { NotificationBell } from "@/components/platform/notification-bell";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { logoutAction } from "@/features/auth/actions/logout.action";
import type { Locale } from "@/features/i18n/locales";
import { plural } from "@/features/i18n/plural";
import type { PlatformDictionary } from "@/features/i18n/platform";
import type { ThemePreference } from "@/features/theme/theme";

// `ready: false` sections have no route yet: they render as a non-clickable
// "Soon" item instead of a link that would 404. Flip to true once the page exists.
const navigation = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard, ready: true },
  { key: "learn", href: "/learn", icon: BookOpen, ready: true },
  { key: "subscription", href: "/subscription", icon: Gem, ready: true },
  { key: "statistics", href: "/statistics", icon: BarChart3, ready: true },
  { key: "achievements", href: "/achievements", icon: Trophy, ready: true },
  { key: "inventory", href: "/inventory", icon: Backpack, ready: true },
  { key: "friends", href: "/friends", icon: Users, ready: true },
  { key: "duels", href: "/duels", icon: Swords, ready: true },
  { key: "timeline", href: "/timeline", icon: History, ready: true },
] as const;

// Shown under Learn when it is expanded.
const learnLinks = [
  { key: "newWords", href: "/learn/new-words" },
  { key: "myWords", href: "/learn/words" },
  { key: "review", href: "/learn/review" },
  { key: "boxes", href: "/learn/boxes" },
] as const;

type PlatformSidebarProps = {
  email: string;
  isAdmin?: boolean;
  themePreference: ThemePreference;
  themeLabels: { label: string; toLight: string; toDark: string };
  labels: PlatformDictionary["nav"];
  notificationLabels: PlatformDictionary["notifications"];
  locale: Locale;
};

export function PlatformSidebar({
  email,
  isAdmin = false,
  themePreference,
  themeLabels,
  labels,
  notificationLabels,
  locale,
}: PlatformSidebarProps) {
  const pathname = usePathname();

  const initial = email.charAt(0).toUpperCase() || "U";
  const settingsActive = pathname === "/settings" || pathname.startsWith("/settings/");
  const profileActive = pathname === "/profile";
  const adminActive = pathname === "/admin" || pathname.startsWith("/admin/");
  // Phones and tablets: the menu is a drawer behind a burger button. Desktop: always shown.
  const [open, setOpen] = useState(false);
  // null until the user toggles it: then Learn starts expanded on /learn pages.
  const [learnToggled, setLearnToggled] = useState<boolean | null>(null);
  // Words waiting for review; the bell loads it and reloads after every navigation.
  const [due, setDue] = useState(0);
  const dueText = due > 0 ? plural(locale, due, labels.due) : labels.nothingDue;
  // Box 1 colour: "comes back today" in the Leitner boxes.
  const dueBadge =
    "flex h-6 min-w-6 shrink-0 items-center justify-center border-[2px] border-line bg-box-1 px-1 text-xs leading-none font-black text-on-box shadow-brutal-sm";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const iconButton =
    "flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center border-[2px] border-line bg-raised text-fg shadow-brutal-sm hover:bg-box-2 hover:text-on-box lg:hidden";

  return (
    <aside className="sticky top-0 z-40 border-b-[3px] border-line bg-surface lg:flex lg:h-dvh lg:w-64 lg:shrink-0 lg:flex-col lg:border-r-[3px] lg:border-b-0">
      {/* Logo and theme */}
      <div className="flex items-center justify-between gap-3 border-b-[3px] border-line px-5 py-4">
        <Link
          href="/dashboard"
          className="group font-display inline-flex min-h-11 items-center text-xl font-black tracking-tight"
        >
          ELEVO
          <span
            aria-hidden="true"
            className="inline-block text-primary transition-transform duration-500 ease-out group-hover:rotate-180 motion-reduce:transition-none"
          >
            ✳
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <NotificationBell labels={notificationLabels} locale={locale} onDueCount={setDue} />
          <ThemeToggle initialPreference={themePreference} labels={themeLabels} />
          <button
            type="button"
            className={iconButton}
            aria-label={labels.openMenu}
            aria-expanded={open}
            aria-controls="platform-menu"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Dimmed page behind the open drawer; a tap closes it. Always mounted so it fades both ways. */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-fg/40 transition-opacity duration-300 motion-reduce:transition-none lg:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setOpen(false)}
      />

      {/* Drawer on small screens, plain column on desktop. A tapped link closes it. */}
      <div
        id="platform-menu"
        onClick={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(18rem,85vw)] flex-col overflow-y-auto border-r-[3px] border-line bg-surface transition-[transform,visibility] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none lg:visible lg:static lg:w-auto lg:flex-1 lg:translate-x-0 lg:border-r-0 ${
          open ? "visible translate-x-0" : "invisible -translate-x-full"
        }`}
      >
        <div className="flex justify-end border-b-[3px] border-line p-3 lg:hidden">
          <button type="button" className={iconButton} aria-label={labels.closeMenu} onClick={() => setOpen(false)}>
            <X className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>

        {/* Navigation */}
        <nav aria-label={labels.label} className="flex flex-col gap-2 p-4">
          {navigation.map((item) => {
            const Icon = item.icon;

            if (!item.ready) {
              return (
                <span
                  key={item.href}
                  className="flex shrink-0 cursor-not-allowed items-center gap-2.5 border-[2px] border-dashed border-line px-3 py-3 text-sm font-black text-muted uppercase"
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{labels[item.key]}</span>
                  <span className="ml-auto shrink-0 border-[2px] border-line bg-raised px-1 py-0.5 text-[10px] leading-none text-fg">
                    {labels.soon}
                  </span>
                </span>
              );
            }

            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const itemClass = `lift-safe flex shrink-0 items-center gap-3 border-[2px] border-line px-3 py-3 text-sm font-black uppercase transition-[transform,background-color,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-brutal-sm motion-reduce:transition-none ${
              active ? "bg-chip text-on-box shadow-brutal-sm" : "bg-raised text-fg hover:bg-box-2 hover:text-on-box"
            }`;

            if (item.key === "learn") {
              const expanded = learnToggled ?? active;
              return (
                <div key={item.href} className="flex flex-col">
                  <button
                    type="button"
                    aria-expanded={expanded}
                    aria-controls="learn-submenu"
                    onClick={() => setLearnToggled(!expanded)}
                    className={`${itemClass} w-full cursor-pointer text-left`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span>{labels.learn}</span>
                    {due > 0 && (
                      <>
                        <span className="sr-only">, {dueText}</span>
                        {/* Pulses only while folded: open, the Review row below says it in words. */}
                        <span aria-hidden="true" className={`ml-auto ${dueBadge} ${expanded ? "" : "animate-pulse motion-reduce:animate-none"}`}>
                          {due}
                        </span>
                      </>
                    )}
                    <ChevronDown
                      aria-hidden="true"
                      className={`${due > 0 ? "" : "ml-auto"} h-4 w-4 shrink-0 transition-transform duration-200 motion-reduce:transition-none ${expanded ? "rotate-180" : ""}`}
                      strokeWidth={3}
                    />
                  </button>
                  {/* 0fr → 1fr animates the height (the clipping box has no padding, so folded is 0px); inert keeps closed links out of Tab order. */}
                  <div
                    id="learn-submenu"
                    inert={!expanded}
                    className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out motion-reduce:transition-none ${
                      expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                  <div className="min-h-0 overflow-hidden">
                  <ul className="ml-5 flex flex-col gap-2 border-l-[3px] border-line pt-2 pr-1 pb-1 pl-3">
                    {learnLinks.map((sub) => {
                      const subActive = pathname === sub.href || pathname.startsWith(`${sub.href}/`);
                      return (
                        <li key={sub.href}>
                          <Link
                            href={sub.href}
                            aria-current={subActive ? "page" : undefined}
                            className={`flex min-h-11 items-center gap-2 border-[2px] border-line px-3 py-2 text-xs font-black uppercase transition-colors duration-150 motion-reduce:transition-none ${
                              subActive ? "bg-chip text-on-box shadow-brutal-sm" : "bg-raised text-fg hover:bg-box-2 hover:text-on-box"
                            }`}
                          >
                            {sub.key === "review" ? (
                              <>
                                <span className="flex min-w-0 flex-col">
                                  <span>{labels.review}</span>
                                  <span className="text-[11px] font-bold normal-case opacity-75">{dueText}</span>
                                </span>
                                {due > 0 && (
                                  <span aria-hidden="true" className={`ml-auto ${dueBadge}`}>
                                    {due}
                                  </span>
                                )}
                              </>
                            ) : (
                              labels[sub.key]
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                  </div>
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={itemClass}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{labels[item.key]}</span>
              </Link>
            );
          })}

          {/* Only the admin sees this; /admin itself checks the role again. */}
          {isAdmin && (
            <Link
              href="/admin"
              aria-current={adminActive ? "page" : undefined}
              className={`lift-safe flex shrink-0 items-center gap-3 border-[2px] border-line px-3 py-3 text-sm font-black uppercase transition-[transform,background-color,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-brutal-sm motion-reduce:transition-none lg:mt-4 ${
                adminActive
                  ? "bg-box-5 text-on-box-5 shadow-brutal-sm"
                  : "bg-raised text-fg hover:bg-box-2 hover:text-on-box"
              }`}
            >
              <ShieldCheck className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{labels.admin}</span>
            </Link>
          )}
        </nav>

        {/* User profile */}
        <div className="border-t-[3px] border-line p-4 lg:mt-auto">
          <Link
            href="/profile"
            title={labels.profile}
            aria-current={profileActive ? "page" : undefined}
            className="group -m-1 flex items-center gap-3 p-1"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center border-[2px] border-line bg-primary text-lg font-black text-on-primary shadow-brutal-sm">
              {initial}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[10px] font-black tracking-wider text-muted uppercase">
                {labels.yourAccount}
              </p>
              <p className="truncate text-sm font-bold underline-offset-2 group-hover:underline">{email}</p>
            </div>
          </Link>

          {/* Log out, with settings beside it, like Notion or Slack. */}
          <div className="mt-4 flex gap-2">
            <form action={logoutAction} className="flex-1">
              <button
                type="submit"
                className="lift-safe flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 border-[2px] border-line bg-raised px-4 py-2 text-sm font-black text-fg uppercase shadow-brutal-sm transition-[transform,background-color,box-shadow] duration-150 hover:-translate-y-0.5 hover:bg-box-1 hover:text-on-box hover:shadow-brutal-md active:translate-y-0 active:shadow-none motion-reduce:transition-none"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                {labels.logOut}
              </button>
            </form>

            <Link
              href="/settings"
              aria-label={labels.settings}
              title={labels.settings}
              aria-current={settingsActive ? "page" : undefined}
              className={`lift-safe group flex h-11 w-11 shrink-0 items-center justify-center border-[2px] border-line shadow-brutal-sm transition-[transform,background-color,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-brutal-md active:translate-y-0 active:shadow-none motion-reduce:transition-none ${
                settingsActive ? "bg-chip text-on-box" : "bg-raised text-fg hover:bg-box-2 hover:text-on-box"
              }`}
            >
              <Settings
                className="h-5 w-5 transition-transform duration-500 ease-out group-hover:rotate-90 motion-reduce:transition-none"
                strokeWidth={2.5}
                aria-hidden="true"
              />
            </Link>
          </div>
        </div>
      </div>
    </aside>
  );
}
