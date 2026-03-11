'use client';

import { BookOpen, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Card, CardContent } from '@frontend/components/ui/card';

interface KnownSpellsCardProps {
  spellsKnown: string[];
  onForgetSpell: (spellIndex: string) => void;
}

export default function KnownSpellsCard({ spellsKnown, onForgetSpell }: KnownSpellsCardProps) {
  const t = useTranslations('characters');

  if (!spellsKnown || spellsKnown.length === 0) return null;

  return (
    <Card className="border-border bg-card shadow-md">
      <CardContent className="p-4">
        <h3 className="text-foreground mb-3 flex items-center gap-2 text-sm font-bold tracking-wider uppercase">
          <BookOpen size={16} className="text-primary" />
          {t('preparedSpells')}
        </h3>
        <div className="flex flex-wrap gap-2">
          {spellsKnown.map((spellIndex: string) => (
            <div
              key={spellIndex}
              className="bg-secondary text-secondary-foreground border-border flex items-center gap-1 rounded-full border py-1 pr-1 pl-3"
            >
              <span className="text-sm font-medium capitalize">
                {spellIndex.replace(/-/g, ' ')}
              </span>
              <button
                onClick={() => onForgetSpell(spellIndex)}
                className="text-muted-foreground rounded-full p-1 transition-colors hover:bg-red-500/10 hover:text-red-500"
                title={t('forgetSpell')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
