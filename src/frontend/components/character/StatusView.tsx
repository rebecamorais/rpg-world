'use client';

import { useTranslations } from 'next-intl';

import CharacterHeader from '@frontend/components/character/CharacterHeader';
import { SheetFieldset } from '@frontend/components/character/sheet/SheetFieldset';
import AttributesSection from '@frontend/components/character/stats/AttributesSection';
import CombatStatsSection from '@frontend/components/character/stats/CombatStatsSection';
import { DeathSavesCard } from '@frontend/components/character/stats/DeathSavesCard';
import SavingThrowsSection from '@frontend/components/character/stats/SavingThrowsSection';
import SkillsSection from '@frontend/components/character/stats/SkillsSection';
import { ErrorState } from '@frontend/components/ui/empty-state';
import { useCharacterMeta } from '@frontend/context/CharacterContext';

/**
 * The Status tab of the character sheet. Each section reads the character from
 * CharacterContext (provided by the sheet layout), so nothing is passed down from here.
 */
export default function StatusView() {
  const { error } = useCharacterMeta();
  const t = useTranslations('characters');

  return (
    <div className="flex flex-col gap-6">
      {error && <ErrorState title={t('loadErrorTitle')} description={error} />}

      <SheetFieldset>
        <CharacterHeader />

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
