import { Skeleton } from "@/components/ui/skeleton";
import { getPlatformI18n } from "@/features/i18n/platform";

// Shown for every platform page while it streams in; the sidebar stays
// usable. The outline matches most pages: title, a row of cards, a panel.
export default async function PlatformLoading() {
  const { t } = await getPlatformI18n();

  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{t.common.loading}</span>
      <div className="top-loader" aria-hidden="true" />

      <div className="loading-in space-y-8" aria-hidden="true">
        <Skeleton line className="h-10 w-52 sm:h-12 sm:w-72" />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 p-5" />
          ))}
        </div>

        <div className="skeleton space-y-4 p-6">
          <Skeleton line className="h-5 w-40" />
          <Skeleton line className="h-4 w-full max-w-xl" />
          <Skeleton line className="h-4 w-3/4 max-w-md" />
          <Skeleton line className="mt-6 h-32 w-full" />
        </div>
      </div>
    </div>
  );
}
