'use client';

import { useState } from 'react';

import { useTranslations } from 'next-intl';

import { MagicSystemCard } from '@frontend/components/character/MagicSystemCard';
import { HealthPointsCard } from '@frontend/components/character/stats/HealthPointsCard';
import { Button } from '@frontend/components/ui/button';
import { Card, CardContent, CardHeader } from '@frontend/components/ui/card';
import { Dialog } from '@frontend/components/ui/dialog';
import { AppIcon } from '@frontend/components/ui/icon';
import { NumberInput } from '@frontend/components/ui/number-input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@frontend/components/ui/select';
import { StatBlock } from '@frontend/components/ui/stat-block';
import {
  useCharacterActions,
  useCharacterMeta,
  useLoadedCharacter,
} from '@frontend/context/CharacterContext';
import { useClassBasics } from '@frontend/hooks/useClassBasics';
import { useSheetSource } from '@frontend/hooks/useSheetSource';
import {
  hitDiceAvailable,
  inheritHitDie,
  setHitDiceSpent,
  setHitDie,
  setSpellPoints,
} from '@frontend/lib/character-sheet-updates';

import { calculatePassivePerception } from '@shared/systems/dnd5e/calculations';
import { effectiveHitDie } from '@shared/systems/dnd5e/class-defaults';
import { HIT_DIE_OPTIONS } from '@shared/systems/dnd5e/hit-dice';
import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import { AdjustHitPoints } from './AdjustHitPoints';
import { CombatConfigSection, CombatStatsDialog } from './CombatStatsDialog';

// Sized to its content, so a unit (speed's "m") sits right after the number
const STAT_INPUT =
  'field-sizing-content h-7 w-auto min-w-[1ch] p-0 font-mono text-xl font-bold focus-visible:px-1 md:text-xl';

/** The select's value for "back to the class's die": not a die, so it never gets stored. */
const FOLLOW_CLASS = 'class';

const CombatHeader = () => {
  const t = useTranslations('combatStats');
  const character = useLoadedCharacter();
  const tCharacters = useTranslations('characters');
  const { update, saveNow } = useCharacterActions();
  const tRemaining = useTranslations('hitDiceRemaining');
  const { id } = useCharacterMeta();
  const { readOnly } = useSheetSource(id);
  const level = character.level;
  const available = hitDiceAvailable(character);
  // The die the player set, else the class's; a sheet with neither shows a d8
  const {
    die: hitDie,
    source: hitDieSource,
    classDefault: classHitDie,
  } = effectiveHitDie(character.hitDice, useClassBasics());
  // Only where it shows: a die set by hand that is the class's anyway needs no way back
  const canFollowClass =
    hitDieSource === 'manual' && classHitDie !== null && classHitDie !== hitDie;
  const passivePerception = calculatePassivePerception(
    character.attributes.WIS ?? 10,
    character.level,
    character.skills?.PERCEPTION?.isProficient ?? false,
    character.skills?.PERCEPTION?.expertise ?? false,
  );

  return (
    // Columns by the card's own width, not the screen's: with the sidebar open, or in the party's
    // sheet panel, the card is much narrower than the viewport. Icon-only blocks are narrow: five
    // fit from 28rem. The hit dice block holds three things ("5/5 d8"): two columns while there
    // are three, a wider one once all five sit side by side
    <CardHeader className="border-border bg-muted/30 @container border-b px-4 py-4 md:px-6 md:py-3">
      <div className="grid grid-cols-3 gap-3 @md:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.7fr)_minmax(0,1fr)]">
        <StatBlock icon="shoulder-armor" label={t('armorClass')} hint={t('hints.armorClass')}>
          <NumberInput
            ghost
            aria-label={t('armorClass')}
            value={character.ac ?? 0}
            min={0}
            max={1_000}
            onValueChange={(ac) => update({ ac })}
            showIcon={false}
            className={STAT_INPUT}
          />
        </StatBlock>

        <StatBlock icon="stopwatch" label={t('initiative')} hint={t('hints.initiative')}>
          <NumberInput
            ghost
            aria-label={t('initiative')}
            // Initiative can be negative, and the iPhone's numeric keypad has no minus sign
            inputMode="text"
            value={character.initiative}
            min={-1_000}
            max={1_000}
            onValueChange={(initiative) => update({ initiative })}
            showIcon={false}
            className={STAT_INPUT}
          />
        </StatBlock>

        <StatBlock
          icon="boot-prints"
          label={t('speed')}
          hint={t('hints.speed')}
          unit={t('speedUnit')}
        >
          <NumberInput
            ghost
            decimal
            aria-label={t('speed')}
            value={character.speed ?? 9}
            min={0}
            max={10_000}
            onValueChange={(speed) => update({ speed })}
            showIcon={false}
            className={STAT_INPUT}
          />
        </StatBlock>

        <StatBlock
          id="sheet-hit-dice"
          // Wider than its neighbours, so it stays side by side when they stack: centred in the row's height
          className="col-span-2 flex items-center @md:col-span-1"
          icon="dice-target"
          label={t('hitDice')}
          hint={t('hints.hitDice')}
        >
          {/* Dice left to spend, of one per level: "3/5 d6" */}
          <NumberInput
            ghost
            aria-label={tRemaining('label')}
            // Where the rest checklist's "go" lands
            data-rest-focus
            value={available}
            min={0}
            max={level}
            disabled={readOnly}
            // Spending a die is play, not a sheet edit: it saves at once
            onValueChange={(left) => saveNow(setHitDiceSpent(level - left))}
            showIcon={false}
            className={STAT_INPUT}
          />
          <span data-testid="hit-dice-total" className="text-muted-foreground text-base">
            <span aria-hidden="true">/</span>
            {level}
          </span>
          <Select
            value={hitDie}
            onValueChange={(val) => {
              const die = HIT_DIE_OPTIONS.find((option) => option === val);
              if (die) update(setHitDie(die));
              else if (val === FOLLOW_CLASS) update(inheritHitDie());
            }}
          >
            <SelectTrigger
              aria-label={t('hitDice')}
              className="ml-1.5 h-7 gap-0.5 border-none bg-transparent p-0 font-mono text-base font-bold shadow-none backdrop-blur-none hover:bg-transparent [&>span]:line-clamp-none"
            >
              <SelectValue>{hitDie}</SelectValue>
            </SelectTrigger>
            <SelectContent className="min-w-[80px]">
              {HIT_DIE_OPTIONS.map((key) => (
                <SelectItem key={key} value={key} className="font-mono">
                  {t(`diceOptions.${key}`)}
                </SelectItem>
              ))}
              {canFollowClass && (
                <SelectItem value={FOLLOW_CLASS}>
                  {t('followClassDie', { die: classHitDie })}
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </StatBlock>
        <StatBlock
          icon="Eye"
          iconVariant="system"
          label={tCharacters('passivePerception')}
          hint={t('hints.passivePerception')}
        >
          {passivePerception}
        </StatBlock>
      </div>
    </CardHeader>
  );
};

/**
 * Spends or gets back a slot, read on the server copy: the level's capacity is a sheet edit
 * (the card's settings) and stays in the draft until the sheet is saved.
 */
const setSlotUsed =
  (level: string, max: number, used: number) =>
  (c: DnD5eCharacter): Partial<DnD5eCharacter> => ({
    spellSlots: { ...c.spellSlots, [level]: { max: c.spellSlots?.[level]?.max ?? max, used } },
  });

// saveNow already showed the error and put the server's value back on screen
const ignore = () => {};

/** Small gear in a card's corner that opens that card's settings. */
const CardConfigButton = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <Button
    variant="ghost"
    size="icon"
    aria-label={label}
    onClick={onClick}
    className="text-muted-foreground hover:text-character-flare touch-target relative z-10 h-7 w-7"
  >
    <AppIcon name="Settings2" size={14} />
  </Button>
);

const ResourceGrid = () => {
  const t = useTranslations('combatStats');
  const tm = useTranslations('magicSystem');
  const character = useLoadedCharacter();
  const { saveNow } = useCharacterActions();
  const { id } = useCharacterMeta();
  const { readOnly } = useSheetSource(id);
  // Kept out of the cards: switching the magic system swaps the card, which would close it
  const [config, setConfig] = useState<CombatConfigSection | null>(null);

  return (
    // Side by side only when each card has room for its row of − value +: the card's width decides,
    // not the screen's (sidebar open at 768px, the party's sheet panel)
    <CardContent className="@container p-4 sm:p-6">
      <div className="grid grid-cols-1 gap-6 @xl:grid-cols-2">
        <HealthPointsCard
          id="sheet-hp"
          currentHp={character.hpCurrent ?? 0}
          maxHp={character.hpMax || 1}
          tempHp={character.hpTemp ?? 0}
          // Play, not editing: saved at once like the Adjust HP, never left in the draft
          onHpChange={(field, value) => saveNow({ [field]: value }).catch(ignore)}
          action={<CardConfigButton label={t('configureHp')} onClick={() => setConfig('hp')} />}
          footer={
            !readOnly && (
              <AdjustHitPoints>
                <Button variant="outline" size="sm">
                  {t('adjustHp')}
                </Button>
              </AdjustHitPoints>
            )
          }
        />

        <MagicSystemCard
          id="sheet-spell-slots"
          character={character}
          onPointsChange={(field, value) => saveNow(setSpellPoints(field, value)).catch(ignore)}
          onSlotsChange={(level, max, used) => saveNow(setSlotUsed(level, max, used)).catch(ignore)}
          action={<CardConfigButton label={tm('configure')} onClick={() => setConfig('magic')} />}
        />
      </div>

      <Dialog open={config !== null} onOpenChange={(open) => !open && setConfig(null)}>
        {config && <CombatStatsDialog section={config} />}
      </Dialog>
    </CardContent>
  );
};

export default function CombatStatsSection() {
  return (
    <Card className="overflow-hidden shadow-sm">
      <CombatHeader />
      <ResourceGrid />
    </Card>
  );
}
