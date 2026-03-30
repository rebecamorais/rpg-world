'use client';

import Link from 'next/link';

import { useTranslations } from 'next-intl';

import { cn } from '@frontend/lib/utils';

interface FooterProps {
  className?: string;
  isMinified?: boolean;
}

export default function Footer({ className, isMinified = false }: FooterProps) {
  const t = useTranslations();

  if (isMinified) {
    return (
      <div className={cn('flex flex-col gap-1 px-3 py-3 text-[10px] text-zinc-400', className)}>
        <p className="leading-tight opacity-90">
          {t.rich('common.footerMessage', {
            link: (chunks) => (
              <a
                href="https://github.com/rebecamorais/rpg-world"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-zinc-200"
              >
                {chunks}
              </a>
            ),
          })}
        </p>
        <div className="flex flex-wrap gap-x-2 gap-y-0.5 opacity-60">
          <Link href="/terms" className="hover:underline">
            {t('terms.title')}
          </Link>
          <span className="opacity-40">•</span>
          <Link href="/privacy" className="hover:underline">
            {t('privacy.title')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <footer className={cn('text-muted-foreground border-t py-6 text-center text-sm', className)}>
      <div className="container mx-auto px-4">
        <p>
          {t.rich('common.footerMessage', {
            link: (chunks) => (
              <a
                href="https://github.com/rebecamorais/rpg-world"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline underline-offset-4"
              >
                {chunks}
              </a>
            ),
          })}
        </p>
        <p className="mt-2">
          <Link href="/terms" className="hover:underline">
            {t('terms.title')}
          </Link>
          {' • '}
          <Link href="/privacy" className="hover:underline">
            {t('privacy.title')}
          </Link>
        </p>
      </div>
    </footer>
  );
}
