'use client';

import Link from 'next/link';

import { useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@frontend/components/ui/dialog';
import { useSession } from '@frontend/hooks/useSession';

import AppLink from './AppLink';
import { useDemo } from './DemoContext';

/**
 * Opens when the visitor tries to change something: the demo is read only, an account is not.
 * Signed in, it doesn't sell an account she already has: her sheets are back in the app.
 */
export function DemoInvite() {
  const t = useTranslations('demo');
  const { inviteOpen, setInviteOpen } = useDemo();
  const signedIn = useSession().status === 'signed-in';

  return (
    <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{signedIn ? t('invite.signedInTitle') : t('invite.title')}</DialogTitle>
          <DialogDescription>
            {signedIn ? t('invite.signedInDescription') : t('invite.description')}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setInviteOpen(false)}>
            {t('invite.keep')}
          </Button>
          <Button asChild>
            {signedIn ? (
              // Plain Link: AppLink would turn the app's /characters into the demo's own page
              <Link href="/characters">{t('banner.back')}</Link>
            ) : (
              <AppLink href="/register">{t('invite.create')}</AppLink>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
