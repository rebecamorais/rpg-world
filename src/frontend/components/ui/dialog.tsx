'use client';

import * as React from 'react';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { useTranslations } from 'next-intl';

import { AppIcon } from '@frontend/components/ui/icon';
import { cn } from '@frontend/lib/utils';

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

function DialogOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      className={cn(
        'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 bg-overlay fixed inset-0 z-50',
        className,
      )}
      {...props}
    />
  );
}

// Like Radix's first tabbable, links left out (a link opening on Enter is a surprise)
const FIELDS =
  'input:not([type="hidden"]), select, textarea, button, [tabindex], [contenteditable="true"]';

/** The dialog's first control in the Tab order, the close button left out. */
function firstField(content: HTMLElement): HTMLElement | null {
  for (const element of content.querySelectorAll<HTMLElement>(FIELDS)) {
    // tabIndex -1 also covers the hidden native <select> behind a Radix Select
    if (element.tabIndex < 0 || element.hasAttribute('data-dialog-close')) continue;
    if (element.matches(':disabled') || element.closest('[hidden], [inert]')) continue;
    if (isHidden(element, content)) continue;
    return element;
  }
  return null;
}

function isHidden(element: HTMLElement, content: HTMLElement) {
  if (getComputedStyle(element).visibility === 'hidden') return true;
  for (let node: HTMLElement | null = element; node && node !== content; node = node.parentElement)
    if (getComputedStyle(node).display === 'none') return true;
  return false;
}

/**
 * An item of a DropdownMenu unmounts with the menu, so the focus goes back to the menu's
 * trigger: the Radix trigger points at the open menu through aria-controls (read now, while it
 * is still open). Null when the focus isn't in a menu, or its trigger can't be found.
 */
function menuTrigger(active: HTMLElement): HTMLElement | null {
  const menu = active.closest<HTMLElement>('[role="menu"]');
  if (!menu?.id) return null;
  const trigger = document.querySelector(`[aria-controls="${CSS.escape(menu.id)}"]`);
  return trigger instanceof HTMLElement ? trigger : null;
}

/**
 * Reads who has the focus on the dialog's first render, before Radix (or an autoFocus field)
 * moves it inside: that is the element that opened it (or the trigger of the menu it came from).
 */
function OpenerCapture({ onCapture }: { onCapture: (opener: HTMLElement | null) => void }) {
  const [opener] = React.useState(() => {
    if (typeof document === 'undefined') return null;
    const active = document.activeElement;
    if (!(active instanceof HTMLElement) || active === document.body) return null;
    return menuTrigger(active) ?? active;
  });
  React.useLayoutEffect(() => onCapture(opener), [onCapture, opener]);
  return null;
}

function DialogContent({
  className,
  children,
  onOpenAutoFocus,
  onCloseAutoFocus,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  const opener = React.useRef<HTMLElement | null>(null);
  const capture = React.useCallback((element: HTMLElement | null) => {
    opener.current = element;
  }, []);

  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        // minmax(0,1fr): the one column is the dialog's width, so a long word (a name with no
        // spaces) wraps inside it instead of widening the grid past the dialog's edge
        className={cn(
          'bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed top-[50%] left-[50%] z-50 grid max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg translate-x-[-50%] translate-y-[-50%] grid-cols-[minmax(0,1fr)] gap-4 overflow-y-auto overscroll-contain rounded-lg border p-6 shadow-lg duration-200',
          className,
        )}
        // The close button comes first now, and Radix would open on it: the focus goes to the
        // dialog's first field instead, as before, unless the caller chose one
        onOpenAutoFocus={(event) => {
          onOpenAutoFocus?.(event);
          if (event.defaultPrevented) return;
          const first = firstField(event.currentTarget as HTMLElement);
          if (!first) return;
          event.preventDefault();
          first.focus();
          // Radix selected the text too: typing replaces the value instead of adding to it
          // (select() is a no-op on inputs without text selection: checkbox, number in some browsers)
          if (first instanceof HTMLInputElement || first instanceof HTMLTextAreaElement)
            first.select();
        }}
        // Radix gives the focus back to a DialogTrigger only: a dialog opened from state (most of
        // them here) dropped it on <body>. The element that opened it gets it back, while it is
        // still on the page and the caller didn't handle the focus itself.
        onCloseAutoFocus={(event) => {
          onCloseAutoFocus?.(event);
          const target = opener.current;
          opener.current = null;
          if (event.defaultPrevented || !target?.isConnected) return;
          event.preventDefault();
          target.focus();
        }}
        {...props}
      >
        <OpenerCapture onCapture={capture} />
        {/* First in the Tab order (it stays in the corner): the dialog's own fields come after */}
        <DialogCloseButton />
        {children}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
}

function DialogCloseButton() {
  const t = useTranslations('common');
  return (
    <DialogPrimitive.Close
      data-dialog-close=""
      className="focus-ring touch-target text-muted-foreground hover:text-foreground absolute top-4 right-4 rounded-sm transition-colors disabled:pointer-events-none"
    >
      <AppIcon name="X" size={16} />
      <span className="sr-only">{t('close')}</span>
    </DialogPrimitive.Close>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
      {...props}
    />
  );
}

function DialogTitle({ className, ...props }: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return <DialogPrimitive.Title className={cn('text-title break-words', className)} {...props} />;
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      className={cn('text-muted-foreground text-body break-words', className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
