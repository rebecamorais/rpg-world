'use client';

import { useTranslations } from 'next-intl';

import ContactForm from '@frontend/components/feedback/ContactForm';
import { Button } from '@frontend/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@frontend/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@frontend/components/ui/tooltip';

import { AppIcon } from '../ui/icon';

/** Opens the feedback form in a dialog, so reporting a bug never leaves the current screen. */
export function HeaderSupportLink({ email = '' }: { email?: string }) {
  const t = useTranslations('common');
  const tFeedback = useTranslations('feedback');

  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
            >
              <AppIcon name="Bug" size="sm" />
              <span className="sr-only">{t('contact')}</span>
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t('contactTooltip')}</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{tFeedback('title')}</DialogTitle>
          <DialogDescription>{tFeedback('subtitle')}</DialogDescription>
        </DialogHeader>
        <ContactForm initialEmail={email} embedded />
      </DialogContent>
    </Dialog>
  );
}
