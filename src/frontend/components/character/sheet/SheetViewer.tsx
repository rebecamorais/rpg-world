'use client';

import { useEffect, useMemo, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

import StatusView from '@frontend/components/character/StatusView';
import { Backpack } from '@frontend/components/character/inventory/Backpack';
import { CoinPouch } from '@frontend/components/character/inventory/CoinPouch';
import { LoadingState } from '@frontend/components/shared/LoadingState';
import { EmptyState } from '@frontend/components/ui/empty-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@frontend/components/ui/tabs';
import {
  CharacterProvider,
  useCharacterMeta,
  useCharacterState,
} from '@frontend/context/CharacterContext';
import { type SheetSource, SheetSourceContext } from '@frontend/hooks/useSheetSource';
import { characterTheme } from '@frontend/lib/color-utils';
import { cn } from '@frontend/lib/utils';

import { LoreTab } from './LoreTab';
import { SheetFieldset } from './SheetFieldset';
import { SheetPage } from './SheetPage';
import { SpellsTab } from './SpellsTab';

const TABS = ['status', 'lore', 'spells', 'inventory'] as const;
type Tab = (typeof TABS)[number];

/**
 * Whose sheet the viewer reads, and from where. Always read-only: editing happens on the sheet's
 * own page. The GM reads a player's sheet through the party; anyone reads their own (a player's
 * character, the GM's NPC) from their own sheet.
 */
export type SheetViewerSource = { kind: 'party'; partyId: string } | { kind: 'own' };

function sourceOf(characterId: string, source: SheetViewerSource): SheetSource {
  if (source.kind === 'party') {
    const path = `/parties/${source.partyId}/characters/${characterId}`;
    return {
      readOnly: true,
      partyId: source.partyId,
      apiPath: `/api${path}`,
      pagesPath: path,
      embedded: true,
    };
  }
  return {
    readOnly: true,
    partyId: null,
    apiPath: `/api/characters/${characterId}`,
    pagesPath: `/system/DnD_5e/character/${characterId}`,
    embedded: true,
  };
}

/** The four tabs, switched in place: the viewer never leaves the page it sits on. */
function ViewerTabs() {
  const t = useTranslations('characters');
  const { character } = useCharacterState();
  const { isLoading, error } = useCharacterMeta();
  const [tab, setTab] = useState<Tab>('status');

  if (isLoading) return <LoadingState thematic />;
  if (!character) {
    return <EmptyState icon="Shield" title={error ?? t('notFoundOrNoPermission')} />;
  }

  const theme = characterTheme(character.accentColor);

  return (
    <div className={cn(theme.className, 'flex flex-col gap-4')} style={theme.style}>
      <Tabs value={tab} onValueChange={(value) => setTab(value as Tab)} className="gap-4">
        <TabsList className="self-start">
          {TABS.map((id) => (
            <TabsTrigger key={id} value={id} className="pointer-coarse:min-h-11">
              {t(`tabs.${id}`)}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="status">
          <StatusView />
        </TabsContent>
        <TabsContent value="lore">
          <LoreTab />
        </TabsContent>
        <TabsContent value="spells">
          <SpellsTab />
        </TabsContent>
        <TabsContent value="inventory">
          <SheetPage tab={t('tabs.inventory')}>
            <SheetFieldset>
              <div className="flex flex-col gap-6">
                <CoinPouch />
                <Backpack />
              </div>
            </SheetFieldset>
          </SheetPage>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * A character's whole sheet, read-only, shown inside another page (the party). Same components
 * as the sheet's own page; the SheetSourceContext tells them where to read and that nothing is
 * edited here.
 */
export function SheetViewer({
  characterId,
  source,
}: {
  characterId: string;
  source: SheetViewerSource;
}) {
  const queryClient = useQueryClient();
  // Opened again later: show what changed meanwhile (HP in the combat, a spell learned)
  useEffect(() => {
    void queryClient.invalidateQueries({ queryKey: ['character', characterId] });
  }, [queryClient, characterId]);

  const sheetSource = useMemo(
    () => sourceOf(characterId, source),
    // The source's own fields, not its identity: callers pass a new object on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [characterId, source.kind, source.kind === 'party' ? source.partyId : null],
  );

  return (
    <SheetSourceContext.Provider value={sheetSource}>
      <CharacterProvider characterId={characterId}>
        <ViewerTabs />
      </CharacterProvider>
    </SheetSourceContext.Provider>
  );
}
