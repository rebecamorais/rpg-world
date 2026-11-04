'use client';

import type { ComponentProps } from 'react';

import Link from 'next/link';

import { useDemo } from './DemoContext';
import { toDemoHref } from './href';

/** `next/link`, except that inside the demo it keeps the visitor in the demo. */
export default function AppLink({ href, ...props }: ComponentProps<typeof Link>) {
  const { isDemo } = useDemo();
  const target = isDemo && typeof href === 'string' ? toDemoHref(href) : href;
  return <Link href={target} {...props} />;
}
