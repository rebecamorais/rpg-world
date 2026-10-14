import * as React from 'react';

import { Card } from '@frontend/components/ui/card';
import { AppIcon, type IconName } from '@frontend/components/ui/icon';
import { cn } from '@frontend/lib/utils';

/**
 * Card for a section of the character sheet:
 *
 *   <SectionCard>
 *     <SectionCard.Header>
 *       <SectionCard.Title icon="Scroll">Perícias</SectionCard.Title>
 *       <SectionCard.Actions>...</SectionCard.Actions>
 *     </SectionCard.Header>
 *     <SectionCard.Body>...</SectionCard.Body>
 *   </SectionCard>
 */
function SectionCard({ className, ...props }: React.ComponentProps<typeof Card>) {
  return <Card className={cn('overflow-hidden shadow-sm', className)} {...props} />;
}

function SectionCardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        'bg-muted/40 border-border flex min-h-11 items-center justify-between gap-3 border-b px-4 py-2',
        className,
      )}
      {...props}
    />
  );
}

interface SectionCardTitleProps extends React.ComponentProps<'h2'> {
  /** Heading level; h2 by default (a section under the page's h1). */
  as?: 'h2' | 'h3';
  icon?: IconName;
  iconVariant?: React.ComponentProps<typeof AppIcon>['variant'];
}

function SectionCardTitle({
  as: Tag = 'h2',
  icon,
  iconVariant,
  className,
  children,
  ...props
}: SectionCardTitleProps) {
  return (
    <Tag
      className={cn('text-label text-muted-foreground flex items-center gap-2', className)}
      {...props}
    >
      {icon && (
        <AppIcon
          name={icon}
          variant={iconVariant}
          size={iconVariant === 'game' ? 'lg' : 14}
          className="text-character-flare shrink-0"
          aria-hidden="true"
        />
      )}
      {children}
    </Tag>
  );
}

function SectionCardActions({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('flex shrink-0 items-center gap-1', className)} {...props} />;
}

function SectionCardBody({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('p-4', className)} {...props} />;
}

SectionCard.Header = SectionCardHeader;
SectionCard.Title = SectionCardTitle;
SectionCard.Actions = SectionCardActions;
SectionCard.Body = SectionCardBody;

export { SectionCard };
