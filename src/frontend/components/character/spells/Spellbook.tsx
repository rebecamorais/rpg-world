'use client';

import React, { useState } from 'react';

import { useTranslations } from 'next-intl';

import { Badge } from '@frontend/components/ui/badge';
import { Card } from '@frontend/components/ui/card';
import { AppIcon } from '@frontend/components/ui/icon';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@frontend/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@frontend/components/ui/tabs';
import type { CharacterSpell } from '@frontend/hooks/useCharacterSpells';

import { SpellCard } from './SpellCard';

interface SpellbookProps {
  characterSpells: CharacterSpell[];
  onForgetSpell?: (id: string) => void;
  onTogglePrepared?: (id: string, isPrepared: boolean) => void;
}

export function Spellbook({ characterSpells, onForgetSpell, onTogglePrepared }: SpellbookProps) {
  const t = useTranslations('characters');
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

  const toggleExpand = (id: string) => {
    setExpandedSpellId(expandedSpellId === id ? null : id);
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
                  <AppIcon name="Book" size={14} className="opacity-70" />
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

                  <div className="grid grid-cols-1 gap-4 pb-12">
                    {spellsByLevel[level]
                      .sort((a, b) => {
                        if (a.isPrepared && !b.isPrepared) return -1;
                        if (!a.isPrepared && b.isPrepared) return 1;
                        return a.name.localeCompare(b.name);
                      })
                      .map((spell) => (
                        <SpellCard
                          key={spell.id}
                          spell={spell}
                          isExpanded={expandedSpellId === spell.id}
                          onClick={() => toggleExpand(spell.id)}
                          onForgetSpell={onForgetSpell}
                          onTogglePrepared={onTogglePrepared}
                        />
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
