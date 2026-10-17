'use client';

/**
 * Copyright (c) 2026 Rebeca Morais Cruz (Rebs Tech Studio). Licenciado sob a GNU GPLv3.
 */
import { useState } from 'react';

import Link from 'next/link';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@frontend/components/ui/button';
import { AppIcon } from '@frontend/components/ui/icon';
import { DISCORD_INVITE, GITHUB_REPO } from '@frontend/constants/site';

const PIX_KEY = process.env.NEXT_PUBLIC_PIX_KEY || 'b22d409a-46a2-48dc-b2e2-eb3a66e9fb92';

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

const GITHUB_SPONSORS = 'https://github.com/sponsors/rebecamorais';

const DiscordIcon = ({ className }: { className?: string }) => (
  <svg
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
  </svg>
);

const linkClass =
  'text-muted-foreground hover:text-foreground focus-ring rounded-sm text-sm transition-colors';
const cardClass =
  'group border-border bg-card/40 hover:border-muted-foreground/40 hover:bg-muted focus-ring flex items-center justify-between gap-3 rounded-lg border p-3 transition-colors';

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-label text-muted-foreground">{title}</h2>
      <ul className="flex flex-col gap-2">{children}</ul>
    </div>
  );
}

/** Site footer. Links follow the session; on phones it packs into two columns. */
export default function FooterContent({ isAuthenticated }: { isAuthenticated: boolean }) {
  const t = useTranslations('footer');
  const tLanding = useTranslations('landing');
  const [hasCopied, setHasCopied] = useState(false);

  const handleCopyPix = () => {
    navigator.clipboard.writeText(PIX_KEY);
    setHasCopied(true);
    toast.success(t('support.pixCopy'));
    setTimeout(() => setHasCopied(false), 2000);
  };

  const explore = isAuthenticated
    ? [
        { href: '/characters', label: t('explore.characters') },
        { href: '/settings/profile', label: t('explore.settings') },
        { href: '/features', label: t('explore.features') },
      ]
    : [
        { href: '/', label: t('explore.home') },
        { href: '/features', label: t('explore.features') },
        { href: '/login', label: t('explore.login') },
        { href: '/register', label: t('explore.register') },
      ];

  return (
    <footer className="border-border bg-sidebar mt-auto border-t pt-10 pb-8 sm:pt-16 sm:pb-10">
      <div className="container mx-auto grid grid-cols-2 gap-x-6 gap-y-8 px-6 lg:grid-cols-4">
        <div className="col-span-2 flex flex-col gap-2 lg:col-span-1">
          <span className="text-foreground text-lg font-bold tracking-tight">Rebs Tech Studio</span>
          <p className="text-muted-foreground max-w-xs text-sm leading-relaxed">
            {tLanding('heroSubtitle')}
          </p>
          <p className="text-muted-foreground text-xs">
            {t('copyright', { year: new Date().getFullYear() })}
          </p>
        </div>

        <FooterColumn title={t('explore.title')}>
          {explore.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className={linkClass}>
                {link.label}
              </Link>
            </li>
          ))}
        </FooterColumn>

        <FooterColumn title={t('legal.title')}>
          <li>
            <Link href="/terms" className={linkClass}>
              {t('legal.terms')}
            </Link>
          </li>
          <li>
            <Link href="/privacy" className={linkClass}>
              {t('legal.privacy')}
            </Link>
          </li>
          <li>
            <a
              href={GITHUB_REPO}
              target="_blank"
              rel="noopener noreferrer"
              className={`${linkClass} inline-flex items-center gap-2`}
            >
              <GithubIcon className="h-4 w-4" />
              {t('socials.github')}
            </a>
          </li>
          <li>
            <a
              href={DISCORD_INVITE}
              target="_blank"
              rel="noopener noreferrer"
              className={`${linkClass} inline-flex items-center gap-2`}
            >
              <DiscordIcon className="text-discord h-4 w-4" />
              {t('socials.discord')}
            </a>
          </li>
        </FooterColumn>

        <div className="col-span-2 flex flex-col gap-3 lg:col-span-1">
          <h2 className="text-label text-muted-foreground">{t('support.title')}</h2>
          <a
            href="https://ko-fi.com/rebecamorais"
            target="_blank"
            rel="noopener noreferrer"
            className={cardClass}
          >
            <span className="flex items-center gap-3">
              <span className="bg-kofi/10 text-kofi flex h-8 w-8 items-center justify-center rounded-full">
                <AppIcon name="Coffee" size={16} />
              </span>
              <span className="text-foreground text-sm font-semibold">{t('support.kofi')}</span>
            </span>
            <AppIcon name="ExternalLink" size={12} className="text-muted-foreground" />
          </a>

          {/* A plain link instead of GitHub's iframe button, which blockers and CSP often hide */}
          <a href={GITHUB_SPONSORS} target="_blank" rel="noopener noreferrer" className={cardClass}>
            <span className="flex items-center gap-3">
              <span className="bg-muted text-foreground flex h-8 w-8 items-center justify-center rounded-full">
                <GithubIcon className="h-4 w-4" />
              </span>
              <span className="text-foreground text-sm font-semibold">
                {t('support.githubSponsorsCta')}
              </span>
            </span>
            <AppIcon name="ExternalLink" size={12} className="text-muted-foreground" />
          </a>

          <div className="border-border bg-card/40 flex flex-col gap-2 rounded-lg border p-3">
            <div className="text-foreground flex items-center gap-3 text-sm font-semibold">
              <AppIcon name="QrCode" size={16} className="text-primary-flare" />
              <span>{t('support.pixTitle')}</span>
            </div>
            <div className="flex items-center gap-2 overflow-hidden">
              <code className="bg-background text-muted-foreground flex-1 truncate rounded px-2 py-1 font-mono text-xs">
                {PIX_KEY}
              </code>
              <Button
                size="icon"
                onClick={handleCopyPix}
                aria-label={t('support.pixCopyLabel')}
                className="h-8 w-8"
              >
                <AppIcon name={hasCopied ? 'Check' : 'Clipboard'} size={14} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
