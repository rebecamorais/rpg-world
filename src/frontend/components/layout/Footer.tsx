'use client';

/**
 * Copyright (c) 2026 Rebeca Morais Cruz (Rebs Tech Studio). Licenciado sob a GNU GPLv3.
 */
import { useState } from 'react';

import Link from 'next/link';

import { Check, Clipboard, Coffee, ExternalLink, QrCode } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { cn } from '@frontend/lib/utils';

const PIX_KEY = process.env.NEXT_PUBLIC_PIX_KEY || 'b22d409a-46a2-48dc-b2e2-eb3a66e9fb92';
const GITHUB_REPO = 'https://github.com/rebecamorais/rpg-world';

const GithubIcon = ({ className }: { className?: string }) => (
  <svg
    role="img"
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
      <footer className={cn('bg-black/20 px-6 py-4 backdrop-blur-xl', className)}>
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-[12px] text-zinc-500">{t('copyright', { year: currentYear })}</p>
          <div className="flex gap-4 text-[12px] text-zinc-400">
            <Link href="/terms" className="transition-colors hover:text-white">
              {t('legal.terms')}
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-white">
              {t('legal.privacy')}
            </Link>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer
      className={cn(
        'mt-auto border-t border-white/5 bg-[#08080a] pt-10 pb-6 transition-all',
        className,
      )}
    >
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {/* Brand Column */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white">Rebs Tech Studio</span>
            </div>
            <p className="max-w-[200px] text-[13px] leading-relaxed text-zinc-500">
              {tLanding('heroSubtitle')}
            </p>
            <div className="mt-1 text-[11px] font-medium text-zinc-600">
              {t('copyright', { year: currentYear })}
            </div>
          </div>

          {/* Explore Column */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-bold tracking-widest text-zinc-400 uppercase">
              {t('explore.title')}
            </h3>
            <ul className="flex flex-col gap-2">
              <li>
                <Link href="/" className="text-sm text-zinc-500 transition-colors hover:text-white">
                  {t('explore.home')}
                </Link>
              </li>
              <li>
                <Link
                  href="/characters"
                  className="text-sm text-zinc-500 transition-colors hover:text-white"
                >
                  {t('explore.characters')}
                </Link>
              </li>
              <li>
                <Link
                  href="/settings"
                  className="text-sm text-zinc-500 transition-colors hover:text-white"
                >
                  {t('explore.settings')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Social & Legal Column */}
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-bold tracking-widest text-zinc-400 uppercase">
                {t('socials.title')}
              </h3>
              <ul className="flex flex-col gap-2">
                <li>
                  <a
                    href={GITHUB_REPO}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-white"
                  >
                    <GithubIcon className="h-4 w-4" />
                    {t('socials.github')}
                  </a>
                </li>
              </ul>
            </div>
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-bold tracking-widest text-zinc-400 uppercase">
                {t('legal.title')}
              </h3>
              <ul className="flex flex-col gap-2">
                <li>
                  <Link
                    href="/terms"
                    className="text-sm text-zinc-500 transition-colors hover:text-white"
                  >
                    {t('legal.terms')}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/privacy"
                    className="text-sm text-zinc-500 transition-colors hover:text-white"
                  >
                    {t('legal.privacy')}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Support Column */}
          <div className="flex flex-col gap-4">
            <h3 className="text-xs font-bold tracking-widest text-zinc-400 uppercase">
              {t('support.title')}
            </h3>
            <div className="flex flex-col gap-3">
              <a
                href="https://ko-fi.com/rebecamorais"
                target="_blank"
                rel="noopener noreferrer"
                className="group glass-premium flex items-center justify-between rounded-lg p-3 transition-all hover:border-white/20 hover:bg-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF5E5B]/10 text-[#FF5E5B]">
                    <Coffee className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-semibold text-white">{t('support.kofi')}</span>
                </div>
                <ExternalLink className="h-3 w-3 text-zinc-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-zinc-400" />
              </a>

              <div className="flex flex-col gap-2 rounded-lg border border-white/5 bg-white/[0.02] p-3">
                <div className="flex items-center gap-3 text-sm font-semibold text-white">
                  <GithubIcon className="h-4 w-4" />
                  <span>{t('support.githubSponsors')}</span>
                </div>
                <div className="flex justify-start opacity-90 transition-opacity hover:opacity-100">
                  <iframe
                    src="https://github.com/sponsors/rebecamorais/button"
                    title="Sponsor rebecamorais"
                    height="32"
                    width="114"
                    style={{ border: 0, borderRadius: '6px' }}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 rounded-lg border border-white/5 bg-white/[0.02] p-3">
                <div className="flex items-center gap-3 text-sm font-semibold text-white">
                  <QrCode className="text-primary h-4 w-4" />
                  <span>{t('support.pixTitle')}</span>
                </div>
                <div className="flex items-center gap-2 overflow-hidden">
                  <code className="flex-1 truncate rounded bg-black/40 px-2 py-1 font-mono text-[10px] text-zinc-400">
                    {PIX_KEY}
                  </code>
                  <button
                    onClick={handleCopyPix}
                    className="bg-primary hover:bg-primary/80 flex h-7 w-7 items-center justify-center rounded text-white transition-colors"
                  >
                    {hasCopied ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Clipboard className="h-3.5 w-3.5" />
                    )}
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
