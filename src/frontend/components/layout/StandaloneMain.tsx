import type { ReactNode } from 'react';

import { MainContent } from '@frontend/components/layout/PageFrame';

/**
 * Layout of an (app) page without the dashboard (auth, change-password, choose-username,
 * reset-password): the whole content is the main landmark, as on the public pages.
 */
export default function StandaloneMain({ children }: { children: ReactNode }) {
  return <MainContent className="flex flex-1 flex-col">{children}</MainContent>;
}
