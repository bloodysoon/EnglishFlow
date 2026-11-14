import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PlatformSidebar } from "@/components/platform/sidebar";
import { getLandingDictionary } from "@/features/i18n/landing";
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

  const themePreference = await getThemePreference();
  // The platform is English-only for now; reuse the landing's labels.
  const { nav } = getLandingDictionary("en");

  return (
    <div className="min-h-dvh bg-canvas text-fg lg:flex">
      <PlatformSidebar
        email={user.email ?? ""}
        themePreference={themePreference}
        themeLabels={{ label: nav.themeLabel, toLight: nav.themeToLight, toDark: nav.themeToDark }}
      />

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:px-10 lg:py-9">
        <div className="mx-auto w-full max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
