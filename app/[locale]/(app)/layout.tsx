import type { ReactNode } from 'react';

import Footer from '@frontend/components/layout/Footer';
import GlobalHeader from '@frontend/components/layout/GlobalHeader';
import { PageFrame } from '@frontend/components/layout/PageFrame';

/**
 * Signed-in and per-request pages: the header knows the session from the server. Each section
 * below places its own main landmark (`MainContent`): the dashboard beside its sidebar, the other
 * pages (auth, change-password, choose-username, reset-password) in their layout.tsx. A new
 * section here needs one too.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <PageFrame
      header={<GlobalHeader session="server" />}
      footer={<Footer session="server" />}
      ownMain
    >
      {children}
    </PageFrame>
  );
}
