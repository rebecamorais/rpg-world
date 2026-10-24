import type { ReactNode } from 'react';

/** Header, the page's only main landmark, and footer: shared by the (public) and (app) layouts. */
export function PageFrame({
  header,
  footer,
  children,
}: {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      {header}
      {/* Pages and layouts below use plain divs */}
      <main
        id="main-content"
        tabIndex={-1}
        className="flex min-h-[calc(100vh-var(--header-height)+20px)] flex-1 flex-col outline-none"
      >
        {children}
      </main>
      {footer}
    </>
  );
}
