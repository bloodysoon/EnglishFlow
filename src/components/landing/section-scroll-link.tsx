import type { ReactNode } from "react";

type SectionScrollLinkProps = {
  href: string;
  label: ReactNode;
  direction?: "up" | "down";
  className?: string;
};

// The "go to the next screen" button that closes every landing section.
// It stays at the end of its section: a sticky arrow on phones sat on top of
// the demos it was meant to lead to.
export function SectionScrollLink({
  href,
  label,
  direction = "down",
  className = "",
}: SectionScrollLinkProps) {
  return (
    <a
      href={href}
      className={`group mx-auto flex w-fit flex-col items-center gap-2 text-center text-xs font-black tracking-widest uppercase ${className}`}
    >
      <span
        className={`relative after:absolute after:-bottom-1 after:left-0 after:h-[3px] after:w-full after:origin-left after:scale-x-0 after:bg-mark after:transition-transform after:duration-300 group-hover:after:scale-x-100 motion-reduce:after:transition-none`}
      >
        {label}
      </span>

      <span
        aria-hidden="true"
        className="
          flex h-12 w-12 items-center justify-center rounded-full
          border-[3px] border-line bg-raised text-xl text-fg shadow-brutal-sm
          transition-[transform,background-color,box-shadow] duration-200
          group-hover:-translate-y-0.5 group-hover:bg-box-2 group-hover:text-on-box group-hover:shadow-brutal-md
          group-active:translate-y-0.5 group-active:shadow-none
          motion-reduce:transition-none
        "
      >
        <span
          className={
            direction === "down"
              ? "scroll-nudge inline-block"
              : "scroll-nudge-up inline-block"
          }
        >
          {direction === "down" ? "↓" : "↑"}
        </span>
      </span>
    </a>
  );
}
