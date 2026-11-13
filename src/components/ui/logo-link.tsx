import Link from "next/link";

// Brand wordmark that links home. Gives pages without the landing navbar
// (login, register) a visible way back to the start page.
export function LogoLink({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`inline-flex items-center px-1 py-2 text-xl font-black tracking-tighter text-brand-ink transition-transform duration-200 hover:-rotate-2 focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-brand-ink motion-reduce:transition-none sm:text-2xl ${className}`}
    >
      ENGLISHFLOW
      <span aria-hidden="true">✳</span>
      <span className="sr-only">, back to home page</span>
    </Link>
  );
}
