import type { ReactNode } from 'react';

import Footer from '@frontend/components/layout/Footer';
import GlobalHeader from '@frontend/components/layout/GlobalHeader';
import { PageFrame } from '@frontend/components/layout/PageFrame';

/** Public pages: prebuilt per language, so nothing here may read the request. */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <PageFrame header={<GlobalHeader />} footer={<Footer />}>
      {children}
    </PageFrame>
  );
}
