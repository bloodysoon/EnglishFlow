import type { Medal } from "@/features/rewards/levels";

// Full class names so Tailwind sees them; colours are tokens (globals.css).
export const medalStyles: Record<Medal, string> = {
  bronze: "bg-medal-bronze text-on-box",
  silver: "bg-medal-silver text-on-box",
  gold: "bg-medal-gold text-on-box",
  platinum: "bg-medal-platinum text-on-box",
  diamond: "bg-medal-diamond text-on-box",
};

// Avatar frames: a thick medal-coloured ring.
export const frameStyles: Record<Medal, string> = {
  bronze: "outline-medal-bronze",
  silver: "outline-medal-silver",
  gold: "outline-medal-gold",
  platinum: "outline-medal-platinum",
  diamond: "outline-medal-diamond",
};
