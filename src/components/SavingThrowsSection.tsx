'use client';

import React from 'react';
import { ATTRIBUTE_KEYS, ATTRIBUTE_LABELS } from '@/systems/dnd5e/constants';
import { calculateSavingThrow } from '@/systems/dnd5e/calculations';
import type { AttributeKey } from '@/systems/dnd5e/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface Props {
    attributes: Record<AttributeKey, number>;
    level: number;
    savingThrows: Record<AttributeKey, boolean>;
    onSavingThrowChange: (key: AttributeKey, isProficient: boolean) => void;
}

export default function SavingThrowsSection({ attributes, level, savingThrows, onSavingThrowChange }: Props) {
    return (
        <Card className="bg-[#1a1a1a] border-zinc-800">
            <CardHeader className="py-3 px-4 border-b border-zinc-800 bg-[#121212]/50">
                <CardTitle className="text-sm uppercase tracking-wider text-zinc-400">Salvaguardas</CardTitle>
            </CardHeader>
            <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {ATTRIBUTE_KEYS.map((key) => {
                    const attrVal = attributes[key] ?? 10;
                    const isProficient = savingThrows[key] ?? false;

                    const finalValue = calculateSavingThrow(attrVal, level, isProficient);
                    const sign = finalValue >= 0 ? '+' : '';

                    return (
                        <div key={key} className="flex items-center gap-3 p-1 rounded hover:bg-zinc-800/50 transition-colors group">
                            <button
                                type="button"
                                aria-label={`Proficiência em ${ATTRIBUTE_LABELS[key]}`}
                                onClick={() => onSavingThrowChange(key, !isProficient)}
                                className={cn(
                                    "w-3 h-3 rounded-full flex-shrink-0 transition-all border",
                                    isProficient
                                        ? "bg-[#663399] border-[#663399]"
                                        : "bg-transparent border-zinc-600 group-hover:border-zinc-400"
                                )}
                            />
                            <div className="flex-1 flex justify-between items-center text-sm">
                                <span className={cn(
                                    "font-medium transition-colors",
                                    isProficient ? "text-zinc-100" : "text-zinc-400"
                                )}>
                                    {ATTRIBUTE_LABELS[key]}
                                </span>
                                <span className={cn(
                                    "font-mono font-bold mx-2",
                                    isProficient ? "text-zinc-100" : "text-zinc-500"
                                )}>
                                    {sign}{finalValue}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
