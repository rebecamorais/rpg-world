'use client';

import * as React from 'react';

import { BookOpen, Files, Shield, Sword } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@frontend/components/ui/tabs';

interface CharacterSheetTabsProps {
  statusContent: React.ReactNode;
}

export default function CharacterSheetTabs({ statusContent }: CharacterSheetTabsProps) {
  const t = useTranslations('characters.tabs');
  const tEmpty = useTranslations('characters.emptyStates');

  return (
    <Tabs defaultValue="status" className="w-full">
      <TabsList className="mb-4 flex w-full justify-start overflow-x-auto bg-transparent p-0">
        <TabsTrigger
          value="status"
          className="hover:text-primary data-[state=active]:border-primary flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
        >
          <Shield className="h-4 w-4" />
          {t('status')}
        </TabsTrigger>
        <TabsTrigger
          value="lore"
          className="hover:text-primary data-[state=active]:border-primary flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
        >
          <Files className="h-4 w-4" />
          {t('lore')}
        </TabsTrigger>
        <TabsTrigger
          value="spells"
          className="hover:text-primary data-[state=active]:border-primary flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
        >
          <BookOpen className="h-4 w-4" />
          {t('spells')}
        </TabsTrigger>
        <TabsTrigger
          value="inventory"
          className="hover:text-primary data-[state=active]:border-primary flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
        >
          <Sword className="h-4 w-4" />
          {t('inventory')}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="status" className="min-h-[70vh] w-full focus-visible:ring-0">
        {statusContent}
      </TabsContent>

      <TabsContent value="lore" className="min-h-[70vh] w-full focus-visible:ring-0">
        <div className="text-muted-foreground flex h-[70vh] w-full flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <Files className="mb-4 h-12 w-12 opacity-20" />
          <p>{tEmpty('lore')}</p>
        </div>
      </TabsContent>

      <TabsContent value="spells" className="min-h-[70vh] w-full focus-visible:ring-0">
        <div className="text-muted-foreground flex h-[70vh] w-full flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <BookOpen className="mb-4 h-12 w-12 opacity-20" />
          <p>{tEmpty('spells')}</p>
        </div>
      </TabsContent>

      <TabsContent value="inventory" className="min-h-[70vh] w-full focus-visible:ring-0">
        <div className="text-muted-foreground flex h-[70vh] w-full flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <Sword className="mb-4 h-12 w-12 opacity-20" />
          <p>{tEmpty('inventory')}</p>
        </div>
      </TabsContent>
    </Tabs>
  );
}
