'use client';

import type { ReactNode } from 'react';

import LanguageProvider from '@/frontend/components/LanguageProvider';
import QueryProvider from '@/frontend/components/QueryProvider';
import { TooltipProvider } from '@/frontend/components/ui/tooltip';
import { UserProvider } from '@/frontend/context/UserContext';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryProvider>
      <LanguageProvider>
        <UserProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </UserProvider>
      </LanguageProvider>
    </QueryProvider>
  );
}
