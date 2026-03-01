'use client';

import { type ReactNode, useEffect } from 'react';

import { NextIntlClientProvider } from 'next-intl';

import QueryProvider from '@/frontend/components/QueryProvider';
import { TooltipProvider } from '@/frontend/components/ui/tooltip';
import { UserProvider } from '@/frontend/context/UserContext';

interface ProvidersProps {
  children: ReactNode;
  locale: string;
  messages: Record<string, unknown>;
  timeZone: string;
}

export default function Providers({
  children,
  locale,
  messages,
  timeZone,
}: ProvidersProps) {
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) {
      document.cookie = `NEXT_TIMEZONE=${tz};path=/;max-age=31536000`;
    }
  }, []);

  return (
    <QueryProvider>
      <NextIntlClientProvider
        locale={locale}
        messages={messages}
        timeZone={timeZone}
      >
        <UserProvider user={null}>
          <TooltipProvider>{children}</TooltipProvider>
        </UserProvider>
      </NextIntlClientProvider>
    </QueryProvider>
  );
}
