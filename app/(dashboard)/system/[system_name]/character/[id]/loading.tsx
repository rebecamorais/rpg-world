import { Skeleton } from '@frontend/components/ui/skeleton';

export default function CharacterLoading() {
  return (
    <div className="mx-auto max-w-5xl p-4">
      {/* Top bar: back + actions */}
      <div className="mb-4 flex items-center justify-between">
        <Skeleton className="h-4 w-20" />
        <div className="flex gap-3">
          <Skeleton className="h-9 w-32 rounded" />
          <Skeleton className="h-9 w-16 rounded" />
        </div>
      </div>

      {/* Character Header */}
      <div className="mb-6 space-y-2">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-16" />
        </div>
      </div>

      {/* Combat Stats Row */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="border-border bg-card flex flex-col items-center gap-2 rounded-lg border py-4"
          >
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Main 3-Column Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {/* Col 1: Attributes */}
        <div className="space-y-3 md:col-span-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="border-border bg-card flex flex-col items-center gap-1 rounded-lg border py-3"
            >
              <Skeleton className="h-3 w-10" />
              <Skeleton className="h-8 w-12" />
              <Skeleton className="h-3 w-8" />
            </div>
          ))}
        </div>

        {/* Col 2: Saves + Skills */}
        <div className="space-y-4 md:col-span-4">
          <Skeleton className="h-10 w-full rounded-lg" />
          <div className="border-border bg-card space-y-2 rounded-lg border p-4">
            <Skeleton className="h-4 w-32" />
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
          <div className="border-border bg-card space-y-2 rounded-lg border p-4">
            <Skeleton className="h-4 w-24" />
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </div>
        </div>

        {/* Col 3: Magic */}
        <div className="space-y-4 md:col-span-4">
          <div className="border-border bg-card space-y-3 rounded-lg border p-4">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
