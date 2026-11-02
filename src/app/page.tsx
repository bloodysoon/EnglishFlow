import { Navbar } from "@/components/landing/navbar";
import { HeroSection } from "@/components/landing/hero-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { Footer } from "@/components/landing/footer";
import { FinalCtaSection } from "@/components/landing/final-cta-section";

export default function HomePage() {
  return (
    <main className="min-h-dvh bg-brand-orange text-brand-ink">
      {/* Sticky navigation */}
      <Navbar />

      {/* First screen: Hero */}
      <div className="flex min-h-[calc(100dvh-83px)] flex-col">
        <HeroSection />
      </div>

      {/* Second screen: Leitner method */}
      <HowItWorksSection />

      {/* Third screen: Registration CTA */}
      <FinalCtaSection />

      {/* Footer */}
      <Footer />
    </main>
  );
}
