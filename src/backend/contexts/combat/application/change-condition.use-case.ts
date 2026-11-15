import { ConditionCatalog } from '@backend/contexts/conditions/domain/condition';

import { CombatError, CombatErrorCodes } from '../domain/CombatError';
import { CombatRepo, ConditionChange } from '../domain/repository/combat.repo';

/** What the client asks: a condition on (with its level, when it has levels) or off. */
export interface ConditionChangeInput {
  key: string;
  active: boolean;
  level?: number | null;
}

/**
 * Turns ONE condition on or off; the database keeps the others as they are, so the GM and a player
 * switching different conditions at once keep both. Turning on takes only catalog conditions, with
 * a level only where there are levels (1 when it is left out). Turning off takes any key, so one
 * the catalog no longer knows can still be cleared.
 */
export class ChangeConditionUseCase {
  constructor(
    private readonly repository: CombatRepo,
    private readonly catalog: ConditionCatalog,
  ) {}

  async execute(
    partyId: string,
    participantId: string,
    { key, active, level = null }: ConditionChangeInput,
  ): Promise<void> {
    const change = active ? this.turnOn(key, level) : ({ key, active: false } as const);
    if (!(await this.repository.changeCondition(partyId, participantId, change))) {
      throw new CombatError(CombatErrorCodes.NOT_FOUND);
    }
  }

  private turnOn(key: string, level: number | null): ConditionChange {
    const found = this.catalog.find(key);
    if (!found) throw new CombatError(CombatErrorCodes.INVALID_CONDITION);

    if (found.maxLevel === null) {
      if (level !== null) throw new CombatError(CombatErrorCodes.INVALID_CONDITION);
      return { key, active: true, level: null };
    }
    const effective = level ?? 1;
    if (effective < 1 || effective > found.maxLevel) {
      throw new CombatError(CombatErrorCodes.INVALID_CONDITION);
    }
    return { key, active: true, level: effective };
  }
}
