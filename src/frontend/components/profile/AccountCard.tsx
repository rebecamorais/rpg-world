import Link from 'next/link';

import { useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';
import { SectionCard } from '@frontend/components/ui/section-card';

interface AccountCardProps {
  email: string;
  /** Without a password (Google only), the way to get one is the recovery e-mail. */
  hasPassword: boolean;
  /** Just came back from changing the password (`?passwordChanged=1`). */
  passwordChanged?: boolean;
}

/** "Account" card of the profile: the sign-in e-mail, read only, and the way to the password. */
export function AccountCard({ email, hasPassword, passwordChanged = false }: AccountCardProps) {
  const t = useTranslations('profileAccount');

  return (
    <SectionCard>
      <SectionCard.Header className="sm:px-6">
        <SectionCard.Title icon="Shield">{t('title')}</SectionCard.Title>
      </SectionCard.Header>
      <SectionCard.Body className="flex flex-col gap-5 sm:p-6">
        {passwordChanged && (
          <p
            role="status"
            className="border-success-muted bg-success-surface text-success-flare rounded-md border px-4 py-3 text-sm"
          >
            {t('passwordChanged')}
          </p>
        )}
        <dl className="flex flex-col gap-1">
          <dt className="text-label text-muted-foreground">{t('emailLabel')}</dt>
          <dd className="text-body break-all">{email}</dd>
        </dl>
        <div className="flex flex-col gap-2">
          {hasPassword ? (
            <Button asChild variant="secondary" className="w-full sm:w-auto sm:self-start">
              <Link href="/change-password">{t('changePassword')}</Link>
            </Button>
          ) : (
            <>
              <p className="text-caption text-muted-foreground">{t('noPasswordHint')}</p>
              <Button asChild variant="secondary" className="w-full sm:w-auto sm:self-start">
                <Link href="/forgot-password">{t('createPassword')}</Link>
              </Button>
            </>
          )}
        </div>
      </SectionCard.Body>
    </SectionCard>
  );
}
