import type { ReactNode } from 'react';

import { cn } from '@frontend/lib/utils';

/** The page's only main landmark, where "Skip to content" (root layout) lands. */
export function MainContent({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <main id="main-content" tabIndex={-1} className={cn('outline-none', className)}>
      {children}
    </main>
  );
}

/**
 * Header, content and footer: shared by the (public) and (app) layouts. The content is the main
 * landmark, unless `ownMain`: then the layouts below place it themselves, as the dashboard does to
 * keep its sidebar out of it.
 */
export function PageFrame({
  header,
  footer,
  ownMain = false,
  children,
}: {
  header: ReactNode;
  footer: ReactNode;
  ownMain?: boolean;
  children: ReactNode;
}) {
  const frame = 'flex min-h-[calc(100vh-var(--header-height)+20px)] flex-1 flex-col';
  return (
    <>
      {header}
      {ownMain ? (
        <div className={frame}>{children}</div>
      ) : (
        <MainContent className={frame}>{children}</MainContent>
      )}
      {footer}
    </>
  );
}
