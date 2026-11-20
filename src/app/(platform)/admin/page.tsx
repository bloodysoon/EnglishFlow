import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminCard } from "@/components/admin/admin-card";
import { DefaultsForm } from "@/components/admin/defaults-form";
import { XpRulesForm } from "@/components/admin/xp-rules-form";
import { getAdmin } from "@/features/admin/server";
import { getXpRules } from "@/features/admin/xp-rules";
import { getAppSettings } from "@/features/settings/app-settings";

export const metadata: Metadata = { title: "General" };

export default async function AdminGeneralPage() {
  const admin = await getAdmin();
  if (!admin) notFound();

  const [settings, xpRules] = await Promise.all([getAppSettings(admin.supabase), getXpRules(admin.supabase)]);

  return (
    <div className="space-y-8">
      <AdminCard title="New learners" description="Defaults for accounts created from now on. Existing learners keep their choices.">
        <DefaultsForm initial={settings} />
      </AdminCard>

      <AdminCard title="XP rules" description="How much XP each review earns. Box intervals (1, 3, 7, 14, 30 days) are part of the method and stay fixed.">
        <XpRulesForm initial={xpRules} />
      </AdminCard>
    </div>
  );
}
