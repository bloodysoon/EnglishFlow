import Link from "next/link";

type LogoLinkProps = {
  href?: string;
  // Accessible name, e.g. "Elevo home" / "Elevo — на главную".
  label?: string;
  className?: string;
};

// Brand wordmark that links home. Gives pages without the landing navbar
// (login, register) a visible way back to the start page.
export function LogoLink({ href = "/", label = "Elevo home", className = "" }: LogoLinkProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={`group font-display inline-flex min-h-11 items-center px-1 text-xl font-black tracking-tight text-fg sm:text-2xl ${className}`}
    >
      {/* lang="en": the wordmark keeps its Latin font on every page. */}
      <span lang="en">ELEVO</span>
      <span
        aria-hidden="true"
        className="inline-block text-primary transition-transform duration-500 ease-out group-hover:rotate-180 motion-reduce:transition-none"
      >
        ✳
      </span>
    </Link>
  );
}
