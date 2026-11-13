'use client';

import type { ReactNode } from 'react';

import { useTranslations } from 'next-intl';

import { SheetPreview } from '@frontend/components/character/sheet/SheetPreview';
import { Button } from '@frontend/components/ui/button';
import { AppIcon } from '@frontend/components/ui/icon';
import { StatBlock } from '@frontend/components/ui/stat-block';
import { cn, getStatColorClass } from '@frontend/lib/utils';

import type { ActiveCondition, GmRow, NpcSide } from '@backend/contexts/combat/domain/Encounter';
import type { ParticipantPatch } from '@backend/contexts/combat/domain/repository/combat.repo';

import { getModifier } from '@shared/systems/dnd5e/calculations';
import type { Edition } from '@shared/systems/dnd5e/content/editions';

import { ConditionsPicker } from './ConditionsPicker';
import { NpcControls } from './NpcControls';
import { NpcFateControls } from './NpcFateControls';
import { NumberCell } from './NumberCell';

const ATTRIBUTES = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as const;

/** One group of the open row, with a small heading when it needs one. */
function Group({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      {title && <h3 className="text-label text-muted-foreground">{title}</h3>}
      {children}
    </section>
  );
}

/**
 * The open part of the GM's row, where all editing lives, in the approved order: numbers, down
 * (an NPC at 0 HP), what the players see, actions, attributes. Only an NPC's HP is edited here;
 * a player's comes from their sheet.
 */
export function CombatRowDetails({
  id,
  hidden,
  partyId,
  row,
  edition,
  swapWith,
  onSwap,
  onChange,
  onRemove,
  onConditionsChange,
}: {
  id: string;
  hidden?: boolean;
  partyId: string;
  row: GmRow;
  edition: Edition;
  /** The neighbors with exactly the same initiative, each offered as "Swap with". */
  swapWith: { participantId: string; name: string }[];
  onSwap: (participantId: string) => void;
  onChange: (patch: ParticipantPatch) => void;
  onRemove: () => void;
  onConditionsChange: (conditions: ActiveCondition[]) => void;
}) {
  const t = useTranslations('combat');
  const tStats = useTranslations('combatStats');
  const tCond = useTranslations('conditions');
  const tAttr = useTranslations('attributes.abbreviations');
  const isNpc = row.side !== 'player';

  return (
    <div
      id={id}
      hidden={hidden}
      data-row-details
      className="animate-fade-in flex cursor-auto flex-col gap-4"
    >
      <Group>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(9rem,1fr))] gap-2">
          <StatBlock icon="Zap" iconVariant="system" label={t('initiative')}>
            <NumberCell
              label={t('initiativeOf', { name: row.name })}
              value={row.initiative}
              min={-10}
              max={99}
              nullable
              placeholder="—"
              onCommit={(initiative) => onChange({ initiative })}
            />
          </StatBlock>
          {isNpc && (
            <>
              {/* Wider: the field plus "/ max" don't fit in one column. Full row on phones, so it
                  never adds a column the grid doesn't have */}
              <StatBlock
                icon="Heart"
                iconVariant="system"
                label={tStats('hitPointsShort')}
                className="col-span-full sm:col-span-2"
              >
                <span className="flex items-center gap-1">
                  <NumberCell
                    label={t('hpOf', { name: row.name })}
                    value={row.hp.current}
                    min={0}
                    max={row.hp.max}
                    onCommit={(hpCurrent) => onChange({ hpCurrent: hpCurrent ?? 0 })}
                  />
                  <span className="text-muted-foreground font-mono text-sm font-bold whitespace-nowrap">
                    / {row.hp.max}
                  </span>
                </span>
              </StatBlock>
              <StatBlock icon="Shield" iconVariant="system" label={t('tempHp')}>
                <NumberCell
                  label={t('tempHpOf', { name: row.name })}
                  value={row.hp.temp}
                  min={0}
                  max={9999}
                  onCommit={(hpTemp) => onChange({ hpTemp: hpTemp ?? 0 })}
                />
              </StatBlock>
            </>
          )}
          <StatBlock icon="shoulder-armor" label={tStats('armorClass')}>
            {row.ac}
          </StatBlock>
          <StatBlock icon="Eye" iconVariant="system" label={t('passivePerception')}>
            {row.passivePerception}
          </StatBlock>
          <StatBlock icon="boot-prints" label={tStats('speed')} unit={tStats('speedUnit')}>
            {row.speed}
          </StatBlock>
        </div>
      </Group>

      {isNpc && row.hp.current === 0 && (
        <Group title={t('down')}>
          <NpcFateControls
            name={row.name}
            fate={row.fate}
            deathSaves={row.deathSaves}
            revealed={row.deathRevealed}
            onChange={onChange}
          />
        </Group>
      )}

      {isNpc && (
        <Group title={t('forPlayers')}>
          <NpcControls
            name={row.name}
            visibility={row.visibility}
            // `isNpc` means the side is not 'player'
            side={row.side as NpcSide}
            onVisibility={(visibility) => onChange({ visibility })}
            onSide={(side) => onChange({ side })}
          />
        </Group>
      )}

      {/* On touch screens the gap keeps each button's 44px touch area apart */}
      <div className="flex flex-wrap items-center gap-2 pointer-coarse:gap-3">
        <ConditionsPicker
          value={row.conditions}
          defaultEdition={edition}
          onChange={onConditionsChange}
        >
          <Button
            variant="outline"
            size="sm"
            aria-label={t('conditionsOf', { name: row.name })}
            className="touch-target"
          >
            <AppIcon name="Activity" size={16} aria-hidden="true" />
            {tCond('title')}
          </Button>
        </ConditionsPicker>
        {/* A player's sheet, read through the party; an NPC is the GM's own sheet, theirs to edit */}
        <SheetPreview
          characterId={row.characterId}
          name={row.name}
          source={isNpc ? { kind: 'own' } : { kind: 'party', partyId }}
          canEdit={isNpc}
        />
        {swapWith.map((neighbor) => (
          <Button
            key={neighbor.participantId}
            variant="outline"
            size="sm"
            className="touch-target"
            onClick={() => onSwap(neighbor.participantId)}
          >
            <AppIcon name="ArrowUpDown" size={16} aria-hidden="true" />
            {t('swapWith', { name: neighbor.name })}
          </Button>
        ))}
        <Button
          variant="ghost"
          size="sm"
          className="text-danger-flare touch-target ml-auto"
          onClick={onRemove}
        >
          <AppIcon name="X" size={16} aria-hidden="true" />
          {t('remove', { name: row.name })}
        </Button>
      </div>

      <dl className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {ATTRIBUTES.map((key) => {
          const mod = getModifier(row.attributes[key] ?? 10);
          return (
            <div
              key={key}
              className="border-border bg-background/60 flex flex-col items-center rounded-lg border py-2"
            >
              <dt className="text-label text-muted-foreground">{tAttr(key)}</dt>
              <dd
                className={cn('font-mono text-lg font-bold tabular-nums', getStatColorClass(mod))}
              >
                {mod >= 0 ? `+${mod}` : mod}
              </dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
