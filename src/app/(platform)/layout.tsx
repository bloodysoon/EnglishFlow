import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DataCredits } from "@/components/learn/data-credits";
import { PlatformSidebar } from "@/components/platform/sidebar";
import { isAdminUser } from "@/features/admin/roles";
import { getLandingDictionary } from "@/features/i18n/landing";
import { getPlatformI18n } from "@/features/i18n/platform";
import { getThemePreference } from "@/features/theme/server";

export default async function PlatformLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const [themePreference, { locale, t }] = await Promise.all([getThemePreference(), getPlatformI18n()]);
  const { nav } = getLandingDictionary(locale);

  return (
    <div lang={locale} className="flex min-h-dvh flex-col bg-canvas text-fg lg:flex-row">
      <PlatformSidebar
        email={user.email ?? ""}
        isAdmin={isAdminUser(user)}
        themePreference={themePreference}
        themeLabels={{ label: nav.themeLabel, toLight: nav.themeToLight, toDark: nav.themeToDark }}
        labels={t.nav}
        notificationLabels={t.notifications}
        locale={locale}
      />

      <main className="flex min-w-0 flex-1 flex-col px-4 py-6 sm:px-8 lg:px-10 lg:py-9">
        <div className="mx-auto w-full max-w-7xl">{children}</div>
        <footer className="mx-auto mt-auto w-full max-w-7xl pt-10">
          <DataCredits labels={t.credits} />
        </footer>
      </main>
    </div>
  );
}
