import type { ReactNode } from 'react';

import type { Metadata } from 'next';

import { type LocaleParams } from '@/i18n/routing';
import { setRequestLocale } from 'next-intl/server';

import { UserProvider } from '@frontend/context/UserContext';
import { DemoProvider } from '@frontend/demo/DemoContext';
import { DemoFrame } from '@frontend/demo/DemoFrame';
import { buildDemoData, resolveDemoSpells } from '@frontend/demo/data/build';
import { DEMO_USER } from '@frontend/demo/ids';
import type { DemoLocale } from '@frontend/demo/types';

// A showcase, not content to rank: the sheets are fiction and the page is the same for everyone
export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Public and read only: no session, no database. The whole campaign comes from `buildDemoData`. */
export default async function DemoLayout({
  children,
  params,
}: LocaleParams & { children: ReactNode }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const lang: DemoLocale = locale === 'pt' ? 'pt' : 'en';

  const data = buildDemoData(lang);
  data.spells = await resolveDemoSpells(data, lang);

  return (
    <DemoProvider data={data}>
      <UserProvider user={DEMO_USER}>
        <DemoFrame>{children}</DemoFrame>
      </UserProvider>
    </DemoProvider>
  );
}
