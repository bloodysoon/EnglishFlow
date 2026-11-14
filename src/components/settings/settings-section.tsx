import type { ReactNode } from "react";

// One settings card: title, one-line explanation, controls.
export function SettingsSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={`${id}-title`} className="border-[3px] border-line bg-surface p-5 shadow-brutal sm:p-7">
      <h2 id={`${id}-title`} className="text-xl font-black uppercase sm:text-2xl">
        {title}
      </h2>
      <p className="mt-1 font-semibold text-muted">{description}</p>
      <div className="mt-6 space-y-7">{children}</div>
    </section>
  );
}
