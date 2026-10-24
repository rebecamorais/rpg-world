'use client';

import { useEffect } from 'react';

import Link from 'next/link';

import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import LanguageSwitcher from '@frontend/components/LanguageSwitcher';
import { HeaderSupportLink } from '@frontend/components/layout/HeaderSupportLink';
import { MobileMenu } from '@frontend/components/layout/Sidebar';
import UserMenu from '@frontend/components/layout/UserMenu';
import { Button } from '@frontend/components/ui/button';
import { AppIcon } from '@frontend/components/ui/icon';
import { useSession } from '@frontend/hooks/useSession';
import { SESSION_QUERY_KEY } from '@frontend/lib/query-keys';

import type { User } from '@shared/types/user';

/** The session the server already read; left out on prebuilt pages, where the browser finds it. */
type KnownSession = { serverUser?: User | null };

/** The phone menu, only for whoever is signed in. */
export function HeaderSessionMobileMenu({ serverUser }: KnownSession) {
  const { status } = useSession(serverUser);
  return status === 'signed-in' ? <MobileMenu /> : null;
}

/**
 * The header's right side: sign in/register, or back + user menu, then support and language. While a session cookie is being checked it shows a same-size placeholder, never
 * the signed-out buttons.
 */
export function HeaderSessionActions({ serverUser }: KnownSession) {
  const tLogin = useTranslations('login');
  const tRegister = useTranslations('register');
  const tCommon = useTranslations('common');
  const { user, status } = useSession(serverUser);

  const queryClient = useQueryClient();

  // The inline script in the root layout hid the signed-out buttons until this is known. On the
  // hydration commit status is still the server's 'signed-out', so this runs once early; the
  // cookie check re-renders to 'loading' (placeholder) in the same tick, before anything paints.
  useEffect(() => {
    if (status !== 'loading') delete document.documentElement.dataset.session;
  }, [status]);

  // Signed-in pages hand their session to the public ones the visitor goes to next
  useEffect(() => {
    if (serverUser !== undefined) queryClient.setQueryData(SESSION_QUERY_KEY, serverUser);
  }, [queryClient, serverUser]);

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      {status === 'loading' ? (
        <div className="h-9 w-24 sm:w-44" aria-hidden="true" />
      ) : status === 'signed-out' ? (
        <div data-signed-out className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            asChild
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            <Link href="/login">{tLogin('submit')}</Link>
          </Button>
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link href="/register" className="flex items-center gap-2">
              <AppIcon name="UserPlus" size={16} />
              {tRegister('submit')}
            </Link>
          </Button>
        </div>
      ) : (
        <div className="hidden items-center gap-1 sm:flex">
          <Button
            variant="ghost"
            asChild
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            <Link href="/characters">{tCommon('back')}</Link>
          </Button>
          <UserMenu />
        </div>
      )}
      <span className="bg-border mx-1 hidden h-5 w-px sm:block" aria-hidden="true" />
      <div className="flex items-center gap-1">
        <HeaderSupportLink email={user?.email ?? undefined} />
        <LanguageSwitcher signedIn={status === 'signed-in'} />
      </div>
    </div>
  );
}
