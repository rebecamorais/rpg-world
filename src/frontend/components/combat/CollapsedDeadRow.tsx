'use client';

import { useTranslations } from 'next-intl';

import { CharacterPortrait } from '@frontend/components/character/CharacterPortrait';
import { Button } from '@frontend/components/ui/button';
import { AppIcon } from '@frontend/components/ui/icon';
import { cn } from '@frontend/lib/utils';

import type { GmRow } from '@backend/contexts/combat/domain/Encounter';

import { SideBadge } from './SideBadge';

/**
 * A death the players already know of, as thin as in their list. The GM still opens it with the
 * chevron (a real button, so the keyboard reaches it) to undo or hide the death.
 */
export function CollapsedDeadRow({ row, onExpand }: { row: GmRow; onExpand: () => void }) {
  const t = useTranslations('combat');
  return (
    <li
      aria-current={row.isCurrent ? 'true' : undefined}
      className={cn(
        'border-border text-muted-foreground flex items-center gap-2 rounded-md border border-dashed px-3 py-1',
        row.isCurrent && 'border-primary',
      )}
    >
      <CharacterPortrait
        avatarUrl={row.avatarUrl}
        characterClass={row.class}
        className="size-5 grayscale"
      />
      <s className="min-w-0 truncate text-sm">{row.name}</s>
      <SideBadge side={row.side} className="ml-auto" />
      <AppIcon name="Skull" size={14} aria-hidden="true" />
      <span className="sr-only">{t('dead')}</span>
      <Button
        variant="ghost"
        size="icon"
        aria-label={t('detailsOf', { name: row.name })}
        aria-expanded={false}
        onClick={onExpand}
      >
        <AppIcon name="ChevronRight" size={16} aria-hidden="true" />
      </Button>
    </li>
  );
}
