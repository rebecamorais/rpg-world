'use client';

import React from 'react';

import { BookMarked, BookOpen, Sparkles, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Card, CardContent } from '@frontend/components/ui/card';
import type { CharacterSpell } from '@frontend/hooks/useCharacterSpells';

interface KnownSpellsCardProps {
  characterSpells: CharacterSpell[];
  onForgetSpell: (id: string) => void;
  onTogglePrepared: (id: string, isPrepared: boolean) => void;
}

function KnownSpellsCard({
  characterSpells,
  onForgetSpell,
  onTogglePrepared,
}: KnownSpellsCardProps) {
  const t = useTranslations('characters');
  const tData = useTranslations('spellsData');

  if (!characterSpells || characterSpells.length === 0) return null;

  const preparedCount = characterSpells.filter((s) => s.isPrepared).length;
  const totalCount = characterSpells.length;

  // Sort: prepared spells first, then alphabetical by translated name
  const sortedSpells = [...characterSpells].sort((a, b) => {
    if (a.isPrepared !== b.isPrepared) return a.isPrepared ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <Card className="border-border bg-card shadow-md">
      <CardContent className="p-4">
        {/* Header with counter */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-foreground flex items-center gap-2 text-sm font-bold tracking-wider uppercase">
            <BookOpen size={16} className="text-primary" />
            {t('preparedSpells')}
          </h3>
          <div className="bg-primary/10 text-primary flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
            <Sparkles size={12} />
            <span>
              {preparedCount}/{totalCount}
            </span>
          </div>
        </div>

        {/* Spell list */}
        <ul className="space-y-2">
          {sortedSpells.map((spell) => (
            <li
              key={spell.id}
              className={`flex items-center justify-between rounded-lg border p-3 transition-all ${
                spell.isPrepared
                  ? 'border-primary/30 bg-primary/5 shadow-sm'
                  : 'border-border bg-secondary/30'
              }`}
            >
              {/* Spell info */}
              <div className="flex flex-col gap-0.5">
                <span
                  className={`text-sm font-semibold ${
                    spell.isPrepared ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {spell.name}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-[10px] font-medium uppercase">
                    {spell.level === 0 ? t('cantrip') : t('levelDetail', { level: spell.level })}
                  </span>
                  <span className="bg-muted/50 text-muted-foreground rounded-full px-1.5 py-0.5 text-[10px] lowercase">
                    {tData(`schools.${spell.school.toLowerCase()}`)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {/* Toggle preparation */}
                <button
                  onClick={() => onTogglePrepared(spell.id, !spell.isPrepared)}
                  className={`rounded-md p-1.5 transition-all ${
                    spell.isPrepared
                      ? 'bg-primary/15 text-primary hover:bg-primary/25'
                      : 'text-muted-foreground hover:bg-primary/10 hover:text-primary'
                  }`}
                  title={spell.isPrepared ? t('unprepareSpell') : t('prepareSpell')}
                >
                  {spell.isPrepared ? (
                    <BookMarked className="h-4 w-4" />
                  ) : (
                    <BookOpen className="h-4 w-4" />
                  )}
                </button>

                {/* Forget spell */}
                <button
                  onClick={() => onForgetSpell(spell.id)}
                  className="text-muted-foreground rounded-md p-1.5 transition-colors hover:bg-red-500/10 hover:text-red-500"
                  title={t('forgetSpell')}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export default React.memo(KnownSpellsCard);
