'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/frontend/components/ui/card';
import { cn } from '@/frontend/lib/utils';
import { calculateSavingThrow } from '@/systems/dnd5e/calculations';
import { ATTRIBUTE_KEYS, ATTRIBUTE_LABELS } from '@/systems/dnd5e/constants';
import type { AttributeKey } from '@/systems/dnd5e/types';

interface Props {
  attributes: Record<AttributeKey, number>;
  level: number;
  savingThrows: Record<AttributeKey, boolean>;
  onSavingThrowChange: (key: AttributeKey, isProficient: boolean) => void;
}

export default function SavingThrowsSection({
  attributes,
  level,
  savingThrows,
  onSavingThrowChange,
}: Props) {
  return (
    <Card className="border-zinc-800 bg-[#1a1a1a]">
      <CardHeader className="border-b border-zinc-800 bg-[#121212]/50 px-4 py-3">
        <CardTitle className="text-sm tracking-wider text-zinc-400 uppercase">
          Salvaguardas
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-2 p-4 sm:grid-cols-2 lg:grid-cols-3">
        {ATTRIBUTE_KEYS.map((key) => {
          const attrVal = attributes[key] ?? 10;
          const isProficient = savingThrows[key] ?? false;

          const finalValue = calculateSavingThrow(attrVal, level, isProficient);
          const sign = finalValue >= 0 ? '+' : '';

          return (
            <div
              key={key}
              className="group flex items-center gap-3 rounded p-1 transition-colors hover:bg-zinc-800/50"
            >
              <button
                type="button"
                aria-label={`Proficiência em ${ATTRIBUTE_LABELS[key]}`}
                onClick={() => onSavingThrowChange(key, !isProficient)}
                className={cn(
                  'h-3 w-3 flex-shrink-0 rounded-full border transition-all',
                  isProficient
                    ? 'border-primary bg-primary'
                    : 'border-zinc-600 bg-transparent group-hover:border-zinc-400',
                )}
              />
              <div className="flex flex-1 items-center justify-between text-sm">
                <span
                  className={cn(
                    'font-medium transition-colors',
                    isProficient ? 'text-zinc-100' : 'text-zinc-400',
                  )}
                >
                  {ATTRIBUTE_LABELS[key]}
                </span>
                <span
                  className={cn(
                    'mx-2 font-mono font-bold',
                    isProficient ? 'text-zinc-100' : 'text-zinc-500',
                  )}
                >
                  {sign}
                  {finalValue}
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
