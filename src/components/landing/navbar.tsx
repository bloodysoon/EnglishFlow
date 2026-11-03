"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ActiveSection = "hero" | "how-it-works" | "join-us";

type NavbarProps = {
  isAuthenticated: boolean;
  email: string;
};

export function Navbar({ isAuthenticated, email }: NavbarProps) {
  const [activeSection, setActiveSection] = useState<ActiveSection>("hero");

  useEffect(() => {
    const updateActiveSection = () => {
      const navbarHeight =
        document.querySelector("header")?.getBoundingClientRect().height ?? 80;

      const checkpoint = navbarHeight + 20;

      const howItWorks = document.getElementById("how-it-works");
      const joinUs = document.getElementById("join-us");

      if (joinUs && joinUs.getBoundingClientRect().top <= checkpoint) {
        setActiveSection("join-us");
      } else if (
        howItWorks &&
        howItWorks.getBoundingClientRect().top <= checkpoint
      ) {
        setActiveSection("how-it-works");
      } else {
        setActiveSection("hero");
      }
    };

    updateActiveSection();

    window.addEventListener("scroll", updateActiveSection, {
      passive: true,
    });
    window.addEventListener("resize", updateActiveSection);

    return () => {
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("resize", updateActiveSection);
    };
  }, []);

  const backgroundClass =
    activeSection === "how-it-works" ? "bg-brand-orange" : "bg-brand-cream";

  const initial = email.charAt(0).toUpperCase() || "U";

  return (
    <header
      className={`
        sticky top-0 z-50 w-full shrink-0
        border-b-[3px] border-brand-ink
        text-brand-ink
        transition-colors duration-500 ease-in-out
        motion-reduce:transition-none
        ${backgroundClass}
      `}
    >
      <nav className="relative flex w-full items-center justify-between gap-3 px-4 py-5 sm:px-8 lg:px-10 xl:px-14">
        <Link
          href="/"
          className="
            inline-flex items-center
            text-xl font-black tracking-tighter
            transition-transform duration-200
            hover:-rotate-2
            focus-visible:outline-4
            focus-visible:outline-offset-4
            focus-visible:outline-brand-purple
            sm:text-2xl
            motion-reduce:transition-none
          "
        >
          ENGLISHFLOW
          <span className="text-brand-purple">✳</span>
        </Link>

        <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex">
          <a
            href="#how-it-works"
            className="
              text-sm font-black uppercase
              transition-colors duration-150
              hover:text-brand-purple
              focus-visible:outline-2
              focus-visible:outline-offset-4
              focus-visible:outline-brand-purple
            "
          >
            How it works
          </a>

          <a
            href="#join-us"
            className="
              text-sm font-black uppercase
              transition-colors duration-150
              hover:text-brand-purple
              focus-visible:outline-2
              focus-visible:outline-offset-4
              focus-visible:outline-brand-purple
            "
          >
            {isAuthenticated ? "Keep learning" : "Join us"}
          </a>
        </div>

        <div className="flex items-center gap-3">
          {isAuthenticated && (
            <Link
              href="/dashboard"
              title={email}
              aria-label={`Open dashboard for ${email || "your account"}`}
              className="
                flex h-10 w-10 items-center justify-center
                border-[3px] border-brand-ink
                bg-brand-green text-sm font-black
                shadow-[3px_3px_0_#171717]
                transition-transform duration-150
                hover:-translate-y-1
                motion-reduce:transition-none
              "
            >
              {initial}
            </Link>
          )}

          <Link
            href={isAuthenticated ? "/dashboard" : "/login"}
            className="
              inline-flex items-center justify-center
              border-[3px] border-brand-ink
              bg-brand-purple px-5 py-2
              text-sm font-black uppercase text-white
              shadow-[4px_4px_0_#171717]
              transition-[transform,box-shadow,background-color] duration-150
              hover:-translate-y-1
              hover:bg-brand-pink
              hover:shadow-[6px_6px_0_#171717]
              active:translate-x-1 active:translate-y-1
              active:shadow-none
              focus-visible:outline-4
              focus-visible:outline-offset-4
              focus-visible:outline-brand-purple
              sm:px-6
              motion-reduce:transition-none
            "
          >
            {isAuthenticated ? "Dashboard" : "Log in"}
          </Link>
        </div>
      </nav>
    </header>
  );
}
