import type { ReactNode } from "react";

export function AdminCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className="border-[3px] border-line bg-surface p-5 shadow-brutal sm:p-7">
      <h2 className="text-xl font-black uppercase sm:text-2xl">{title}</h2>
      {description && <p className="mt-1 font-semibold text-muted">{description}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

// Inline result of a save: "Saved ✓" or an error, announced politely.
export function SaveStatus({ status }: { status: { kind: "saved" } | { kind: "error"; message: string } | null }) {
  if (status?.kind === "error") {
    return (
      <p role="alert" className="border-[3px] border-line bg-box-1 p-3 font-semibold text-on-box">
        {status.message}
      </p>
    );
  }
  return (
    <p role="status" className="text-sm font-black">
      {status?.kind === "saved" && "Saved ✓"}
    </p>
  );
}

export const ADMIN_ERRORS = {
  invalid_data: "Some values are not valid. Check the fields and try again.",
  forbidden: "Only the admin can do this. Try logging out and in again.",
  not_found: "That item no longer exists. Reload the page.",
  unexpected: "Something went wrong. Please try again.",
} as const;
