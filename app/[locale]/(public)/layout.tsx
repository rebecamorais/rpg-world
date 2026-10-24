import type { ReactNode } from 'react';

import type { LocaleParams } from '@/i18n/routing';
import { setRequestLocale } from 'next-intl/server';

import Footer from '@frontend/components/layout/Footer';
import GlobalHeader from '@frontend/components/layout/GlobalHeader';
import { PageFrame } from '@frontend/components/layout/PageFrame';

/** Public pages: prebuilt per language, so nothing here may read the request. */
export default async function PublicLayout({
  children,
  params,
}: LocaleParams & { children: ReactNode }) {
  setRequestLocale((await params).locale);
  return (
    <PageFrame header={<GlobalHeader session="client" />} footer={<Footer session="client" />}>
      {children}
    </PageFrame>
  );
}
