'use client';

import * as React from 'react';

import { useTranslations } from 'next-intl';

import { RulesText } from '@frontend/components/content/RulesText';
import { Popover, PopoverContent, PopoverTrigger } from '@frontend/components/ui/popover';
import { useConditions } from '@frontend/hooks/useConditions';
import { cn } from '@frontend/lib/utils';

import { parseContentKey } from '@shared/content/content-key';

interface ConditionHintProps {
  conditionKey: string;
  /** What the button shows; the condition's name when omitted. */
  label?: string;
  /** What the button is called for a screen reader, before ", condition"; the name when omitted. */
  accessibleName?: string;
  /** Replaces the inline-link look (the badge brings its own). */
  className?: string;
  children?: React.ReactNode;
}

/**
 * A condition's rules in a popover. Not a `Hint`: a tooltip is not meant to hold a button or
 * a long list, and its button name is fixed ("What is …?"). The popover opens on tap, click or
 * Enter, and closes on Esc or on an outside tap.
 */
export function ConditionHint({
  conditionKey,
  label,
  accessibleName,
  className,
  children,
}: ConditionHintProps) {
  const t = useTranslations('conditions');
  const { byKey, list } = useConditions();
  // Which book is showing; null follows the key the text points to
  const [shownKey, setShownKey] = React.useState<string | null>(null);

  const condition = byKey.get(shownKey ?? conditionKey) ?? byKey.get(conditionKey);
  if (!condition) {
    return <>{children ?? label ?? parseContentKey(conditionKey)?.id ?? conditionKey}</>;
  }

  const other = list.find((c) => c.id === condition.id && c.edition !== condition.edition);

  return (
    <Popover onOpenChange={(open) => !open && setShownKey(null)}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={t('ariaLabel', { name: accessibleName ?? condition.name })}
          className={cn(
            'focus-ring touch-target text-primary decoration-primary/60 cursor-pointer rounded-sm underline decoration-dotted underline-offset-4',
            className,
          )}
        >
          {children ?? label ?? condition.name}
        </button>
      </PopoverTrigger>
      <PopoverContent>
        <p className="text-foreground font-semibold">
          {condition.name} <span className="text-muted-foreground">· {condition.edition}</span>
        </p>
        <div className="text-muted-foreground mt-1 whitespace-pre-wrap">
          <RulesText
            text={condition.description}
            source={parseContentKey(condition.key)?.source ?? ''}
            nested
          />
        </div>
        {other && (
          <button
            type="button"
            onClick={() => setShownKey(other.key)}
            className="focus-ring touch-target text-primary mt-2 rounded-sm text-xs font-medium underline underline-offset-4"
          >
            {t('otherEdition', { edition: other.edition })}
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}
