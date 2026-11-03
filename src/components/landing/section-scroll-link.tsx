type SectionScrollLinkProps = {
  href: string;
  label: string;
  direction?: "up" | "down";
  variant?: "green" | "cream" | "purple";
};

const backgroundClasses = {
  green: "bg-brand-green text-brand-ink",
  cream: "bg-brand-cream text-brand-ink",
  purple: "bg-brand-purple text-white",
};

export function SectionScrollLink({
  href,
  label,
  direction = "down",
  variant = "green",
}: SectionScrollLinkProps) {
  return (
    <a
      href={href}
      aria-label={label}
      className="
        group absolute bottom-8 left-1/2 z-20
        flex -translate-x-1/2 flex-col items-center gap-2
        whitespace-nowrap text-xs font-black uppercase
        tracking-widest
        transition-transform duration-200
        hover:scale-105
        focus-visible:outline-2
        focus-visible:outline-offset-4
        focus-visible:outline-current
        sm:bottom-10
        motion-reduce:transition-none
      "
    >
      <span>{label}</span>

      <span
        aria-hidden="true"
        className={`
          flex h-10 w-10 items-center justify-center
          rounded-full border-[3px] border-brand-ink
          text-xl
          shadow-[3px_3px_0_#171717]
          transition-transform duration-200
          group-hover:scale-110
          motion-safe:animate-bounce
          motion-reduce:transition-none
          ${backgroundClasses[variant]}
        `}
      >
        {direction === "down" ? "↓" : "↑"}
      </span>
    </a>
  );
}
