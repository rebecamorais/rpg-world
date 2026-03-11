'use client';

import { type ReactNode, useEffect } from 'react';

import QueryProvider from '@frontend/components/QueryProvider';
import ThemeProvider from '@frontend/components/ThemeProvider';
import { TooltipProvider } from '@frontend/components/ui/tooltip';
import { UserProvider } from '@frontend/context/UserContext';
import { NextIntlClientProvider } from 'next-intl';

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
          <ThemeProvider />
          <TooltipProvider>{children}</TooltipProvider>
        </UserProvider>
      </NextIntlClientProvider>
    </QueryProvider>
  );
}
