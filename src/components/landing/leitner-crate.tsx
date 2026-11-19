import type { CSSProperties, ReactNode } from "react";

import { leitnerBoxStyles } from "@/components/landing/leitner-box-styles";

type LeitnerCrateProps = {
  box: number;
  // Flaps open when still (also the reduced-motion state).
  open?: boolean;
  // Flaps open and shut on the 8s hop cycle; `style` carries its delay.
  hop?: boolean;
  style?: CSSProperties;
  // What sits in the box, its lower part hidden by the front face.
  inside?: ReactNode;
  // Front-face classes.
  className?: string;
  children: ReactNode;
};

const face = "absolute border-[3px] border-line";
const flap = "crate-flap border-[3px] border-line";

// A Leitner box as a 3D cardboard box (geometry in globals.css, `.crate`).
export function LeitnerCrate({ box, open, hop, style, inside, className = "", children }: LeitnerCrateProps) {
  const tone = leitnerBoxStyles[box];
  // Inner and side walls sit in shadow.
  const shade = <span className="absolute inset-0 bg-line/25" />;

  return (
    <div className="crate pt-14 sm:pt-16">
      <div
        className={`crate-scene ${open ? "crate-open" : ""} ${hop ? "crate-hop" : ""}`}
        style={style}
      >
        <div aria-hidden="true" className={`crate-back inset-0 bg-line ${face}`} />
        <div aria-hidden="true" className={`crate-bottom inset-x-0 bg-line ${face}`} />
        <div aria-hidden="true" className={`crate-left inset-y-0 ${face} ${tone}`}>{shade}</div>
        <div aria-hidden="true" className={`crate-right inset-y-0 ${face} ${tone}`}>{shade}</div>
        {inside}
        <div aria-hidden="true" className={`crate-flap-back inset-x-0 ${flap} ${tone}`}>{shade}</div>
        <div aria-hidden="true" className={`crate-flap-left left-0 w-(--d) ${flap} ${tone}`}>{shade}</div>
        <div aria-hidden="true" className={`crate-flap-right right-0 w-(--d) ${flap} ${tone}`}>{shade}</div>
        <div aria-hidden="true" className={`crate-flap-front inset-x-0 ${flap} ${tone}`} />
        <div className={`crate-front relative flex min-w-0 border-[3px] border-line ${tone} ${className}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
