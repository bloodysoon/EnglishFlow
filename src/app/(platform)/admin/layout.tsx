import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminTabs } from "@/components/admin/admin-tabs";
import { getAdmin } from "@/features/admin/server";

export const metadata: Metadata = {
  title: { template: "%s · Admin · Elevo", default: "Admin · Elevo" },
  robots: { index: false, follow: false },
};

// Everyone but the admin gets a plain 404: the panel does not reveal that
// it exists. Every admin action and RLS policy checks the role again.
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  if (!(await getAdmin())) notFound();

  return (
    <div className="space-y-8">
      <header className="space-y-5">
        <h1 className="text-3xl font-black tracking-tight uppercase sm:text-4xl">
          Admin<span className="text-primary">.</span>
        </h1>
        <AdminTabs />
      </header>
      {children}
    </div>
  );
}
