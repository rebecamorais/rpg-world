'use client';

import { useState } from 'react';

import { useTranslations } from 'next-intl';

import { MagicSystemCard } from '@frontend/components/character/MagicSystemCard';
import { HealthPointsCard } from '@frontend/components/character/stats/HealthPointsCard';
import { Button } from '@frontend/components/ui/button';
import { Card, CardContent, CardHeader } from '@frontend/components/ui/card';
import { Dialog, DialogTrigger } from '@frontend/components/ui/dialog';
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
import { useCharacterActions, useLoadedCharacter } from '@frontend/context/CharacterContext';
import { setHitDice, setSpellPoints, setSpellSlots } from '@frontend/lib/character-sheet-updates';

import { calculatePassivePerception } from '@shared/systems/dnd5e/calculations';

import { CombatConfigSection, CombatStatsDialog } from './CombatStatsDialog';
import { DeathSavesCard } from './DeathSavesCard';

// Sized to its content, so a unit (speed's "m") sits right after the number
const STAT_INPUT =
  'field-sizing-content h-7 w-auto min-w-[1ch] p-0 font-mono text-xl font-bold focus-visible:px-1 md:text-xl';
const HIT_DIE_OPTIONS = ['d6', 'd8', 'd10', 'd12'];

/** The die in a hit dice total: `5d6` → `d6`. Totals used to be stored with the level. */
function hitDie(total: string | undefined) {
  const die = total?.match(/d\d+$/)?.[0];
  return die && HIT_DIE_OPTIONS.includes(die) ? die : 'd8';
}

const CombatHeader = () => {
  const t = useTranslations('combatStats');
  const character = useLoadedCharacter();
  const tCharacters = useTranslations('characters');
  const { update } = useCharacterActions();
  const passivePerception = calculatePassivePerception(
    character.attributes.WIS ?? 10,
    character.level,
    character.skills?.PERCEPTION?.isProficient ?? false,
    character.skills?.PERCEPTION?.expertise ?? false,
  );

  return (
    <CardHeader className="border-border bg-muted/30 border-b px-4 py-4 md:px-6 md:py-3">
      <div className="grid grid-cols-3 gap-3 md:grid-cols-5">
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
            value={character.speed ?? 30}
            min={0}
            max={10_000}
            onValueChange={(speed) => update({ speed })}
            showIcon={false}
            className={STAT_INPUT}
          />
        </StatBlock>

        <StatBlock icon="dice-target" label={t('hitDice')} hint={t('hints.hitDice')}>
          <Select
            value={`1${hitDie(character.hitDice?.total)}`}
            onValueChange={(val) => update(setHitDice(val))}
          >
            <SelectTrigger
              aria-label={t('hitDice')}
              className="h-7 gap-1 border-none bg-transparent p-0 font-mono text-xl font-bold shadow-none backdrop-blur-none hover:bg-transparent [&>span]:line-clamp-none"
            >
              {/* One die per level: a level 5 wizard has 5d6 */}
              <SelectValue>
                {character.level}
                {hitDie(character.hitDice?.total)}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="min-w-[80px]">
              {HIT_DIE_OPTIONS.map((key) => (
                <SelectItem key={key} value={`1${key}`} className="font-mono">
                  {t(`diceOptions.${key}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </StatBlock>
        <StatBlock
          icon="surrounded-eye"
          label={tCharacters('passivePerception')}
          hint={t('hints.passivePerception')}
        >
          <span className="sr-only">{tCharacters('passivePerception')}: </span>
          {passivePerception}
        </StatBlock>
      </div>
    </CardHeader>
  );
};

/** Small gear in a card's corner that opens that card's settings. */
const CardConfigButton = ({ section, label }: { section: CombatConfigSection; label: string }) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={label}
          className="text-muted-foreground hover:text-character-flare touch-target relative z-10 h-7 w-7"
        >
          <AppIcon name="Settings2" size={14} />
        </Button>
      </DialogTrigger>
      <CombatStatsDialog section={section} onSaved={() => setOpen(false)} />
    </Dialog>
  );
};

const ResourceGrid = () => {
  const t = useTranslations('combatStats');
  const tm = useTranslations('magicSystem');
  const character = useLoadedCharacter();
  const { update } = useCharacterActions();

  return (
    <CardContent className="p-4 sm:p-6">
      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <HealthPointsCard
            currentHp={character.hpCurrent ?? 0}
            maxHp={character.hpMax || 1}
            tempHp={character.hpTemp ?? 0}
            onHpChange={(field, value) => update({ [field]: value })}
            action={<CardConfigButton section="hp" label={t('configureHp')} />}
          />
          <DeathSavesCard />
        </div>

        <MagicSystemCard
          character={character}
          onSystemChange={(system) => update({ spellcastingSystem: system })}
          onPointsChange={(field, value) => update(setSpellPoints(field, value))}
          onSlotsChange={(level, max, used) => update(setSpellSlots(level, max, used))}
          action={<CardConfigButton section="magic" label={tm('configure')} />}
        />
      </div>
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
