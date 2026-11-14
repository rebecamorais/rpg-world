import { Skeleton } from '@frontend/components/ui/skeleton';
import type { InventoryView } from '@frontend/hooks/useInventoryView';

/** Placeholder with the shape of the backpack's list or grid, while its items load. */
export function ItemListSkeleton({ view, label }: { view: InventoryView; label: string }) {
  return (
    <div aria-busy="true">
      <span role="status" className="sr-only">
        {label}
      </span>
      {view === 'grid' ? (
        <div
          aria-hidden="true"
          className="grid grid-cols-4 gap-2 p-4 sm:grid-cols-6 lg:grid-cols-8"
        >
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      ) : (
        <div aria-hidden="true">
          <div className="border-border bg-muted/40 border-b px-4 py-2">
            <Skeleton className="h-3.5 w-24" />
          </div>
          <ul>
            {Array.from({ length: 4 }, (_, i) => (
              <li
                key={i}
                className="border-border flex items-center gap-3 border-b px-4 py-2 last:border-b-0"
              >
                <Skeleton className="size-8 shrink-0" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-8 w-24 shrink-0" />
                <Skeleton className="hidden h-4 w-16 shrink-0 sm:block" />
                <Skeleton className="h-4 w-20 shrink-0" />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
