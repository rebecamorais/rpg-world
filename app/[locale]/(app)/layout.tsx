import type { ReactNode } from 'react';

import Footer from '@frontend/components/layout/Footer';
import GlobalHeader from '@frontend/components/layout/GlobalHeader';
import { PageFrame } from '@frontend/components/layout/PageFrame';

/** Signed-in and per-request pages: the header knows the session from the server. */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <PageFrame header={<GlobalHeader />} footer={<Footer />}>
      {children}
    </PageFrame>
  );
}
