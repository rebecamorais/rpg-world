import { recoveryOn } from '@shared/systems/dnd5e/class-resources';
import type { ResourceBox } from '@shared/systems/dnd5e/class-resources';

export type RestTarget = 'sheet-hp' | 'sheet-hit-dice' | 'sheet-spell-slots' | 'sheet-resources';

export interface RestItem {
  id: string;
  /** Sheet block the "go" button scrolls to. */
  target: RestTarget | null;
  /** Key under the `restChecklist` messages. */
  message: string;
  values?: Record<string, string | number>;
}

/** "+2" / "−1" (real minus sign) / "+0". */
const signed = (n: number) => (n < 0 ? `−${-n}` : `+${n}`);

/** What to update on the sheet after a rest. Pure: nothing here touches the sheet. */
export function buildRestChecklist(input: {
  rest: 'short' | 'long';
  level: number;
  hitDie: number | null;
  conMod: number;
  hitDiceAvailable: number;
  boxes: ResourceBox[];
  /** What the long rest gives back to the sheet's magic: slots, points, or nothing to track. */
  magic: 'slots' | 'points' | null;
  hasPactSlots: boolean;
}): RestItem[] {
  const { rest, boxes } = input;

  const boxItems: RestItem[] = boxes.flatMap((box) => {
    const amount = recoveryOn(box, rest);
    return amount === null
      ? []
      : [
          {
            id: `box:${box.key}`,
            target: 'sheet-resources' as const,
            message: 'boxBack',
            values: { name: box.name, amount },
          },
        ];
  });

  if (rest === 'short') {
    const spend: RestItem =
      input.hitDie === null
        ? {
            id: 'spend-hit-dice',
            target: 'sheet-hit-dice',
            message: 'spendHitDiceNoDie',
            values: { left: input.hitDiceAvailable },
          }
        : {
            id: 'spend-hit-dice',
            target: 'sheet-hit-dice',
            message: 'spendHitDice',
            values: {
              die: `d${input.hitDie}`,
              bonus: signed(input.conMod),
              left: input.hitDiceAvailable,
            },
          };
    return [
      spend,
      ...boxItems,
      ...(input.hasPactSlots
        ? [{ id: 'pact-slots', target: 'sheet-spell-slots' as const, message: 'pactSlotsBack' }]
        : []),
      { id: 'not-back-short', target: null, message: 'notBackShort' },
    ];
  }

  return [
    { id: 'full-hp', target: 'sheet-hp', message: 'fullHp' },
    {
      id: 'hit-dice-back',
      target: 'sheet-hit-dice',
      message: 'hitDiceBack',
      values: { count: Math.max(1, Math.floor(input.level / 2)) },
    },
    ...(input.magic === 'slots'
      ? [{ id: 'spell-slots', target: 'sheet-spell-slots' as const, message: 'spellSlotsBack' }]
      : []),
    ...(input.magic === 'points'
      ? [{ id: 'spell-points', target: 'sheet-spell-slots' as const, message: 'spellPointsBack' }]
      : []),
    ...boxItems,
  ];
}
