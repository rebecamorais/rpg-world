'use client';

import * as React from 'react';

import { ConditionHint } from '@frontend/components/content/ConditionHint';
import { badgeVariants } from '@frontend/components/ui/badge';
import { useConditions } from '@frontend/hooks/useConditions';
import { cn } from '@frontend/lib/utils';

import { parseContentKey } from '@shared/content/content-key';
import type { Edition } from '@shared/systems/dnd5e/content/editions';

interface ConditionBadgeProps {
  conditionKey: string;
  /** Exhaustion only. */
  level?: number | null;
  /** The edition not worth spelling out; any other one shows next to the name. */
  defaultEdition?: Edition;
}

/** A condition as a badge; tapping it opens the same popover as in the text. */
export function ConditionBadge({ conditionKey, level, defaultEdition }: ConditionBadgeProps) {
  const { byKey } = useConditions();
  const condition = byKey.get(conditionKey);

  if (!condition) {
    return (
      <span className={cn(badgeVariants({ variant: 'outline' }), 'text-muted-foreground')}>
        {parseContentKey(conditionKey)?.id ?? conditionKey}
      </span>
    );
  }

  const showEdition = defaultEdition !== undefined && condition.edition !== defaultEdition;

  return (
    <ConditionHint
      conditionKey={conditionKey}
      className={cn(badgeVariants({ variant: 'outline' }), 'text-foreground no-underline')}
    >
      {condition.name}
      {level ? ` ${level}` : ''}
      {showEdition && <span className="text-muted-foreground ml-1">· {condition.edition}</span>}
    </ConditionHint>
  );
}
