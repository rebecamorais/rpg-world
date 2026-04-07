'use client';

import * as React from 'react';

import { useTranslations } from 'next-intl';

import { AppIcon } from '@frontend/components/ui/icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@frontend/components/ui/tabs';

import type { DnD5eCharacter } from '@shared/systems/dnd5e';

import LoreSection from './LoreSection';

interface CharacterSheetTabsProps {
  statusContent: React.ReactNode;
  character: DnD5eCharacter;
  onBasicInfoChange: (field: keyof DnD5eCharacter, value: string) => void;
}

export default function CharacterSheetTabs({
  statusContent,
  character,
  onBasicInfoChange,
}: CharacterSheetTabsProps) {
  const t = useTranslations('characters.tabs');
  const tEmpty = useTranslations('characters.emptyStates');

  return (
    <Tabs defaultValue="status" className="w-full">
      <TabsList className="mb-4 flex w-full justify-start overflow-x-auto bg-transparent p-0">
        <TabsTrigger
          value="status"
          className="hover:text-primary data-[state=active]:border-primary flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
        >
          <AppIcon name="Shield" size={16} />
          {t('status')}
        </TabsTrigger>
        <TabsTrigger
          value="lore"
          className="hover:text-primary data-[state=active]:border-primary flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
        >
          <AppIcon name="Files" size={16} />
          {t('lore')}
        </TabsTrigger>
        <TabsTrigger
          value="spells"
          className="hover:text-primary data-[state=active]:border-primary flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
        >
          <AppIcon name="BookOpen" size={16} />
          {t('spells')}
        </TabsTrigger>
        <TabsTrigger
          value="inventory"
          className="hover:text-primary data-[state=active]:border-primary flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
        >
          <AppIcon name="Sword" size={16} />
          {t('inventory')}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="status" className="min-h-[70vh] w-full focus-visible:ring-0">
        {statusContent}
      </TabsContent>

      <TabsContent value="lore" className="min-h-[70vh] w-full focus-visible:ring-0">
        <LoreSection data={character} onBasicInfoChange={onBasicInfoChange} />
      </TabsContent>

      <TabsContent value="spells" className="min-h-[70vh] w-full focus-visible:ring-0">
        <div className="text-muted-foreground flex h-[70vh] w-full flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <AppIcon name="BookOpen" size={48} className="mb-4 opacity-20" />
          <p>{tEmpty('spells')}</p>
        </div>
      </TabsContent>

      <TabsContent value="inventory" className="min-h-[70vh] w-full focus-visible:ring-0">
        <div className="text-muted-foreground flex h-[70vh] w-full flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <AppIcon name="Sword" size={48} className="mb-4 opacity-20" />
          <p>{tEmpty('inventory')}</p>
        </div>
      </TabsContent>
    </Tabs>
  );
}
