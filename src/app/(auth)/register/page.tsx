import { RegisterForm } from "@/features/components/register-form";

export default function RegisterPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-8 overflow-x-clip bg-[#F76B16] px-4 py-10 sm:px-6 sm:py-14">
      <header className="flex w-full max-w-3xl flex-col items-center gap-5 text-center">
        {/* Welcome badge */}

        <span className="brutal-sticker text-xs sm:text-sm">
          Welcome to EnglishFlow
          <span className="brutal-sticker__icon" aria-hidden="true">
            ✳
          </span>
        </span>

        {/* Main heading */}
        <h1 className="flex w-full flex-col items-center gap-3 text-[clamp(1.5rem,6.5vw,4.5rem)] leading-none font-black tracking-tighter uppercase text-[#171717]">
          <span className="whitespace-nowrap">Stop scrolling.</span>

          <span className="brutal-lift">Start speaking.</span>
        </h1>

        {/* Subtitle */}
        <p className="max-w-md text-base leading-relaxed font-bold text-brand-ink sm:text-lg">
          Your English won&apos;t learn itself.{" "}
          <span className="brutal-highlight">
            Let&apos;s fix that.
            <span className="brutal-highlight__bolt" aria-hidden="true">
              ⚡
            </span>
          </span>
        </p>
      </header>

      <RegisterForm />
    </main>
  );
}
