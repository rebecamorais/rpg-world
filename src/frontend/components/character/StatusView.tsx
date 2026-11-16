'use client';

import { useTranslations } from 'next-intl';

import CharacterHeader from '@frontend/components/character/CharacterHeader';
import {
  ResourcesRow,
  useResourcesRowVisible,
} from '@frontend/components/character/resources/ResourcesRow';
import { SheetFieldset } from '@frontend/components/character/sheet/SheetFieldset';
import AttributesSection from '@frontend/components/character/stats/AttributesSection';
import CombatStatsSection from '@frontend/components/character/stats/CombatStatsSection';
import { DeathSavesCard } from '@frontend/components/character/stats/DeathSavesCard';
import ProficienciesSection from '@frontend/components/character/stats/ProficienciesSection';
import SavingThrowsSection from '@frontend/components/character/stats/SavingThrowsSection';
import SkillsSection from '@frontend/components/character/stats/SkillsSection';
import { VitalsBar } from '@frontend/components/character/stats/VitalsBar';
import { ErrorState } from '@frontend/components/ui/empty-state';
import { useCharacterMeta } from '@frontend/context/CharacterContext';
import { useSheetSource } from '@frontend/hooks/useSheetSource';
import { cn } from '@frontend/lib/utils';

/** Tablets have two columns only for the resources and the death saves; the rest takes both. */
const WIDE = 'md:max-lg:col-span-2';

/**
 * The Status tab of the character sheet. Each section reads the character from
 * CharacterContext (provided by the sheet layout), so nothing is passed down from here.
 */
export default function StatusView() {
  const { id, error } = useCharacterMeta();
  const { embedded } = useSheetSource(id);
  const t = useTranslations('characters');
  const rowVisible = useResourcesRowVisible();

  return (
    <div className="flex flex-col gap-6">
      {error && <ErrorState title={t('loadErrorTitle')} description={error} />}

      {/* Phones and tablets: the hit points stay in reach while the sheet scrolls. Not inside the
          party's viewer: there the sheet is a panel, and the combat already shows the HP */}
      {!embedded && <VitalsBar />}

      <CharacterHeader />

      <SheetFieldset>
        {/* Desktop: two columns that stack on their own, so a tall card on one side never opens a
            gap on the other. Below that the columns dissolve and `order` interleaves the cards:
            what changes during play (resources, death saves, combat) comes first. */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="contents lg:flex lg:flex-col lg:gap-6" data-column="side">
            {/* Tablets: beside the resources when there are any */}
            <div className={cn('order-2', !rowVisible && WIDE)}>
              <DeathSavesCard />
            </div>
            <div className={cn('order-4', WIDE)}>
              <SavingThrowsSection />
            </div>
            <div className={cn('order-5', WIDE)}>
              <AttributesSection />
            </div>
          </div>
          <div className="contents lg:flex lg:min-w-0 lg:flex-col lg:gap-6" data-column="main">
            {rowVisible && (
              <div className="order-1">
                <ResourcesRow />
              </div>
            )}
            <div className={cn('order-3', WIDE)}>
              <CombatStatsSection />
            </div>
            <div className={cn('order-6', WIDE)}>
              <SkillsSection />
            </div>
            <div className={cn('order-7', WIDE)}>
              <ProficienciesSection />
            </div>
          </div>
        </div>
      </SheetFieldset>
    </div>
  );
}
