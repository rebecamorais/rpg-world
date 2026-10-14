'use client';

import { useTranslations } from 'next-intl';

import CharacterHeader from '@frontend/components/character/CharacterHeader';
import AttributesSection from '@frontend/components/character/stats/AttributesSection';
import CombatStatsSection from '@frontend/components/character/stats/CombatStatsSection';
import PassivePerception from '@frontend/components/character/stats/PassivePerception';
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

      <CharacterHeader />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <PassivePerception />
          <SavingThrowsSection />
          <AttributesSection />
        </div>

        <div className="flex flex-col gap-6">
          <CombatStatsSection />
          <SkillsSection />
        </div>
      </div>
    </div>
  );
}
