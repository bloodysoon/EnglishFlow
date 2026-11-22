import type { ComponentProps } from "react";

// primary: the one main action on a screen. secondary: everything else.
// Both follow the theme tokens (globals.css).
type ButtonVariant = "primary" | "secondary";
type ButtonSize = "toolbar" | "compact" | "sm" | "md" | "lg";

const base =
  "lift-safe font-display inline-flex cursor-pointer items-center justify-center border-[3px] border-line font-black uppercase " +
  "transition-[transform,box-shadow,background-color] duration-150 motion-reduce:transition-none " +
  "interactive:hover:-translate-y-1 " +
  "interactive:active:translate-x-1 interactive:active:translate-y-1 interactive:active:shadow-none " +
  // Prefer aria-disabled for temporarily blocked submits: unlike `disabled`
  // it keeps keyboard focus on the button. The submit handler must guard.
  "disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-primary text-on-primary",
  secondary: "bg-raised text-fg interactive:hover:bg-box-2 interactive:hover:text-on-box",
};

// Pick padding through `size`, not `className`: a px-* passed in className
// does not reliably override the one here (Tailwind orders by CSS, not by
// class string), so tight spots like the mobile navbar use `sm`.
const sizes: Record<ButtonSize, string> = {
  // Rows of icon buttons that must fit one line on a 320px phone.
  toolbar: "min-h-11 min-w-11 gap-1.5 px-2 py-2.5 text-sm shadow-brutal-md interactive:hover:shadow-brutal sm:gap-3 sm:px-6 sm:py-3",
  // Page-title rows: as tall as the title beside it (text-2xl, sm:text-4xl), so all fits one line on a phone.
  compact: "h-8 min-w-8 gap-1 px-1.5 text-xs shadow-brutal-sm interactive:hover:shadow-brutal-md sm:h-10 sm:min-w-10 sm:gap-2 sm:px-3 sm:text-sm sm:shadow-brutal-md",
  sm: "gap-3 px-4 py-3 text-sm shadow-brutal-md interactive:hover:shadow-brutal sm:px-6",
  md: "gap-3 px-6 py-3 text-sm shadow-brutal-md interactive:hover:shadow-brutal",
  lg: "gap-3 px-5 py-4 text-sm shadow-brutal interactive:hover:shadow-brutal-lg sm:px-7 sm:text-base",
};

// Class string for anything that should look like a button. Use it on
// <Link> for navigation and via <Button> for actions, so both stay identical.
export function buttonClasses({
  variant = "primary",
  size = "md",
  className = "",
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return `${base} ${variants[variant]} ${sizes[size]} ${className}`.trim();
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({ variant, size, className, type = "button", ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses({ variant, size, className })} {...props} />;
}
