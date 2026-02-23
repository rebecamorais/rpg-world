'use client';

import { BookOpen } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Card, CardContent } from '@/frontend/components/ui/card';
import { Input } from '@/frontend/components/ui/input';
import type { DnD5eCharacter } from '@/systems/dnd5e/types';

interface Props {
  name: string;
  classNameStr: string;
  level: number;
  race: string;
  pb: number;
  onBasicInfoChange: (
    field: keyof DnD5eCharacter,
    value: string | number,
  ) => void;
  onOpenSpells: () => void;
}

export default function CharacterHeader({
  name,
  classNameStr,
  level,
  race,
  pb,
  onBasicInfoChange,
  onOpenSpells,
}: Props) {
  const t = useTranslations('characterHeader');
  return (
    <Card className="border-border bg-card">
      <CardContent className="flex flex-col p-0 md:flex-row">
        <div className="flex flex-col justify-end border-b border-zinc-800 p-6 md:w-2/3 md:border-r md:border-b-0">
          <Input
            value={name || ''}
            onChange={(e) => onBasicInfoChange('name', e.target.value)}
            className="focus-visible:border-primary h-auto rounded-none border-transparent bg-transparent px-0 text-3xl font-bold focus-visible:border-b focus-visible:ring-0"
            placeholder={t('namePlaceholder')}
          />
          <div className="mt-2 flex gap-4">
            <div className="text-muted-foreground text-sm">
              {t('proficiencyBonus')}:{' '}
              <span className="text-primary font-bold">+{pb}</span>
            </div>
          </div>
        </div>
        <div className="bg-muted grid grid-cols-2 gap-4 p-6 md:w-1/3">
          <div>
            <label className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
              {t('class')}
            </label>
            <Input
              value={classNameStr || ''}
              onChange={(e) => onBasicInfoChange('class', e.target.value)}
              className="focus-visible:border-primary h-7 rounded-none border-b border-zinc-800 bg-transparent px-1 py-0 text-sm focus-visible:ring-0"
            />
          </div>
          <div>
            <label className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
              {t('level')}
            </label>
            <Input
              type="number"
              min={1}
              value={level || 1}
              onChange={(e) =>
                onBasicInfoChange('level', parseInt(e.target.value) || 1)
              }
              className="focus-visible:border-primary h-7 rounded-none border-b border-zinc-800 bg-transparent px-1 py-0 text-sm focus-visible:ring-0"
            />
          </div>
          <div className="col-span-2">
            <label className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
              {t('race')}
            </label>
            <Input
              value={race || ''}
              onChange={(e) => onBasicInfoChange('race', e.target.value)}
              className="focus-visible:border-primary h-7 rounded-none border-b border-zinc-800 bg-transparent px-1 py-0 text-sm focus-visible:ring-0"
            />
          </div>
          <div className="col-span-2 mt-2">
            <button
              onClick={onOpenSpells}
              className="border-primary/30 bg-primary/10 hover:bg-primary/20 flex w-full items-center justify-center gap-2 rounded border py-2 text-xs font-semibold text-[#be8be8] transition-colors"
            >
              <BookOpen size={14} />
              {t('spellbook')}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
