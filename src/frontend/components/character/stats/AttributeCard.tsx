'use client';

import { useState } from 'react';

import { useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@frontend/components/ui/dialog';
import { AppIcon } from '@frontend/components/ui/icon';
import { Label } from '@frontend/components/ui/label';
import { NumberInput } from '@frontend/components/ui/number-input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@frontend/components/ui/tooltip';
import { cn, getStatColorClass } from '@frontend/lib/utils';

import { getModifier } from '@shared/systems/dnd5e/calculations';
import { MAX_ATTRIBUTE, MIN_ATTRIBUTE } from '@shared/systems/dnd5e/constants';
import rules from '@shared/systems/dnd5e/rules.json';

interface Props {
  label: string;
  value: number;
  onChange: (value: number) => void;
  icon?: string;
}

export default function AttributeCard({ label, value, onChange, icon }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const [isValid, setIsValid] = useState(true);
  const tAttr = useTranslations('attributeCard');
  const t = useTranslations('characters');
  const tCommon = useTranslations('common');

  const clamped = Math.min(MAX_ATTRIBUTE, Math.max(MIN_ATTRIBUTE, value));
  const modifier = getModifier(clamped);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setTempValue(clamped);
      setIsValid(true);
    }
  };

  // The field only reports numbers in range; while its text isn't one, saving waits
  const handleSave = () => {
    if (!isValid) return;
    onChange(tempValue);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group border-border bg-card hover:border-character focus-ring relative flex w-24 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-lg border-2 p-4 shadow-sm transition-colors"
        >
          <div className="bg-character absolute top-0 h-1 w-full opacity-50 transition-colors group-hover:opacity-100" />

          {icon && (
            <div className="text-character-flare mb-1 opacity-60 transition-transform duration-300 group-hover:scale-110 group-hover:opacity-100">
              <AppIcon name={icon} variant="game" size={24} />
            </div>
          )}

          <span className="text-label text-muted-foreground mb-1">{label}</span>

          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex flex-col items-center">
                {/* Modificador principal */}
                <span
                  className={cn('mb-2 font-mono text-3xl font-bold', getStatColorClass(modifier))}
                >
                  {modifier >= 0 ? `+${modifier}` : modifier}
                </span>

                {/* Valor de Exibição (Pequeno, na base oval) */}
                <div className="border-border bg-secondary pointer-events-none z-10 mt-[-10px] flex w-14 items-center justify-center rounded-full border px-2 py-0.5">
                  <span className="text-secondary-foreground text-center text-sm font-bold">
                    {clamped}
                  </span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="flex flex-col gap-1 text-sm">
                <p className="font-semibold">{tAttr('modifierCalc')}</p>
                <p className="text-muted-foreground">{rules.formulas.attributeModifier}</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>{t('editAttribute', { label })}</DialogTitle>
          <DialogDescription>{tAttr('adjustValue')}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`attr-${label}`}>{tAttr('baseValue')}</Label>
            <NumberInput
              id={`attr-${label}`}
              min={MIN_ATTRIBUTE}
              max={MAX_ATTRIBUTE}
              value={tempValue}
              onValueChange={setTempValue}
              onValidityChange={setIsValid}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave} disabled={!isValid}>
            {tCommon('save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
