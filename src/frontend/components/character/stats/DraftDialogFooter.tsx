import type { ReactNode } from 'react';

import { useTranslations } from 'next-intl';

import { DialogFooter } from '@frontend/components/ui/dialog';
import { cn } from '@frontend/lib/utils';

/**
 * Footer of a modal whose changes go into the sheet's draft: the note saying the sheet still needs
 * saving, then the buttons. The note comes first on phones too (DialogFooter alone stacks the
 * buttons above it, so it was read last), and the buttons never say Save.
 */
export function DraftDialogFooter({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const t = useTranslations('common');

  return (
    <DialogFooter
      className={cn('flex-col items-stretch gap-3 sm:items-center sm:justify-between', className)}
    >
      <p className="text-caption text-muted-foreground">{t('draftNote')}</p>
      <div className="flex flex-col-reverse gap-2 sm:flex-row">{children}</div>
    </DialogFooter>
  );
}
