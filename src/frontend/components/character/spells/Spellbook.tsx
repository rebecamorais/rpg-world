'use client';

import React, { useState } from 'react';

import {
  AudioLines,
  Book,
  Brain,
  ChevronDown,
  ChevronUp,
  Hand,
  Hourglass,
  Package,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Badge } from '@frontend/components/ui/badge';
import { Card, CardContent } from '@frontend/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@frontend/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@frontend/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@frontend/components/ui/tooltip';
import type { CharacterSpell } from '@frontend/hooks/useCharacterSpells';
import { cn } from '@frontend/lib/utils';

interface SpellbookProps {
  characterSpells: CharacterSpell[];
  onForgetSpell?: (spellId: string) => void;
  onTogglePrepared?: (spellId: string, isPrepared: boolean) => void;
}

export function Spellbook({ characterSpells, onForgetSpell, onTogglePrepared }: SpellbookProps) {
  const t = useTranslations('characters');
  const tData = useTranslations('spellsData');
  const [expandedSpellId, setExpandedSpellId] = useState<string | null>(null);

  // Group spells by level
  const spellsByLevel =
    characterSpells?.reduce(
      (acc, spell) => {
        const level = spell.level;
        if (!acc[level]) acc[level] = [];
        acc[level].push(spell);
        return acc;
      },
      {} as Record<number, CharacterSpell[]>,
    ) || {};

  const levels = Object.keys(spellsByLevel)
    .map(Number)
    .sort((a, b) => a - b);

  const [activeLevel, setActiveLevel] = useState<string>(levels[0]?.toString() || '0');

  if (!characterSpells || characterSpells.length === 0) return null;

  const toggleExpand = (spellId: string) => {
    setExpandedSpellId(expandedSpellId === spellId ? null : spellId);
  };

  return (
    <Card className="border-border/50 bg-background/40 overflow-hidden shadow-2xl backdrop-blur-xl">
      <div className="flex h-[700px] flex-col overflow-hidden md:flex-row">
        <Tabs
          value={activeLevel}
          onValueChange={setActiveLevel}
          orientation="vertical"
          className="flex h-full w-full flex-col md:flex-row"
        >
          {/* Index Sidebar (Desktop) */}
          <TabsList className="bg-muted/10 hidden h-auto w-full flex-row items-center justify-start gap-1 rounded-none border-t border-b px-2 py-2 md:flex md:h-full md:w-64 md:flex-col md:border-t-0 md:border-r md:border-b-0 md:px-0 md:py-6">
            <div className="text-muted-foreground/60 mb-4 hidden px-4 text-[10px] font-black tracking-[0.2em] uppercase md:block">
              {t('spellbookIndex')}
            </div>
            <div className="scrollbar-none flex flex-1 flex-col gap-1 md:w-full md:overflow-y-auto md:px-2">
              {levels.map((level) => (
                <TabsTrigger
                  key={level}
                  value={level.toString()}
                  className="hover:bg-muted/50 data-[state=active]:border-primary/20 data-[state=active]:bg-primary/10 data-[state=active]:text-primary flex items-center gap-3 rounded-lg border border-transparent px-4 py-2.5 text-left transition-all"
                >
                  <Book size={14} className="opacity-70" />
                  <span className="font-bold tracking-tight whitespace-nowrap">
                    {level === 0 ? t('cantrips') : t('levelName', { level })}
                  </span>
                </TabsTrigger>
              ))}
            </div>
          </TabsList>

          {/* Mobile Select (Replaces TabsList on sm screens) */}
          <div className="border-border/50 bg-muted/10 flex items-center justify-between gap-4 border-b p-4 md:hidden">
            <span className="text-muted-foreground text-xs font-black tracking-widest whitespace-nowrap uppercase">
              {t('spellbookIndex')}
            </span>
            <Select value={activeLevel} onValueChange={setActiveLevel}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o nível" />
              </SelectTrigger>
              <SelectContent>
                {levels.map((level) => (
                  <SelectItem key={level} value={level.toString()}>
                    {level === 0 ? t('cantrips') : t('levelName', { level })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Spell Content Area */}
          <div className="relative flex-1 overflow-hidden">
            <div className="[scrollbar-color:theme(colors.primary.DEFAULT/20)_transparent] [&::-webkit-scrollbar-thumb]:bg-primary/20 h-full overflow-y-auto px-6 py-8 [scrollbar-width:thin] md:px-10 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
              {levels.map((level) => (
                <TabsContent
                  key={level}
                  value={level.toString()}
                  className="m-0 border-none p-0 focus-visible:ring-0"
                >
                  <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-col gap-1">
                      <h2 className="font-serif text-3xl font-black tracking-tight text-white md:text-4xl">
                        {level === 0 ? t('cantrips') : t('levelSpells', { level })}
                      </h2>
                      <div className="bg-primary/40 h-1 w-12 rounded-full" />
                    </div>
                    <Badge
                      variant="outline"
                      className="border-primary/20 bg-primary/5 text-primary w-fit px-3 py-1 font-mono text-[10px] tracking-widest uppercase"
                    >
                      {spellsByLevel[level].length} {t('spellsFound')}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 gap-3 pb-12">
                    {spellsByLevel[level]
                      .sort((a, b) => {
                        // First: Prepared spells
                        if (a.isPrepared && !b.isPrepared) return -1;
                        if (!a.isPrepared && b.isPrepared) return 1;
                        // Second: Alphabetical order
                        return a.name.localeCompare(b.name);
                      })
                      .map((spell) => (
                        <div
                          key={spell.spellId}
                          className={cn(
                            'group relative flex flex-col rounded-xl border transition-all duration-300',
                            expandedSpellId === spell.spellId
                              ? 'bg-card border-primary/30 ring-primary/10 shadow-lg ring-1'
                              : 'bg-card/50 border-border/50 hover:border-primary/20 hover:bg-card/80 shadow-sm',
                          )}
                        >
                          {/* Spell Header/Summary */}
                          <div
                            className="flex cursor-pointer items-center justify-between p-4"
                            onClick={() => toggleExpand(spell.spellId)}
                          >
                            <div className="flex flex-1 items-center gap-4">
                              <div
                                className={cn(
                                  'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                                  spell.isPrepared
                                    ? 'bg-primary/10 text-primary'
                                    : 'bg-muted text-muted-foreground',
                                )}
                              >
                                <Zap
                                  size={20}
                                  className={spell.isPrepared ? 'animate-pulse' : ''}
                                />
                              </div>

                              <div className="flex flex-col gap-0.5">
                                <span className="text-foreground group-hover:text-primary text-base font-bold transition-colors">
                                  {spell.name}
                                </span>
                                <div className="flex items-center gap-3">
                                  <span className="text-muted-foreground flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase">
                                    <Zap size={10} className="text-primary" />
                                    <span className="text-white/80">
                                      {spell.castingTime || '1 Action'}
                                    </span>
                                  </span>
                                  <span className="text-muted-foreground/60 text-[10px] font-medium tracking-wider uppercase">
                                    {tData(`schools.${spell.school.toLowerCase()}`)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              {/* Component Icons */}
                              <TooltipProvider>
                                <div className="flex items-center gap-1.5">
                                  {spell.components?.includes('V') && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div
                                          className={cn(
                                            'relative flex h-7 w-7 items-center justify-center rounded-full border border-blue-500/20 bg-blue-500/10 text-blue-400',
                                            spell.name.toLowerCase() === 'silence' &&
                                              'border-red-500/20 bg-red-500/10 text-red-500',
                                          )}
                                        >
                                          <AudioLines size={14} />
                                          {spell.name.toLowerCase() === 'silence' && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                              <div className="absolute h-[2px] w-4 rotate-45 bg-red-500 shadow-sm" />
                                              <div className="absolute h-[2px] w-4 -rotate-45 bg-red-500 shadow-sm" />
                                            </div>
                                          )}
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        Vocal{' '}
                                        {spell.name.toLowerCase() === 'silence'
                                          ? '(Silenciada)'
                                          : ''}
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                  {spell.components?.includes('S') && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-orange-500/20 bg-orange-500/10 text-orange-400">
                                          <Hand size={14} />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>Somático</TooltipContent>
                                    </Tooltip>
                                  )}
                                  {spell.components?.includes('M') && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div
                                          className={cn(
                                            'flex h-7 w-7 items-center justify-center rounded-full border',
                                            (spell.materialCost || 0) > 0
                                              ? 'border-amber-500/40 bg-amber-500/20 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.1)]'
                                              : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400',
                                          )}
                                        >
                                          <Package size={14} />
                                        </div>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        Material{' '}
                                        {(spell.materialCost || 0) > 0
                                          ? `(${spell.materialCost}gp)`
                                          : ''}
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              </TooltipProvider>

                              {/* Dropdown/Expand Icon */}
                              <div className="text-muted-foreground/60 group-hover:text-primary ml-2 transition-colors">
                                {expandedSpellId === spell.spellId ? (
                                  <ChevronUp size={20} />
                                ) : (
                                  <ChevronDown size={20} />
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Badges Row */}
                          <div className="flex items-center gap-2 px-4 pb-3">
                            {spell.concentration && (
                              <Badge
                                variant="secondary"
                                className="h-6 gap-1.5 border-purple-500/30 bg-purple-600/20 px-2 text-[10px] font-black tracking-wider text-purple-300 uppercase hover:bg-purple-600/30"
                              >
                                <Brain size={12} className="fill-purple-400/20" />
                                {t('concentration')}
                              </Badge>
                            )}
                            {spell.ritual && (
                              <Badge
                                variant="secondary"
                                className="h-6 gap-1.5 border-sky-500/30 bg-sky-600/20 px-2 text-[10px] font-black tracking-wider text-sky-300 uppercase hover:bg-sky-600/30"
                              >
                                <Hourglass size={12} className="fill-sky-400/20" />
                                {t('ritual')}
                              </Badge>
                            )}
                            {spell.isScaling && (
                              <Badge
                                variant="secondary"
                                className="h-6 gap-1.5 border-amber-500/30 bg-amber-600/20 px-2 text-[10px] font-black tracking-wider text-amber-300 uppercase hover:bg-amber-600/30"
                              >
                                <Sparkles size={12} className="fill-amber-400/20" />
                                {t('upcasting')}
                              </Badge>
                            )}
                            {(spell.materialCost || 0) > 0 && (
                              <Badge
                                variant="default"
                                className="h-6 gap-1.5 bg-amber-500 px-2 text-[10px] font-black tracking-wider text-black uppercase shadow-sm"
                              >
                                {spell.materialCost} GP
                              </Badge>
                            )}
                          </div>

                          {/* Expanded Content (The "Page") */}
                          {expandedSpellId === spell.spellId && (
                            <div className="border-border/50 bg-muted/20 animate-in fade-in slide-in-from-top-2 border-t p-6 duration-300">
                              <div className="prose prose-sm prose-invert max-w-none">
                                <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap italic">
                                  {spell.description}
                                </p>

                                {spell.material && (
                                  <div className="mt-4 rounded-lg border border-orange-500/10 bg-orange-500/5 p-3">
                                    <span className="mb-1 block text-xs font-bold tracking-tighter text-orange-500 uppercase">
                                      {t('components')}
                                    </span>
                                    <span className="text-muted-foreground text-xs">
                                      {spell.material}
                                    </span>
                                  </div>
                                )}

                                {spell.higherLevel && (
                                  <div className="bg-primary/5 border-primary/10 mt-4 rounded-lg border p-3">
                                    <div className="mb-1 flex items-center gap-2">
                                      <Sparkles size={12} className="text-primary" />
                                      <span className="text-primary text-xs font-bold tracking-tighter uppercase">
                                        {t('atHigherLevels')}
                                      </span>
                                    </div>
                                    <p className="text-muted-foreground text-xs whitespace-pre-wrap">
                                      {spell.higherLevel}
                                    </p>

                                    {/* Placeholder for Slot Scaling Table if isScaling is true */}
                                    {spell.isScaling && (
                                      <div className="border-border/50 mt-3 overflow-hidden rounded-md border text-[10px]">
                                        <table className="w-full text-left">
                                          <thead className="bg-muted/50">
                                            <tr>
                                              <th className="px-2 py-1 font-bold">
                                                {t('slotLevel')}
                                              </th>
                                              <th className="px-2 py-1 font-bold">
                                                {t('estimatedEffect')}
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-border/50 divide-y">
                                            {[...Array(9)].map((_, i) => {
                                              const slotLevel = i + 1;
                                              if (slotLevel <= spell.level) return null;
                                              return (
                                                <tr key={slotLevel} className="hover:bg-muted/30">
                                                  <td className="px-2 py-1 font-medium">
                                                    {slotLevel}º
                                                  </td>
                                                  <td className="text-muted-foreground px-2 py-1">
                                                    {/* Generic indicator for now, since specific math is complex */}
                                                    +{slotLevel - spell.level} {t('scalingBonus')}
                                                  </td>
                                                </tr>
                                              );
                                            })}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Action buttons (Responsive layout) */}
                              <div className="mt-6 flex flex-col justify-end gap-3 sm:flex-row">
                                <button
                                  onClick={() => onForgetSpell?.(spell.spellId)}
                                  className="w-full rounded-md px-3 py-3 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10 hover:text-red-600 sm:w-auto sm:py-1.5 sm:text-xs"
                                >
                                  {t('forgetSpell')}
                                </button>
                                <button
                                  onClick={() =>
                                    onTogglePrepared?.(spell.spellId, !spell.isPrepared)
                                  }
                                  className={cn(
                                    'w-full rounded-md px-4 py-3 text-sm font-bold shadow-sm transition-all sm:w-auto sm:py-1.5 sm:text-xs',
                                    spell.isPrepared
                                      ? 'bg-muted text-foreground hover:bg-muted/80'
                                      : 'bg-primary hover:bg-primary/90 text-white',
                                  )}
                                >
                                  {spell.isPrepared ? t('unprepareSpell') : t('prepareSpell')}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </TabsContent>
              ))}
            </div>
          </div>
        </Tabs>
      </div>
    </Card>
  );
}
