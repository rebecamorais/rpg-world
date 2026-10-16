'use client';

import { useRef, useState } from 'react';

import dynamic from 'next/dynamic';

import { useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@frontend/components/ui/dialog';
import { Spinner } from '@frontend/components/ui/spinner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@frontend/components/ui/tooltip';

import { AppIcon } from '../ui/icon';

// The header is on every page, but the form (react-hook-form, zod, Turnstile) is only
// needed once someone opens the dialog
const ContactForm = dynamic(() => import('@frontend/components/feedback/ContactForm'), {
  loading: () => (
    <div className="flex justify-center py-16">
      <Spinner size="md" variant="muted" />
    </div>
  ),
});

/** Opens the feedback form in a dialog, so reporting a bug never leaves the current screen. */
export function HeaderSupportLink({ email = '' }: { email?: string }) {
  const t = useTranslations('common');
  const tFeedback = useTranslations('feedback');
  const [open, setOpen] = useState(false);
  // Closing the dialog gives focus back to the button, which would pop the tooltip up again
  const skipNextTooltip = useRef(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger
          asChild
          onFocus={(event) => {
            if (!skipNextTooltip.current) return;
            skipNextTooltip.current = false;
            event.preventDefault();
          }}
        >
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
            >
              <AppIcon name="Bug" size="sm" />
              <span className="sr-only">{t('contactTooltip')}</span>
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t('contactTooltip')}</p>
        </TooltipContent>
      </Tooltip>
      <DialogContent
        className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl"
        onCloseAutoFocus={() => {
          skipNextTooltip.current = true;
        }}
      >
        <DialogHeader>
          <DialogTitle>{tFeedback('title')}</DialogTitle>
          <DialogDescription>{tFeedback('subtitle')}</DialogDescription>
        </DialogHeader>
        {/* The success toast is enough here: close instead of showing a second screen */}
        <ContactForm initialEmail={email} embedded onSent={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
