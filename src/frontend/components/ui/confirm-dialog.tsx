'use client';

import { type ReactNode, createContext, useCallback, useContext, useRef, useState } from 'react';

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
import { AppIcon } from '@frontend/components/ui/icon';
import { cn } from '@frontend/lib/utils';

export interface ConfirmOptions {
  /** What is about to happen, in one line. Defaults to "Are you sure?". */
  title?: string;
  /** The consequence, e.g. "The party and its chest are gone for good." */
  description: string;
  /** The action's verb ("Delete", "Remove"), never a bare "OK". Defaults to "Confirm". */
  confirmLabel?: string;
  /** Deletes or removes something: the dialog and its button turn red. */
  destructive?: boolean;
}

type Confirm = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<Confirm | null>(null);

/**
 * In-app replacement for `window.confirm`: `if (!(await confirm({...}))) return;`.
 * The native box can't be styled, so a delete looked like any other question.
 */
export function useConfirm(): Confirm {
  const confirm = useContext(ConfirmContext);
  if (!confirm) throw new Error('useConfirm must be used inside <ConfirmProvider>');
  return confirm;
}

interface Pending extends ConfirmOptions {
  resolve: (answer: boolean) => void;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);
  // Kept after closing so the text doesn't vanish during the fade-out
  const [shown, setShown] = useState<ConfirmOptions | null>(null);

  const confirm = useCallback<Confirm>(
    (options) =>
      new Promise<boolean>((resolve) => {
        setShown(options);
        setPending((previous) => {
          previous?.resolve(false);
          return { ...options, resolve };
        });
      }),
    [],
  );

  const answer = (value: boolean) => {
    pending?.resolve(value);
    setPending(null);
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog open={!!pending} options={shown} onAnswer={answer} />
    </ConfirmContext.Provider>
  );
}

function ConfirmDialog({
  open,
  options,
  onAnswer,
}: {
  open: boolean;
  options: ConfirmOptions | null;
  onAnswer: (value: boolean) => void;
}) {
  const t = useTranslations('common');
  const cancelRef = useRef<HTMLButtonElement>(null);
  const destructive = !!options?.destructive;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onAnswer(false)}>
      <DialogContent
        role="alertdialog"
        className={cn('max-w-md', destructive && 'border-danger-muted')}
        // Cancel gets the focus: Enter right after the click must not delete anything
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          cancelRef.current?.focus();
        }}
      >
        <DialogHeader className="flex-row items-start gap-3 space-y-0 text-left">
          {destructive && (
            <span className="bg-danger-surface text-danger-flare mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full">
              <AppIcon name="TriangleAlert" size={18} aria-hidden="true" />
            </span>
          )}
          <div className="flex flex-col gap-1.5 pr-6">
            <DialogTitle>{options?.title ?? t('confirmTitle')}</DialogTitle>
            <DialogDescription>{options?.description}</DialogDescription>
          </div>
        </DialogHeader>
        <DialogFooter>
          <Button ref={cancelRef} variant="secondary" onClick={() => onAnswer(false)}>
            {t('cancel')}
          </Button>
          <Button variant={destructive ? 'destructive' : 'default'} onClick={() => onAnswer(true)}>
            {options?.confirmLabel ?? t('confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
