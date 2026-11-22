import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { buttonClasses } from "@/components/ui/button";

// The way back to the page above, at the right of a page's header (as on Review).
export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className={buttonClasses({ size: "toolbar", variant: "secondary", className: "shrink-0" })}>
      <ArrowLeft className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
      {label}
    </Link>
  );
}
