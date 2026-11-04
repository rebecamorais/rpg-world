'use client';

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

import AppLink from './AppLink';
import { useDemo } from './DemoContext';

/** Opens when the visitor tries to change something: the demo is read only, an account is not. */
export function DemoInvite() {
  const t = useTranslations('demo.invite');
  const { inviteOpen, setInviteOpen } = useDemo();

  return (
    <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setInviteOpen(false)}>
            {t('keep')}
          </Button>
          <Button asChild>
            <AppLink href="/register">{t('create')}</AppLink>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
