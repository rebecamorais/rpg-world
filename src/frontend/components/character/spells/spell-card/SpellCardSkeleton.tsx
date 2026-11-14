import { Skeleton } from '@frontend/components/ui/skeleton';

/** Placeholder with the shape of a collapsed SpellCard, for the first load of a list. */
export function SpellCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="bg-card border-border relative flex items-center gap-4 overflow-hidden rounded-xl border p-4 pl-5 sm:p-5 sm:pl-6"
    >
      <span className="bg-muted absolute inset-y-0 left-0 w-1" />
      <Skeleton className="size-12 shrink-0 rounded-lg" />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-5 w-2/5" />
        <Skeleton className="h-3.5 w-3/5" />
      </div>
      <Skeleton className="size-10 shrink-0 rounded-lg" />
    </div>
  );
}
