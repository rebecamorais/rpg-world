'use client';

import { useState } from 'react';

import Link from 'next/link';

import { useTranslations } from 'next-intl';

import { rpgWorldApi } from '@client';

import { DANGER_BUTTON } from '@frontend/components/profile/danger-button';
import { Button } from '@frontend/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@frontend/components/ui/card';
import { useErrorMessage } from '@frontend/hooks/useErrorMessage';
import { cn } from '@frontend/lib/utils';

interface ConfirmAccountDeletionProps {
  /** What the link points at; null when it expired, was used or was replaced. */
  account: { username: string | null } | null;
  token: string;
}

/**
 * Second step of the deletion, opened from the e-mailed link. Opening only shows the account (mail
 * readers open links on their own); the account goes with the button.
 */
export function ConfirmAccountDeletion({ account, token }: ConfirmAccountDeletionProps) {
  const t = useTranslations('accountDeletion.confirm');
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
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- deliberate
      window.location.assign('/?accountDeleted=1');
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
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/settings/profile">{t('backToSettings')}</Link>
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
        <Button
          variant="outline"
          className={cn(DANGER_BUTTON, 'w-full')}
          onClick={onDelete}
          loading={pending}
        >
          {t('button')}
        </Button>
      </CardContent>
    </Card>
  );
}
