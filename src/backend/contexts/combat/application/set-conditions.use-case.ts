import { ConditionCatalog } from '@backend/contexts/conditions/domain/condition';

import { CombatError, CombatErrorCodes } from '../domain/CombatError';
import { ActiveCondition } from '../domain/Encounter';
import { CombatRepo } from '../domain/repository/combat.repo';

/**
 * Replaces a participant's conditions; only catalog conditions, and levels only where they exist.
 * A key the catalog no longer knows is dropped when the participant already had it (so it never
 * blocks later edits); a new unknown key is refused.
 */
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
    let stored: Set<string> | undefined;
    for (const { key, level } of conditions) {
      const found = this.catalog.find(key);
      if (!found) {
        stored ??= await this.storedKeys(partyId, participantId);
        if (stored.has(key)) continue;
        throw new CombatError(CombatErrorCodes.INVALID_CONDITION);
      }

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

  private async storedKeys(partyId: string, participantId: string): Promise<Set<string>> {
    const encounter = await this.repository.findEncounter(partyId);
    const current = encounter?.participants.find((p) => p.id === participantId);
    return new Set(current?.conditions.map((c) => c.key));
  }
}
