import type { ReactNode } from 'react';

import Link from 'next/link';

import { Button } from '@frontend/components/ui/button';
import { cn } from '@frontend/lib/utils';

interface AuthLayoutProps {
  children: ReactNode;
  /** A way back, above the card. Left out where the card already has one. */
  back?: { href: string; label: string };
  /** The column's width (default `max-w-sm`, the width of the auth cards). */
  className?: string;
}

/**
 * Frame of the account pages (sign in, sign up, passwords, username, link errors): the card in the
 * middle, with the same margins on every page. The way back is in the flow, above the card, so a
 * card taller than the screen pushes it up instead of covering it.
 */
export default function AuthLayout({ children, back, className }: AuthLayoutProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-4 sm:p-8">
      <div className={cn('flex w-full max-w-sm flex-col gap-2', className)}>
        {back && (
          <Button asChild variant="ghost" size="sm" className="text-muted-foreground self-start">
            <Link href={back.href}>{back.label}</Link>
          </Button>
        )}
        {children}
      </div>
    </div>
  );
}
