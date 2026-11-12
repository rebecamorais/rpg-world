'use client';

import { useState } from 'react';

import { useFormatter, useTranslations } from 'next-intl';

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
import { cn } from '@frontend/lib/utils';
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
  const format = useFormatter();
  const choices = useCharacterChoices();
  const tImage = useTranslations('avatarUpload');
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [identityOpen, setIdentityOpen] = useState(false);

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

  // On a phone the fields wait behind a toggle: at the table, the hit points matter more
  const summary = [
    [choices.classLabel(classNameStr), level].filter(Boolean).join(' '),
    choices.raceLabel(race),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Card className="overflow-hidden shadow-sm">
      <CardContent className="flex flex-col gap-5 p-5 md:flex-row">
        <div className="flex items-center gap-4 self-start">
          {/* The button sits over the avatar instead of wrapping it: the initials would be its
              visible text and not match the aria-label (WCAG 2.5.3). The avatar is hidden from
              screen readers: the h1 already names the character */}
          <div className="relative shrink-0 rounded-lg transition-transform has-[button:active]:scale-95 has-[button:hover]:scale-105">
            <CharacterPortrait
              avatarUrl={avatarUrl}
              characterClass={classNameStr}
              className="h-20 w-20 shrink-0 md:h-48 md:w-48"
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

          <div className="flex min-w-0 flex-col items-start gap-1 md:hidden">
            {summary && <p className="text-body text-foreground">{summary}</p>}
            <button
              type="button"
              aria-expanded={identityOpen}
              aria-controls="char-identity"
              onClick={() => setIdentityOpen((open) => !open)}
              className="focus-ring touch-target text-primary-flare -ml-1 rounded-sm px-1 text-sm underline"
            >
              {identityOpen ? t('hideIdentity') : t('showIdentity')}
            </button>
          </div>
        </div>

        {/* The fields only: the image can be viewed on a read-only sheet too */}
        <div id="char-identity" className={cn('min-w-0 flex-1', !identityOpen && 'max-md:hidden')}>
          <SheetFieldset>
            <div className="grid min-w-0 grid-cols-1 gap-x-6 gap-y-4 lg:grid-cols-[minmax(0,4fr)_minmax(0,5fr)]">
              {/* Left Column: Core Stats */}
              {/* Spread over the avatar's height, so the card has no empty corner */}
              <div className="flex flex-col justify-between gap-4">
                {/* The name is the page's h1 (SheetPage); here it is edited like the other fields */}
                <InlineField
                  id="char-name"
                  maxLength={TEXT_MAX}
                  // A character's name, not the user's: keep the browser's personal autofill away
                  autoComplete="off"
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
                      <span className="text-muted-foreground">/ {format.number(nextLevelXp)}</span>
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
              <div className="grid grid-cols-2 content-between gap-x-4 gap-y-4">
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
        </div>
      </CardContent>
    </Card>
  );
}
