import { cn } from '@frontend/lib/utils';

/** A pulsing block that holds the place of content still loading. */
export function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('bg-muted animate-pulse rounded-md', className)} {...props} />;
}
