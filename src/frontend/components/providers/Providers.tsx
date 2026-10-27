'use client';

import type { ReactNode } from 'react';

import { NextIntlClientProvider } from 'next-intl';

import QueryProvider from '@frontend/components/providers/QueryProvider';
import { TooltipProvider } from '@frontend/components/ui/tooltip';
import { FileUploaderProvider } from '@frontend/context/FileUploaderContext';

interface ProvidersProps {
  children: ReactNode;
  locale: string;
  messages: Record<string, unknown>;
}

// Fixed, like the server's request config: the pages are prebuilt, so the visitor's time zone
// can't be known there. Nothing formats dates through next-intl today.
const TIME_ZONE = 'UTC';

export default function Providers({ children, locale, messages }: ProvidersProps) {
  return (
    <QueryProvider>
      <NextIntlClientProvider locale={locale} messages={messages} timeZone={TIME_ZONE}>
        <FileUploaderProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </FileUploaderProvider>
      </NextIntlClientProvider>
    </QueryProvider>
  );
}
