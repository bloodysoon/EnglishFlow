import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { WelcomeForm } from "@/components/profile/welcome-form";
import { LogoLink } from "@/components/ui/logo-link";
import { logoutAction } from "@/features/auth/actions/logout.action";
import { getPlatformI18n } from "@/features/i18n/platform";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getPlatformI18n();
  return { title: t.welcome.title };
}

// First visit after sign-up: the platform layout sends learners here until
// they have a nickname. Outside (platform) so that redirect cannot loop.
export default async function WelcomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data }, { locale, t }] = await Promise.all([
    supabase.from("profiles").select("username").eq("id", user.id).maybeSingle(),
    getPlatformI18n(),
  ]);
  if (data?.username) redirect("/dashboard");

  return (
    <div lang={locale} className="flex min-h-dvh flex-col bg-canvas text-fg">
      <header className="flex items-center justify-between gap-3 border-b-[3px] border-line px-4 py-5 sm:px-8 lg:px-10">
        <LogoLink />
        <form action={logoutAction}>
          <button
            type="submit"
            className="min-h-11 cursor-pointer text-sm font-black uppercase underline-offset-4 hover:underline"
          >
            {t.nav.logOut}
          </button>
        </form>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-8">
        <section
          aria-labelledby="welcome-title"
          className="w-full max-w-md border-[3px] border-line bg-raised p-6 shadow-brutal sm:p-8"
        >
          <h1 id="welcome-title" className="text-3xl font-black tracking-tight uppercase sm:text-4xl">
            {t.welcome.title}
            <span className="text-primary">.</span>
          </h1>
          <p className="mt-3 font-semibold text-pretty text-muted">{t.welcome.lead}</p>
          <div className="mt-6">
            <WelcomeForm
              t={t.welcome}
              profile={t.profile}
              sessionEnded={t.common.sessionEnded}
              unexpected={t.common.unexpected}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
