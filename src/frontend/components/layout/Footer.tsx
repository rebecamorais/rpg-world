'use client';

/**
 * Copyright (c) 2026 Rebeca Morais Cruz (Rebs Tech Studio). Licenciado sob a GNU GPLv3.
 */
import { useState } from 'react';

import Link from 'next/link';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { AppIcon } from '@frontend/components/ui/icon';
import { cn } from '@frontend/lib/utils';

const PIX_KEY = process.env.NEXT_PUBLIC_PIX_KEY || 'b22d409a-46a2-48dc-b2e2-eb3a66e9fb92';
const GITHUB_REPO = 'https://github.com/rebecamorais/rpg-world';

const GithubIcon = ({ className }: { className?: string }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.43.372.823 1.102.823 2.222 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </svg>
);

interface FooterProps {
  className?: string;
  isMinified?: boolean;
}

export default function Footer({ className, isMinified = false }: FooterProps) {
  const t = useTranslations('footer');
  const tLanding = useTranslations('landing');
  const [hasCopied, setHasCopied] = useState(false);

  const handleCopyPix = () => {
    navigator.clipboard.writeText(PIX_KEY);
    setHasCopied(true);
    toast.success(t('support.pixCopy'));
    setTimeout(() => setHasCopied(false), 2000);
  };

  const currentYear = new Date().getFullYear();

  if (isMinified) {
    return (
      <footer className={cn('bg-background/40 px-6 py-4 backdrop-blur-xl', className)}>
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-muted-foreground text-xs">{t('copyright', { year: currentYear })}</p>
          <div className="text-muted-foreground flex gap-4 text-xs">
            <Link href="/terms" className="hover:text-foreground transition-colors">
              {t('legal.terms')}
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              {t('legal.privacy')}
            </Link>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className={cn('border-border bg-sidebar mt-auto border-t pt-16 pb-10', className)}>
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {/* Brand Column */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-foreground text-lg font-bold tracking-tight">
                Rebs Tech Studio
              </span>
            </div>
            <p className="text-muted-foreground max-w-[200px] text-sm leading-relaxed">
              {tLanding('heroSubtitle')}
            </p>
            <div className="text-muted-foreground mt-1 text-xs font-medium">
              {t('copyright', { year: currentYear })}
            </div>
          </div>

          {/* Explore Column */}
          <div className="flex flex-col gap-4">
            <h3 className="text-label text-muted-foreground">{t('explore.title')}</h3>
            <ul className="flex flex-col gap-2">
              <li>
                <Link
                  href="/"
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                >
                  {t('explore.home')}
                </Link>
              </li>
              <li>
                <Link
                  href="/characters"
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                >
                  {t('explore.characters')}
                </Link>
              </li>
              <li>
                <Link
                  href="/settings"
                  className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                >
                  {t('explore.settings')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Social & Legal Column */}
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <h3 className="text-label text-muted-foreground">{t('socials.title')}</h3>
              <ul className="flex flex-col gap-2">
                <li>
                  <a
                    href={GITHUB_REPO}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm transition-colors"
                  >
                    <GithubIcon className="h-4 w-4" />
                    {t('socials.github')}
                  </a>
                </li>
              </ul>
            </div>
            <div className="flex flex-col gap-4">
              <h3 className="text-label text-muted-foreground">{t('legal.title')}</h3>
              <ul className="flex flex-col gap-2">
                <li>
                  <Link
                    href="/terms"
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    {t('legal.terms')}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-muted-foreground hover:text-foreground text-sm transition-colors"
                  >
                    {t('legal.privacy')}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Support Column */}
          <div className="flex flex-col gap-4">
            <h3 className="text-label text-muted-foreground">{t('support.title')}</h3>
            <div className="flex flex-col gap-3">
              <a
                href="https://ko-fi.com/rebecamorais"
                target="_blank"
                rel="noopener noreferrer"
                className="group border-border bg-card/40 hover:border-muted-foreground/40 hover:bg-muted focus-ring flex items-center justify-between rounded-lg border p-3 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-kofi/10 text-kofi flex h-8 w-8 items-center justify-center rounded-full">
                    <AppIcon name="Coffee" size={16} />
                  </div>
                  <span className="text-foreground text-sm font-semibold">{t('support.kofi')}</span>
                </div>
                <AppIcon
                  name="ExternalLink"
                  size={12}
                  className="text-muted-foreground group-hover:text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </a>

              <div className="border-border bg-muted/40 flex flex-col gap-2 rounded-lg border p-3">
                <div className="text-foreground flex items-center gap-3 text-sm font-semibold">
                  <GithubIcon className="h-4 w-4" />
                  <span>{t('support.githubSponsors')}</span>
                </div>
                <div className="flex justify-start opacity-90 transition-opacity hover:opacity-100">
                  <iframe
                    src="https://github.com/sponsors/rebecamorais/button"
                    title="Sponsor rebecamorais"
                    height="32"
                    width="114"
                    className="rounded-md border-0"
                  />
                </div>
              </div>

              <div className="border-border bg-muted/40 flex flex-col gap-2 rounded-lg border p-3">
                <div className="text-foreground flex items-center gap-3 text-sm font-semibold">
                  <AppIcon name="QrCode" size={16} className="text-primary-flare" />
                  <span>{t('support.pixTitle')}</span>
                </div>
                <div className="flex items-center gap-2 overflow-hidden">
                  <code className="bg-background text-muted-foreground flex-1 truncate rounded px-2 py-1 font-mono text-xs">
                    {PIX_KEY}
                  </code>
                  <button
                    onClick={handleCopyPix}
                    aria-label={t('support.pixCopyLabel')}
                    className="bg-primary hover:bg-primary/80 text-primary-on flex h-7 w-7 items-center justify-center rounded transition-colors"
                  >
                    <AppIcon name={hasCopied ? 'Check' : 'Clipboard'} size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
