/**
 * Copyright (c) 2026 Rebeca Morais Cruz (Rebs Tech Studio). Licenciado sob a GNU GPLv3.
 */

'use client';

import { useState } from 'react';

import { MessageSquare } from 'lucide-react';
import { useTranslations } from 'next-intl';

import ContactForm from '@frontend/components/feedback/ContactForm';
import { Button } from '@frontend/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@frontend/components/ui/card';

/** The support page's contact card, with a success screen once the message is sent. */
export default function ContactCard({ initialEmail = '' }: { initialEmail?: string }) {
  const t = useTranslations('feedback');
  const [isSuccess, setIsSuccess] = useState(false);

  if (isSuccess) {
    return (
      <Card className="bg-card/80 mx-auto w-full max-w-2xl shadow-2xl backdrop-blur-sm">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <div className="bg-primary-surface text-primary-flare mb-4 flex h-16 w-16 items-center justify-center rounded-full shadow-[0_0_15px_var(--primary-surface)]">
            <MessageSquare className="h-8 w-8" />
          </div>
          <CardTitle as="h1" className="mb-2">
            {t('success')}
          </CardTitle>
          <Button
            variant="ghost"
            onClick={() => setIsSuccess(false)}
            className="text-muted-foreground hover:text-foreground mt-4"
          >
            {t('sendAnother')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card mx-auto w-full max-w-2xl shadow-2xl">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="bg-primary-surface text-primary-flare rounded-md p-2">
            <MessageSquare className="h-5 w-5" />
          </div>
          <CardTitle as="h1">{t('title')}</CardTitle>
        </div>
        <CardDescription className="text-muted-foreground">{t('subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ContactForm initialEmail={initialEmail} onSent={() => setIsSuccess(true)} />
      </CardContent>
    </Card>
  );
}
