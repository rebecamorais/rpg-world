'use client';

import { useTranslations } from 'next-intl';

import { CharacterPortrait } from '@frontend/components/character/CharacterPortrait';
import { SheetBackdrop } from '@frontend/components/character/sheet/SheetBackdrop';
import { Progress } from '@frontend/components/ui/progress';
import { useLoadedCharacter } from '@frontend/context/CharacterContext';
import { useCharacterChoices } from '@frontend/hooks/useCharacterChoices';

/** A piece of the sheet as it looks with the unsaved choices. Decorative: nothing here is edited. */
export function AppearancePreview() {
  const t = useTranslations('characterAppearance');
  const tSheet = useTranslations('characterHeader');
  const tCombat = useTranslations('combatStats');
  const { classLabel } = useCharacterChoices();
  const {
    name,
    class: characterClass,
    level,
    avatarUrl,
    sheetBackgroundUrl,
    hpCurrent,
    hpMax,
    ac,
    initiative,
  } = useLoadedCharacter();

  return (
    <section
      aria-label={t('preview')}
      className="border-border bg-background relative isolate overflow-hidden rounded-xl border p-3"
    >
      {sheetBackgroundUrl && <SheetBackdrop url={sheetBackgroundUrl} />}
      <p className="text-label text-muted-foreground mb-3">{t('preview')}</p>
      <div className="bg-card border-border flex flex-col gap-3 rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <CharacterPortrait
            avatarUrl={avatarUrl}
            characterClass={characterClass}
            className="h-14 w-14 lg:h-20 lg:w-20"
          />
          <div className="min-w-0">
            <p className="text-title text-character-flare truncate">{name}</p>
            <p className="text-caption text-muted-foreground truncate">
              {[characterClass && classLabel(characterClass), `${tSheet('level')} ${level}`]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
        </div>
        <Progress
          aria-hidden="true"
          value={hpMax > 0 ? (hpCurrent / hpMax) * 100 : 0}
          className="h-2"
          indicatorClassName="bg-character"
        />
        {/* Phones: the preview stays on screen over the controls, so it's kept short */}
        <dl className="hidden grid-cols-3 gap-2 text-center lg:grid">
          {[
            [tCombat('armorClass'), ac],
            [tCombat('hitPointsShort'), `${hpCurrent}/${hpMax}`],
            [tCombat('initiative'), initiative],
          ].map(([label, value]) => (
            <div key={label} className="border-border flex flex-col-reverse rounded-md border p-2">
              <dt className="text-caption text-muted-foreground">{label}</dt>
              <dd className="text-character-flare font-mono text-sm font-bold">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
