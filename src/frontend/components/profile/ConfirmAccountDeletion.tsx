'use client';

import { useState } from 'react';

import Link from 'next/link';

import { localizedHref } from '@/i18n/routing';
import { useLocale, useTranslations } from 'next-intl';

import { rpgWorldApi } from '@client';

import { Button } from '@frontend/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@frontend/components/ui/card';
import { useErrorMessage } from '@frontend/hooks/useErrorMessage';

interface ConfirmAccountDeletionProps {
  /** What the link points at; null when it expired, was used or was replaced. */
  account: { username: string | null } | null;
  token: string;
  /** Whether this browser is signed in: a new link is asked from the profile, after signing in. */
  signedIn: boolean;
}

/**
 * Second step of the deletion, opened from the e-mailed link. Opening only shows the account (mail
 * readers open links on their own); the account goes with the button.
 */
export function ConfirmAccountDeletion({ account, token, signedIn }: ConfirmAccountDeletionProps) {
  const t = useTranslations('accountDeletion.confirm');
  const locale = useLocale();
  const { getErrorMessage } = useErrorMessage();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDelete = async () => {
    setPending(true);
    setError(null);
    try {
      await rpgWorldApi.post('/api/account/delete', { token });
      // A full page load, like useAuth: the session cookie changed, so the layout and the query
      // cache of whoever is signed in on this browser must not survive

      window.location.assign(localizedHref('/?accountDeleted=1', locale));
    } catch (err) {
      setError(getErrorMessage(err));
      setPending(false);
    }
  };

  if (!account) {
    return (
      <Card className="bg-card/80 mx-auto w-full max-w-md shadow-2xl backdrop-blur-md">
        <CardHeader>
          <CardTitle as="h1">{t('invalidTitle')}</CardTitle>
          <CardDescription className="text-muted-foreground">
            {t('invalidDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {/* Signed out, the profile goes through the login: say why before it does */}
          {!signedIn && <p className="text-muted-foreground text-sm">{t('signInForNewLink')}</p>}
          <Button asChild className="w-full">
            <Link
              href={
                signedIn
                  ? '/settings/profile'
                  : localizedHref(`/login?next=${encodeURIComponent('/settings/profile')}`, locale)
              }
            >
              {signedIn ? t('backToSettings') : t('signIn')}
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-danger-muted bg-card/80 mx-auto w-full max-w-md shadow-2xl backdrop-blur-md">
      <CardHeader>
        <CardTitle as="h1">{t('title')}</CardTitle>
        <CardDescription className="text-muted-foreground">
          {account.username
            ? t.rich('description', {
                username: account.username,
                bold: (chunks) => <strong className="text-foreground">{chunks}</strong>,
              })
            : t('descriptionNoName')}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error && (
          <p
            role="alert"
            className="border-danger-muted bg-danger-surface text-danger-flare rounded-md border px-3 py-2 text-sm"
          >
            {error}
          </p>
        )}
        <Button variant="danger" className="w-full" onClick={onDelete} loading={pending}>
          {t('button')}
        </Button>
        {/* A way out that isn't the irreversible button */}
        <Button asChild variant="secondary" className="w-full">
          <Link href={signedIn ? '/settings/profile' : localizedHref('/', locale)}>
            {t('keepAccount')}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
