import { ConditionCatalog } from '@backend/contexts/conditions/domain/condition';

import { CombatError, CombatErrorCodes } from '../domain/CombatError';
import { ActiveCondition } from '../domain/Encounter';
import { CombatRepo } from '../domain/repository/combat.repo';

/** Replaces a participant's conditions; only catalog conditions, and levels only where they exist. */
export class SetConditionsUseCase {
  constructor(
    private readonly repository: CombatRepo,
    private readonly catalog: ConditionCatalog,
  ) {}

  async execute(
    partyId: string,
    participantId: string,
    conditions: ActiveCondition[],
  ): Promise<void> {
    const byKey = new Map<string, ActiveCondition>();
    for (const { key, level } of conditions) {
      const found = this.catalog.find(key);
      if (!found) throw new CombatError(CombatErrorCodes.INVALID_CONDITION);

      if (found.maxLevel === null) {
        if (level !== null) throw new CombatError(CombatErrorCodes.INVALID_CONDITION);
        byKey.set(key, { key, level: null });
        continue;
      }
      const effective = level ?? 1;
      if (effective < 1 || effective > found.maxLevel) {
        throw new CombatError(CombatErrorCodes.INVALID_CONDITION);
      }
      byKey.set(key, { key, level: effective });
    }

    if (!(await this.repository.setConditions(partyId, participantId, [...byKey.values()]))) {
      throw new CombatError(CombatErrorCodes.NOT_FOUND);
    }
  }
}
