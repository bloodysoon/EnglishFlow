import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PlatformSidebar } from "@/components/platform/sidebar";

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

  return (
    <div className="min-h-dvh bg-brand-cream text-brand-ink lg:flex">
      <PlatformSidebar email={user.email ?? ""} />

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-8 lg:px-10 lg:py-9">
        <div className="mx-auto w-full max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
