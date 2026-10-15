/** Placeholder with the shape of a collapsed SpellCard, for the first load of a list. */
export function SpellCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="bg-card border-border relative flex items-center gap-4 overflow-hidden rounded-xl border p-4 pl-5 sm:p-5 sm:pl-6"
    >
      <span className="bg-muted absolute inset-y-0 left-0 w-1" />
      <div className="bg-muted size-12 shrink-0 animate-pulse rounded-lg" />
      <div className="flex flex-1 flex-col gap-2">
        <div className="bg-muted h-5 w-2/5 animate-pulse rounded-md" />
        <div className="bg-muted h-3.5 w-3/5 animate-pulse rounded-md" />
      </div>
      <div className="bg-muted size-10 shrink-0 animate-pulse rounded-lg" />
    </div>
  );
}
