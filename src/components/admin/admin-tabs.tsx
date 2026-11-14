"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "General", exact: true },
  { href: "/admin/word-sets", label: "Word sets", exact: false },
  { href: "/admin/users", label: "Users", exact: false },
];

export function AdminTabs() {
  const pathname = usePathname();

  return (
    <nav aria-label="Admin sections" className="flex flex-wrap gap-2">
      {TABS.map(({ href, label, exact }) => {
        const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex min-h-11 items-center border-[2px] border-line px-4 text-sm font-black uppercase shadow-brutal-sm transition-[transform,background-color,box-shadow] duration-150 hover:-translate-y-0.5 hover:shadow-brutal-md motion-reduce:transition-none ${
              active ? "bg-chip text-on-box" : "bg-raised text-fg hover:bg-box-2 hover:text-on-box"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
