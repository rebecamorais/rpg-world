'use client';

import type { ComponentProps } from 'react';

import Link from 'next/link';

import { localizedHref } from '@/i18n/routing';
import { useLocale } from 'next-intl';

import { useDemo } from './DemoContext';
import { toDemoHref } from './href';

/**
 * `next/link`, except that inside the demo it keeps the visitor in the demo. A public page it
 * leads to (sign up) gets the address of the visitor's language.
 */
export default function AppLink({ href, ...props }: ComponentProps<typeof Link>) {
  const { isDemo } = useDemo();
  const locale = useLocale();
  const target =
    typeof href === 'string' ? localizedHref(isDemo ? toDemoHref(href) : href, locale) : href;
  return <Link href={target} {...props} />;
}
