import type { Metadata } from 'next';

import { getTranslations } from 'next-intl/server';

import { NotFoundState } from '@frontend/components/shared/NotFoundState';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('notFound');
  return { title: t('title') };
}

/**
 * The 404 of a demo page (`notFound()` for a sheet the demo doesn't have), inside the demo's frame
 * and its navigation. Without it, the 404 fell past the demo to Next's built-in page. The way back
 * is the demo's start, not the site's home page.
 */
export default function DemoNotFound() {
  return <NotFoundState signedIn={false} demo />;
}
