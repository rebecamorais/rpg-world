'use client';

import { useId, useState } from 'react';

import Link from 'next/link';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod/mini';

import { rpgWorldApi } from '@client';

import { DANGER_BUTTON } from '@frontend/components/profile/danger-button';
import { Button } from '@frontend/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@frontend/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormRootError,
} from '@frontend/components/ui/form';
import { AppIcon } from '@frontend/components/ui/icon';
import { Input } from '@frontend/components/ui/input';
import { SectionCard } from '@frontend/components/ui/section-card';
import { useErrorMessage } from '@frontend/hooks/useErrorMessage';
import { useParties } from '@frontend/hooks/useParties';
import { useProfile } from '@frontend/hooks/useProfile';
import { cn } from '@frontend/lib/utils';

interface DeleteAccountCardProps {
  /** Whether the account has a password; without one, the e-mail link alone confirms. */
  hasPassword: boolean;
}

const PASSWORD_INVALID = 'account_deletion_error_password_invalid';
const USERNAME_MISMATCH = 'account_deletion_error_username_mismatch';

function PartyGroup({ title, hint, names }: { title: string; hint: string; names: string[] }) {
  const titleId = useId();
  if (names.length === 0) return null;

  return (
    <div role="group" aria-labelledby={titleId} className="flex flex-col gap-1">
      <p id={titleId} className="text-sm font-semibold">
        {title}
      </p>
      <p className="text-muted-foreground text-sm">{hint}</p>
      <ul className="list-disc pl-5 text-sm">
        {names.map((name, i) => (
          <li key={i}>{name}</li>
        ))}
      </ul>
    </div>
  );
}

/**
 * "Danger zone" of the profile settings: what deleting erases, which parties are affected, and the
 * first of the two steps (username and password; the e-mailed link is the second).
 */
export function DeleteAccountCard({ hasPassword }: DeleteAccountCardProps) {
  const t = useTranslations('accountDeletion.dangerZone');
  const titleId = useId();
  const { profile } = useProfile();
  const { parties, error, refetch } = useParties();
  const [open, setOpen] = useState(false);

  // A GM's party with active players goes on without a GM; without them it goes with the account.
  // A GM-less party goes too when this person is the only active player left.
  const kept = parties?.asGm.filter((p) => p.activePlayers > 0) ?? [];
  const deleted = parties?.asGm.filter((p) => p.activePlayers === 0) ?? [];
  const lastPlayer = parties?.asPlayer.filter((p) => !p.hasGm && p.activePlayers <= 1) ?? [];

  return (
    <SectionCard role="region" aria-labelledby={titleId} className="border-danger-muted">
      <SectionCard.Header className="sm:px-6">
        <SectionCard.Title id={titleId} icon="TriangleAlert">
          {t('title')}
        </SectionCard.Title>
      </SectionCard.Header>
      <SectionCard.Body className="flex flex-col gap-5 sm:p-6">
        <div className="flex flex-col gap-2">
          <p className="text-sm">{t('intro')}</p>
          <ul className="list-disc pl-5 text-sm">
            <li>{t('erasesLogin')}</li>
            <li>{t('erasesCharacters')}</li>
            <li>{t('erasesImages')}</li>
          </ul>
        </div>
        <PartyGroup title={t('keptTitle')} hint={t('keptHint')} names={kept.map((p) => p.name)} />
        <PartyGroup
          title={t('deletedTitle')}
          hint={t('deletedHint')}
          names={deleted.map((p) => p.name)}
        />
        <PartyGroup
          title={t('lastPlayerTitle')}
          hint={t('lastPlayerHint')}
          names={lastPlayer.map((p) => p.name)}
        />
        {error ? (
          <div role="alert" className="flex flex-col items-start gap-2">
            <p className="text-danger-flare text-sm">{t('partiesError')}</p>
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              {t('partiesRetry')}
            </Button>
          </div>
        ) : (
          !parties && (
            <p role="status" className="text-muted-foreground text-sm">
              {t('partiesLoading')}
            </p>
          )
        )}
        <Button
          variant="outline"
          className={cn(DANGER_BUTTON, 'w-full sm:w-auto sm:self-start')}
          onClick={() => setOpen(true)}
        >
          <AppIcon name="Trash2" size={16} aria-hidden="true" />
          {t('open')}
        </Button>
      </SectionCard.Body>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-danger-muted max-h-[90vh] overflow-y-auto">
          <RequestDeletionDialog
            username={profile?.username ?? ''}
            hasPassword={hasPassword}
            partiesLoaded={!!parties}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </SectionCard>
  );
}

function RequestDeletionDialog({
  username,
  hasPassword,
  partiesLoaded,
  onCancel,
}: {
  username: string;
  hasPassword: boolean;
  /** Until the affected parties show on the card, nobody can confirm blind. */
  partiesLoaded: boolean;
  onCancel: () => void;
}) {
  const t = useTranslations('accountDeletion.dangerZone');
  const tCommon = useTranslations('common');
  const { getErrorMessage } = useErrorMessage();
  const [sent, setSent] = useState(false);

  const schema = z.object({ username: z.string(), password: z.string() });
  type Values = z.infer<typeof schema>;
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { username: '', password: '' },
  });
  const typed = useWatch({ control: form.control, name: 'username' });
  const typedPassword = useWatch({ control: form.control, name: 'password' });

  const onSubmit = async (values: Values) => {
    try {
      await rpgWorldApi.post('/api/profile/deletion-request', {
        username: values.username,
        ...(hasPassword && { password: values.password }),
      });
      setSent(true);
    } catch (err) {
      const message = getErrorMessage(err);
      const code = err instanceof Error ? err.message : '';
      if (code === PASSWORD_INVALID) form.setError('password', { message }, { shouldFocus: true });
      else if (code === USERNAME_MISMATCH)
        form.setError('username', { message }, { shouldFocus: true });
      else form.setError('root', { message });
    }
  };

  if (sent) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>{t('sentTitle')}</DialogTitle>
          <DialogDescription>{t('sentDescription')}</DialogDescription>
        </DialogHeader>
        <p className="text-muted-foreground text-sm">{t('sendAgainHint')}</p>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setSent(false)}>
            {t('sendAgain')}
          </Button>
          <Button variant="secondary" onClick={onCancel}>
            {tCommon('close')}
          </Button>
        </DialogFooter>
      </>
    );
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{t('dialogTitle')}</DialogTitle>
        <DialogDescription>{t('dialogDescription')}</DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <p className="border-warning-muted bg-warning-surface text-warning-flare rounded-md border p-3 text-sm">
            {t.rich('usernameInstruction', {
              username,
              bold: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('usernameLabel')}</FormLabel>
                <FormControl>
                  <Input autoComplete="off" className="bg-muted" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {hasPassword && (
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('passwordLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      className="bg-muted"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-muted-foreground text-sm">
                    {t('passwordHelp')}{' '}
                    <Link href="/forgot-password" className="text-primary-flare hover:underline">
                      {t('forgotPassword')}
                    </Link>
                  </p>
                </FormItem>
              )}
            />
          )}
          <FormRootError />
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onCancel}>
              {tCommon('cancel')}
            </Button>
            <Button
              type="submit"
              variant="outline"
              className={DANGER_BUTTON}
              disabled={
                !partiesLoaded || !username || typed !== username || (hasPassword && !typedPassword)
              }
              loading={form.formState.isSubmitting}
            >
              {t('submit')}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}
