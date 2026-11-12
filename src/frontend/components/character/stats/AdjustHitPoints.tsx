'use client';

import { type ReactNode, useState } from 'react';

import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { Button } from '@frontend/components/ui/button';
import { Input } from '@frontend/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@frontend/components/ui/sheet';
import { useCharacterActions, useLoadedCharacter } from '@frontend/context/CharacterContext';
import { cn } from '@frontend/lib/utils';

import { type HitPointsChange, applyHitPoints } from '@shared/systems/dnd5e/hit-points';
import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

/** hp_* columns are smallint. */
const SMALLINT_MAX = 32_767;

const CHANGES: { change: HitPointsChange; label: 'damage' | 'heal' | 'setTempHp'; tone: string }[] =
  [
    {
      change: 'damage',
      label: 'damage',
      tone: 'border-danger-muted bg-danger-surface text-danger-flare hover:bg-danger-surface',
    },
    {
      change: 'heal',
      label: 'heal',
      tone: 'border-success-muted bg-success-surface text-success-flare hover:bg-success-surface',
    },
    { change: 'temp', label: 'setTempHp', tone: '' },
  ];

/**
 * "You take 7 damage": one number and one button, saved at once (no save button mid-combat),
 * with an Undo on the toast. `children` is the trigger, a button.
 */
export function AdjustHitPoints({ children }: { children: ReactNode }) {
  const t = useTranslations('combatStats');
  const character = useLoadedCharacter();
  const { saveNow } = useCharacterActions();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const value = /^\d+$/.test(amount) ? Math.min(Number(amount), SMALLINT_MAX) : null;
  const temp = character.hpTemp ?? 0;

  const apply = async (change: HitPointsChange) => {
    if (value === null) return;
    const fields = applyHitPoints(character, change, value);
    // What Undo puts back: these same fields, as they were
    const was: Partial<DnD5eCharacter> = {
      hpCurrent: character.hpCurrent,
      hpTemp: temp,
      deathSaves: character.deathSaves ?? { successes: 0, failures: 0 },
    };
    const before = Object.fromEntries(
      Object.keys(fields).map((key) => [key, was[key as keyof DnD5eCharacter]]),
    ) as Partial<DnD5eCharacter>;

    setSaving(true);
    try {
      await saveNow(fields);
    } catch {
      // saveNow already showed the error; the sheet stays open with the number typed
      return;
    } finally {
      setSaving(false);
    }

    setOpen(false);
    setAmount('');
    const after = { current: fields.hpCurrent ?? character.hpCurrent, max: character.hpMax };
    const afterTemp = fields.hpTemp ?? temp;
    toast.success(
      afterTemp > 0 ? t('hpSavedTemp', { ...after, temp: afterTemp }) : t('hpSaved', after),
      { action: { label: t('undo'), onClick: () => saveNow(before).catch(() => {}) } },
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent
        side="bottom"
        className="mx-auto flex w-full max-w-md flex-col gap-5 rounded-t-xl sm:bottom-6 sm:rounded-xl sm:border"
      >
        <SheetHeader className="pr-8 text-left">
          <SheetTitle>{t('adjustHp')}</SheetTitle>
          <SheetDescription>{t('adjustHpDescription')}</SheetDescription>
        </SheetHeader>

        <p className="text-muted-foreground font-mono text-sm tabular-nums">
          {t('hitPointsShort')} {character.hpCurrent} / {character.hpMax}
          {temp > 0 && <span className="text-warning-flare"> (+{temp})</span>}
        </p>

        <div className="flex flex-col gap-2">
          <label htmlFor="hp-amount" className="text-label text-muted-foreground">
            {t('adjustHpAmount')}
          </label>
          <Input
            id="hp-amount"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, '').slice(0, 5))}
            className="h-14 text-center font-mono text-3xl font-bold tabular-nums md:text-3xl"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          {CHANGES.map(({ change, label, tone }) => (
            <Button
              key={change}
              variant="outline"
              onClick={() => apply(change)}
              // Temporary HP can be set to 0 (to drop them); damage and healing need an amount
              disabled={value === null || (change !== 'temp' && value === 0)}
              loading={saving}
              className={cn('h-12 font-semibold', tone)}
            >
              {t(label)}
            </Button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
