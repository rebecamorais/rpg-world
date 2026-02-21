'use client';

import { ATTRIBUTE_KEYS, ATTRIBUTE_LABELS } from '@/systems/dnd5e/constants';
import { calculateSavingThrow } from '@/systems/dnd5e/calculations';
import type { AttributeKey } from '@/systems/dnd5e/types';

interface Props {
    attributes: Record<AttributeKey, number>;
    level: number;
    savingThrows: Record<AttributeKey, boolean>;
    onSavingThrowChange: (key: AttributeKey, isProficient: boolean) => void;
}

export default function SavingThrowsSection({ attributes, level, savingThrows, onSavingThrowChange }: Props) {
    return (
        <div className="mt-8">
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4">
                Testes de Resistência (Salvaguardas)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {ATTRIBUTE_KEYS.map((key) => {
                    const attrVal = attributes[key] ?? 10;
                    const isProficient = savingThrows[key] ?? false;

                    const finalValue = calculateSavingThrow(attrVal, level, isProficient);
                    const sign = finalValue >= 0 ? '+' : '';

                    return (
                        <div key={key} className="flex items-center justify-between p-2 rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={isProficient}
                                    onChange={(e) => onSavingThrowChange(key, e.target.checked)}
                                    className="rounded border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-indigo-600 focus:ring-indigo-600"
                                    aria-label={`Proficiência em Salvaguarda de ${ATTRIBUTE_LABELS[key]}`}
                                />
                                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{ATTRIBUTE_LABELS[key]}</span>
                            </div>
                            <div className="text-sm font-mono bg-zinc-200 dark:bg-zinc-800 px-2 py-1 rounded">
                                {sign}{finalValue}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
