import type { ComponentProps } from "react";

type ButtonVariant = "primary" | "secondary";
type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex cursor-pointer items-center justify-center gap-3 border-[3px] border-brand-ink font-black uppercase " +
  "transition-[transform,box-shadow,background-color] duration-150 motion-reduce:transition-none " +
  "not-disabled:hover:-translate-y-1 " +
  "not-disabled:active:translate-x-1 not-disabled:active:translate-y-1 not-disabled:active:shadow-none " +
  "disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-brand-purple text-white",
  secondary: "bg-brand-green text-brand-ink not-disabled:hover:bg-brand-cream",
};

// Pick padding through `size`, not `className`: a px-* passed in className
// does not reliably override the one here (Tailwind orders by CSS, not by
// class string), so tight spots like the mobile navbar use `sm`.
const sizes: Record<ButtonSize, string> = {
  sm: "px-4 py-3 text-sm shadow-brutal-md not-disabled:hover:shadow-brutal sm:px-6",
  md: "px-6 py-3 text-sm shadow-brutal-md not-disabled:hover:shadow-brutal",
  lg: "px-7 py-4 text-base shadow-brutal not-disabled:hover:shadow-brutal-lg",
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

export function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClasses({ variant, size, className })}
      {...props}
    />
  );
}
