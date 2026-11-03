"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Settings,
  Trophy,
  UserRound,
} from "lucide-react";

import { logoutAction } from "@/features/auth/actions/logout.action";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Learn", href: "/learn", icon: BookOpen },
  { label: "Statistics", href: "/statistics", icon: BarChart3 },
  { label: "Achievements", href: "/achievements", icon: Trophy },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function PlatformSidebar({ email }: { email: string }) {
  const pathname = usePathname();

  const initial = email.charAt(0).toUpperCase() || "U";

  return (
    <aside className="border-b-[3px] border-brand-ink bg-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:w-64 lg:shrink-0 lg:flex-col lg:border-r-[3px] lg:border-b-0">
      {/* Logo */}
      <div className="flex items-center justify-between border-b-[3px] border-brand-ink px-5 py-5">
        <Link href="/dashboard" className="text-xl font-black tracking-tighter">
          ENGLISHFLOW
          <span className="text-brand-purple">✳</span>
        </Link>

        <GraduationCap className="h-6 w-6 lg:hidden" />
      </div>

      {/* Navigation */}
      <nav
        aria-label="Platform navigation"
        className="flex gap-2 overflow-x-auto p-3 lg:flex-col lg:gap-2 lg:p-4"
      >
        {navigation.map((item) => {
          const Icon = item.icon;

          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex shrink-0 items-center gap-3 border-[2px] border-brand-ink px-3 py-3 text-sm font-black uppercase transition-[transform,background-color,box-shadow] duration-150 hover:-translate-y-0.5 motion-reduce:transition-none ${
                active
                  ? "bg-brand-green shadow-[3px_3px_0_#171717]"
                  : "bg-white hover:bg-brand-cream"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User profile */}
      <div className="border-t-[3px] border-brand-ink p-4 lg:mt-auto">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center border-[2px] border-brand-ink bg-brand-purple text-lg font-black text-white shadow-[3px_3px_0_#171717]">
            {initial}
          </div>

          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 text-xs font-black uppercase text-neutral-500">
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
            className="flex w-full cursor-pointer items-center justify-center gap-2 border-[2px] border-brand-ink bg-white px-4 py-3 text-sm font-black uppercase transition-[transform,background-color,box-shadow] duration-150 hover:-translate-y-0.5 hover:bg-brand-pink hover:shadow-[3px_3px_0_#171717] active:translate-y-0 active:shadow-none motion-reduce:transition-none"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </form>
      </div>
    </aside>
  );
}
