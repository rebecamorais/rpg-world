'use client';

import { useTranslations } from 'next-intl';

import CharacterHeader from '@frontend/components/character/CharacterHeader';
import { SheetFieldset } from '@frontend/components/character/sheet/SheetFieldset';
import AttributesSection from '@frontend/components/character/stats/AttributesSection';
import CombatStatsSection from '@frontend/components/character/stats/CombatStatsSection';
import { DeathSavesCard } from '@frontend/components/character/stats/DeathSavesCard';
import SavingThrowsSection from '@frontend/components/character/stats/SavingThrowsSection';
import SkillsSection from '@frontend/components/character/stats/SkillsSection';
import { VitalsBar } from '@frontend/components/character/stats/VitalsBar';
import { ErrorState } from '@frontend/components/ui/empty-state';
import { useCharacterMeta } from '@frontend/context/CharacterContext';
import { useSheetSource } from '@frontend/hooks/useSheetSource';

/**
 * The Status tab of the character sheet. Each section reads the character from
 * CharacterContext (provided by the sheet layout), so nothing is passed down from here.
 */
export default function StatusView() {
  const { id, error } = useCharacterMeta();
  const { embedded } = useSheetSource(id);
  const t = useTranslations('characters');

  return (
    <div className="flex flex-col gap-6">
      {error && <ErrorState title={t('loadErrorTitle')} description={error} />}

      {/* Phones and tablets: the hit points stay in reach while the sheet scrolls. Not inside the
          party's viewer: there the sheet is a panel, and the combat already shows the HP */}
      {!embedded && <VitalsBar />}

      <CharacterHeader />

      <SheetFieldset>
        {/* Phones: combat first, it is what changes during play. Desktop: two columns. */}
        <div className="grid grid-cols-1 gap-6 [grid-template-areas:'combat'_'side'_'skills'] lg:grid-cols-[280px_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:[grid-template-areas:'side_combat'_'side_skills']">
          <div className="[grid-area:combat]">
            <CombatStatsSection />
          </div>
          <div className="flex flex-col gap-6 [grid-area:side]">
            <DeathSavesCard />
            <SavingThrowsSection />
            <AttributesSection />
          </div>
          <div className="[grid-area:skills]">
            <SkillsSection />
          </div>
        </div>
      </SheetFieldset>
    </div>
  );
}
