'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';
import { HealthBar } from '@frontend/components/ui/health-bar';
import { useCharacterMeta, useLoadedCharacter } from '@frontend/context/CharacterContext';
import { useSheetSource } from '@frontend/hooks/useSheetSource';

import { calculatePassivePerception } from '@shared/systems/dnd5e/calculations';

import { AdjustHitPoints } from './AdjustHitPoints';

const signed = (n: number) => (n >= 0 ? `+${n}` : `${n}`);

/**
 * The numbers asked for during a fight, kept at the top of the screen while the sheet scrolls
 * (phones and tablets; on a desktop the combat card is already in view), with "Adjust HP" next to
 * the hit points, except on a sheet that is only read.
 */
export function VitalsBar() {
  const t = useTranslations('combatStats');
  const tCharacters = useTranslations('characters');
  const character = useLoadedCharacter();
  const { id } = useCharacterMeta();
  const { readOnly } = useSheetSource(id);
  const temp = character.hpTemp ?? 0;

  const stats = [
    { label: t('armorClass'), title: t('armorClass'), value: String(character.ac ?? 0) },
    { label: t('initiative'), title: t('initiative'), value: signed(character.initiative ?? 0) },
    {
      label: t('speedShort'),
      title: t('speed'),
      value: `${character.speed ?? 30}${t('speedUnit')}`,
    },
    {
      label: t('passivePerceptionShort'),
      title: tCharacters('passivePerception'),
      value: String(
        calculatePassivePerception(
          character.attributes.WIS ?? 10,
          character.level,
          character.skills?.PERCEPTION?.isProficient ?? false,
          character.skills?.PERCEPTION?.expertise ?? false,
        ),
      ),
    },
  ];

  return (
    <section
      data-scroll-pad="vitals"
      aria-label={t('summary')}
      className="border-border bg-card/95 sticky top-0 z-30 -mx-1 flex flex-col gap-3 rounded-xl border p-3 shadow-lg backdrop-blur-md lg:hidden"
    >
      <div className="flex items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="flex items-baseline justify-between gap-2">
            <span className="text-label text-danger-flare">{t('hitPointsShort')}</span>
            <span className="text-foreground font-mono text-xl font-bold tabular-nums">
              {character.hpCurrent}
              <span className="text-muted-foreground text-sm"> / {character.hpMax}</span>
              {temp > 0 && <span className="text-warning-flare text-sm"> +{temp}</span>}
            </span>
          </p>
          <HealthBar current={character.hpCurrent} max={character.hpMax || 1} temp={temp} />
        </div>
        {!readOnly && (
          <AdjustHitPoints>
            <Button variant="outline" className="h-11 shrink-0">
              {t('adjustHp')}
            </Button>
          </AdjustHitPoints>
        )}
      </div>

      <dl className="grid grid-cols-4 gap-2">
        {stats.map(({ label, title, value }) => (
          <div
            key={label}
            className="bg-muted/40 flex min-w-0 flex-col items-center rounded-md py-1"
          >
            <dt className="text-muted-foreground w-full truncate text-center text-xs">
              {/* The short label on screen, the full name for screen readers */}
              <span aria-hidden="true">{label}</span>
              <span className="sr-only">{title}</span>
            </dt>
            <dd className="text-foreground font-mono text-base font-bold tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
