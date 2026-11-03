import { Navbar } from "@/components/landing/navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { Footer } from "@/components/landing/footer";
import { FinalCtaSection } from "@/components/landing/final-cta-section";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthenticated = Boolean(user);

  return (
    <main className="min-h-dvh bg-brand-orange text-brand-ink">
      <Navbar isAuthenticated={isAuthenticated} email={user?.email ?? ""} />

      <div className="flex min-h-[calc(100dvh-83px)] flex-col">
        <HeroSection isAuthenticated={isAuthenticated} />
      </div>

      <HowItWorksSection />

      <FinalCtaSection isAuthenticated={isAuthenticated} />

      <Footer />
    </main>
  );
}
