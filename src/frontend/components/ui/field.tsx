import * as React from 'react';

import { GhostInput } from '@frontend/components/ui/ghost-input';
import { Label } from '@frontend/components/ui/label';
import { cn } from '@frontend/lib/utils';

/** Small uppercase label used on the character sheet (stats, sections, inline fields). */
function FieldLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
  return <Label className={cn('text-label text-muted-foreground', className)} {...props} />;
}

interface InlineFieldProps extends React.ComponentProps<typeof GhostInput> {
  id: string;
  label: string;
}

/** Label on top of a GhostInput: a text field that reads as plain text until edited. */
function InlineField({ id, label, className, containerClassName, ...props }: InlineFieldProps) {
  return (
    <div className={cn('flex flex-col gap-1', containerClassName)}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <GhostInput
        id={id}
        className={cn(
          'bg-muted/40 hover:bg-muted focus-visible:bg-background h-10 px-3 font-medium',
          className,
        )}
        {...props}
      />
    </div>
  );
}

export { FieldLabel, InlineField };
