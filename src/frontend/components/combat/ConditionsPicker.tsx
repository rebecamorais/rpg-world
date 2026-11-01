'use client';

import * as React from 'react';

import { useTranslations } from 'next-intl';

import { ConditionHint } from '@frontend/components/content/ConditionHint';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@frontend/components/ui/dialog';
import { AppIcon } from '@frontend/components/ui/icon';
import { NumberStepper } from '@frontend/components/ui/number-stepper';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@frontend/components/ui/tabs';
import { useConditions } from '@frontend/hooks/useConditions';
import { cn } from '@frontend/lib/utils';

import type { ActiveCondition } from '@backend/contexts/combat/domain/Encounter';

import { EDITIONS, type Edition } from '@shared/systems/dnd5e/content/editions';

const MAX_LEVEL = 6;

interface ConditionsPickerProps {
  value: ActiveCondition[];
  /** The edition whose tab opens first (the party's). */
  defaultEdition: Edition;
  /** Gets the whole list, conditions of the other edition included. */
  onChange: (next: ActiveCondition[]) => void;
  /** The button that opens the dialog. */
  children: React.ReactNode;
}

/** A dialog with one switch per condition, a tab per edition; exhaustion also has its level. */
export function ConditionsPicker({
  value,
  defaultEdition,
  onChange,
  children,
}: ConditionsPickerProps) {
  const t = useTranslations('conditions');
  const { list } = useConditions();
  const active = new Map(value.map((c) => [c.key, c]));

  const toggle = (key: string, hasLevels: boolean) => {
    if (active.has(key)) return onChange(value.filter((c) => c.key !== key));
    onChange([...value, { key, level: hasLevels ? 1 : null }]);
  };
  const setLevel = (key: string, level: number) =>
    onChange(value.map((c) => (c.key === key ? { ...c, level } : c)));

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[85dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('pickerDescription')}</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue={defaultEdition}>
          <TabsList>
            {EDITIONS.map((edition) => (
              <TabsTrigger key={edition} value={edition} className="pointer-coarse:min-h-11">
                {edition}
              </TabsTrigger>
            ))}
          </TabsList>
          {EDITIONS.map((edition) => (
            <TabsContent key={edition} value={edition}>
              <ul className="flex flex-col gap-1">
                {list
                  .filter((c) => c.edition === edition)
                  .map((c) => {
                    const on = active.get(c.key);
                    const hasLevels = c.maxLevel !== null;
                    return (
                      <li key={c.key} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={!!on}
                          onClick={() => toggle(c.key, hasLevels)}
                          className="focus-ring flex min-h-11 flex-1 cursor-pointer items-center gap-3 rounded-sm text-left"
                        >
                          <span
                            aria-hidden="true"
                            className={cn(
                              'border-border relative h-5 w-9 shrink-0 rounded-full border transition-colors',
                              on ? 'bg-primary border-primary' : 'bg-muted',
                            )}
                          >
                            <span
                              className={cn(
                                'bg-foreground absolute top-0.5 left-0.5 size-3.5 rounded-full transition-transform',
                                on && 'translate-x-4',
                              )}
                            />
                          </span>
                          <span className={cn(!on && 'text-muted-foreground')}>{c.name}</span>
                        </button>
                        {on && hasLevels && (
                          <NumberStepper
                            label={t('exhaustionLevel')}
                            value={on.level ?? 1}
                            min={1}
                            max={c.maxLevel ?? MAX_LEVEL}
                            onChange={(level) => setLevel(c.key, level)}
                            containerClassName="py-0"
                          />
                        )}
                        <ConditionHint conditionKey={c.key} accessibleName={c.name}>
                          <AppIcon name="Book" size={16} aria-hidden="true" />
                        </ConditionHint>
                      </li>
                    );
                  })}
              </ul>
            </TabsContent>
          ))}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
