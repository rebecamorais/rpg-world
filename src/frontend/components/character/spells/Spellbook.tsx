'use client';

import { useState } from 'react';

import { useTranslations } from 'next-intl';

import { Badge } from '@frontend/components/ui/badge';
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
    <div className="relative flex flex-col md:flex-row">
      <Tabs
        value={activeLevel}
        onValueChange={setActiveLevel}
        orientation="vertical"
        className="bg-card/60 border-border/50 flex h-full w-full flex-col overflow-hidden rounded-xl border backdrop-blur-xl md:flex-row"
      >
        {/* Index Sidebar (Desktop) */}
        <TabsList className="bg-muted/10 relative hidden h-auto w-full flex-row items-center justify-start gap-1 rounded-none border-t border-b px-2 py-2 md:sticky md:top-24 md:flex md:h-fit md:w-56 md:flex-col md:items-start md:border-t-0 md:border-b-0 md:px-0 md:py-6">
          {/* Vertical Divider */}
          <div className="via-border/50 absolute top-0 right-0 bottom-0 hidden w-px bg-gradient-to-b from-transparent to-transparent md:block" />
          <div
            className="absolute top-1/4 right-0 bottom-1/4 hidden w-[2px] bg-gradient-to-b from-transparent to-transparent opacity-40 blur-[1.5px] md:block"
            style={{
              backgroundImage:
                'linear-gradient(to bottom, transparent, var(--character-muted), transparent)',
            }}
          />
          <div className="mb-4 hidden w-full px-6 md:block">
            <div className="text-muted-foreground/40 flex items-center gap-2 text-xs font-black tracking-[0.25em] uppercase">
              <span className="bg-muted-foreground/20 h-px flex-1" />
              {t('spellbookIndex')}
              <span className="bg-muted-foreground/20 h-px flex-1" />
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-1.5 md:w-full md:px-3">
            {levels.map((level) => (
              <TabsTrigger
                key={level}
                value={level.toString()}
                className="group hover:bg-muted/30 data-[state=active]:bg-character-surface data-[state=active]:text-character-flare relative flex w-full items-center justify-start gap-3 rounded-lg border border-transparent px-4 py-3 text-left transition-all duration-300 hover:translate-x-1"
              >
                <div className="bg-character-flare absolute top-2 bottom-2 left-1 w-1.5 origin-center scale-y-0 rounded-full opacity-0 shadow-[0_0_12px_var(--character-flare)] transition-all duration-300 group-data-[state=active]:scale-y-100 group-data-[state=active]:opacity-100" />

                <AppIcon
                  name="Book"
                  size={16}
                  className="opacity-40 transition-opacity group-hover:opacity-80 group-data-[state=active]:opacity-100"
                />
                <span className="font-bold tracking-tight whitespace-nowrap">
                  {level === 0 ? t('cantrips') : t('levelName', { level })}
                </span>

                {/* Spell Count Badge */}
                <div className="bg-muted-foreground/10 text-muted-foreground/50 group-data-[state=active]:bg-character-muted group-data-[state=active]:text-character-flare ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 font-mono text-xs font-black transition-colors">
                  {spellsByLevel[level].length}
                </div>
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

        <div className="relative flex-1">
          <div className="p-6 md:p-8">
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
                    <div className="bg-character-flare h-1 w-12 rounded-full opacity-60" />
                  </div>
                  <Badge
                    variant="outline"
                    className="border-character-muted bg-character-surface text-character-flare w-fit px-3 py-1 font-mono text-xs tracking-widest uppercase"
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
  );
}
