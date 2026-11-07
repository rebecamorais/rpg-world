'use client';

import { useState } from 'react';

import { useTranslations } from 'next-intl';

import { CharacterPortrait } from '@frontend/components/character/CharacterPortrait';
import { ChoiceSelect } from '@frontend/components/character/ChoiceSelect';
import { Card, CardContent } from '@frontend/components/ui/card';
import { FieldLabel, InlineField } from '@frontend/components/ui/field';
import { NumberInput } from '@frontend/components/ui/number-input';
import { NumberStepper } from '@frontend/components/ui/number-stepper';
import { Progress } from '@frontend/components/ui/progress';
import {
  BACKGROUND_ICONS,
  CLASS_ICONS,
  CharacterAlignment,
  CharacterBackground,
  CharacterRace,
  RACE_ICONS,
} from '@frontend/constants/character-choices';
import {
  useCharacterActions,
  useCharacterMeta,
  useLoadedCharacter,
} from '@frontend/context/CharacterContext';
import { useCharacterChoices } from '@frontend/hooks/useCharacterChoices';
import { useSheetSource } from '@frontend/hooks/useSheetSource';
import { CharacterClass } from '@frontend/types/spells';

import { getProficiencyBonus } from '@shared/systems/dnd5e/calculations';

import { ImageViewerDialog } from '../shared/ImageViewerDialog';
import { AdjustableAvatarViewer } from './AdjustableAvatarViewer';
import { SheetFieldset } from './sheet/SheetFieldset';

/** Same limit as the API's character schema, so a save never fails on length. */
const TEXT_MAX = 100;

export default function CharacterHeader() {
  const {
    name,
    class: classNameStr,
    level,
    race,
    background,
    alignment,
    xp = 0,
    avatarUrl,
  } = useLoadedCharacter();
  const { update } = useCharacterActions();
  const { id } = useCharacterMeta();
  // Read only (the GM): no customizing; the fields are off through SheetFieldset
  const { readOnly } = useSheetSource(id);
  const pb = getProficiencyBonus(level);
  const t = useTranslations('characterHeader');
  const choices = useCharacterChoices();
  const tImage = useTranslations('avatarUpload');
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // Simple XP progress calculation
  const xpThresholds = [
    0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000,
    165000, 195000, 225000, 265000, 305000, 355000,
  ];
  const currentLevelXp = xpThresholds[level - 1] || 0;
  const nextLevelXp = xpThresholds[level] || xpThresholds[xpThresholds.length - 1];
  const progress = Math.min(
    100,
    Math.max(0, ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100),
  );

  return (
    <Card className="overflow-hidden shadow-sm">
      <CardContent className="flex flex-col gap-6 p-6 md:flex-row md:items-start">
        <div className="relative self-start">
          {/* The button sits over the avatar instead of wrapping it: the initials would be its
              visible text and not match the aria-label (WCAG 2.5.3). The avatar is hidden from
              screen readers: the h1 already names the character */}
          <div className="relative rounded-lg transition-transform has-[button:active]:scale-95 has-[button:hover]:scale-105">
            <CharacterPortrait
              avatarUrl={avatarUrl}
              characterClass={classNameStr}
              className="h-28 w-28 shrink-0 md:h-32 md:w-32"
            />
            {avatarUrl ? (
              <button
                type="button"
                onClick={() => setIsViewerOpen(true)}
                aria-label={tImage('view')}
                className="focus-ring absolute inset-0 cursor-zoom-in rounded-lg"
              />
            ) : null}
            {readOnly ? (
              <ImageViewerDialog
                src={avatarUrl}
                alt={name}
                open={isViewerOpen}
                onOpenChange={setIsViewerOpen}
              />
            ) : (
              <AdjustableAvatarViewer
                characterId={id}
                src={avatarUrl}
                alt={name}
                open={isViewerOpen}
                onOpenChange={setIsViewerOpen}
              />
            )}
          </div>
        </div>

        {/* The fields only: the image can be viewed on a read-only sheet too */}
        <SheetFieldset>
          <div className="grid flex-1 grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Left Column: Core Stats */}
            <div className="flex flex-col gap-4">
              {/* The name is the page's h1 (SheetPage); here it is edited like the other fields */}
              <InlineField
                id="char-name"
                maxLength={TEXT_MAX}
                label={t('name')}
                value={name || ''}
                onChange={(e) => update({ name: e.target.value })}
                placeholder={t('namePlaceholder')}
                className="text-heading"
              />

              {/* Level & PB Row */}
              <div className="flex items-center gap-6">
                <div className="flex shrink-0 items-center gap-2">
                  <FieldLabel htmlFor="char-level">{t('level')}</FieldLabel>
                  <NumberStepper
                    id="char-level"
                    min={1}
                    max={20}
                    value={level || 1}
                    onChange={(val) => update({ level: val })}
                    size="sm"
                    containerClassName="py-0 gap-2"
                  />
                </div>

                <div className="flex flex-1 items-center gap-2">
                  <span className="text-label text-muted-foreground whitespace-nowrap">
                    {t('proficiencyBonus')}
                  </span>
                  <div className="bg-muted/40 text-character-flare flex h-8 min-w-8 items-center justify-center rounded-md px-2 font-mono text-sm font-bold">
                    +{pb}
                  </div>
                </div>
              </div>

              {/* XP Section */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <FieldLabel htmlFor="char-xp">{t('xp')}</FieldLabel>
                  <div className="flex items-center gap-1 text-xs font-medium">
                    <NumberInput
                      ghost
                      id="char-xp"
                      min={0}
                      max={10_000_000}
                      value={xp}
                      onValueChange={(next) => update({ xp: next })}
                      className="text-character-flare h-5 w-16 text-right font-mono text-xs md:text-xs"
                    />
                    <span className="text-muted-foreground">/ {nextLevelXp}</span>
                  </div>
                </div>
                <Progress
                  aria-label={t('xpProgress')}
                  value={progress}
                  className="h-2"
                  indicatorClassName="bg-character"
                />
              </div>
            </div>

            {/* Right Column: Information Grid */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <ChoiceSelect
                id="char-race"
                maxLength={TEXT_MAX}
                label={t('race')}
                value={race || ''}
                matched={choices.raceOf(race)}
                options={Object.values(CharacterRace).map((value) => ({
                  value,
                  label: choices.raceLabelOf(value),
                  icon: RACE_ICONS[value],
                }))}
                onChange={(value) => update({ race: value })}
                placeholder={t('racePlaceholder')}
                otherLabel={t('otherOption')}
                otherPlaceholder={t('raceOtherPlaceholder')}
              />
              <ChoiceSelect
                id="char-class"
                maxLength={TEXT_MAX}
                label={t('class')}
                value={classNameStr || ''}
                matched={choices.classOf(classNameStr)}
                options={Object.values(CharacterClass).map((value) => ({
                  value,
                  label: choices.classLabelOf(value),
                  icon: CLASS_ICONS[value],
                }))}
                onChange={(value) => update({ class: value })}
                placeholder={t('classPlaceholder')}
                otherLabel={t('otherOption')}
                otherPlaceholder={t('classOtherPlaceholder')}
              />
              <ChoiceSelect
                id="char-background"
                maxLength={TEXT_MAX}
                label={t('background')}
                value={background || ''}
                matched={choices.backgroundOf(background)}
                options={Object.values(CharacterBackground).map((value) => ({
                  value,
                  label: choices.backgroundLabelOf(value),
                  icon: BACKGROUND_ICONS[value],
                }))}
                onChange={(value) => update({ background: value })}
                placeholder={t('backgroundPlaceholder')}
                otherLabel={t('otherOption')}
                otherPlaceholder={t('backgroundOtherPlaceholder')}
              />
              <ChoiceSelect
                id="char-alignment"
                maxLength={TEXT_MAX}
                label={t('alignment')}
                value={alignment || ''}
                matched={choices.alignmentOf(alignment)}
                options={Object.values(CharacterAlignment).map((value) => ({
                  value,
                  label: choices.alignmentLabelOf(value),
                }))}
                onChange={(value) => update({ alignment: value })}
                placeholder={t('alignmentPlaceholder')}
                otherLabel={t('otherOption')}
                otherPlaceholder={t('alignmentOtherPlaceholder')}
              />
            </div>
          </div>
        </SheetFieldset>
      </CardContent>
    </Card>
  );
}
