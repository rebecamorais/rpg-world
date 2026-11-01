import { CombatError, CombatErrorCodes } from '../domain/CombatError';
import { NpcSide } from '../domain/Encounter';
import { CombatRepo, NewParticipant } from '../domain/repository/combat.repo';

/**
 * Adds a character brought to the party (once), or `count` enemies or allies from one of the GM's
 * npc sheets. A lone one keeps the sheet's name; more are numbered, carrying on from the ones
 * already in the combat ("Goblin 4" after three).
 */
export class AddParticipantUseCase {
  constructor(private readonly repository: CombatRepo) {}

  async execute(
    partyId: string,
    characterId: string,
    count: number,
    side: NpcSide = 'enemy',
  ): Promise<void> {
    const [encounter, partyCharacters] = await Promise.all([
      this.repository.findEncounter(partyId),
      this.repository.partyCharacterIds(partyId),
    ]);
    if (!encounter) throw new CombatError(CombatErrorCodes.NOT_FOUND);

    if (partyCharacters.includes(characterId)) {
      return this.repository.addParticipants(partyId, [
        { characterId, side: 'player', label: null },
      ]);
    }

    const enemy = await this.repository.enemySheet(characterId);
    if (!enemy) throw new CombatError(CombatErrorCodes.CHARACTER_NOT_ALLOWED);

    const already = encounter.participants.filter((p) => p.characterId === characterId).length;
    const npcs: NewParticipant[] = Array.from({ length: count }, (_, i) => ({
      characterId,
      side,
      label: count === 1 && already === 0 ? enemy.name : `${enemy.name} ${already + i + 1}`,
    }));
    return this.repository.addParticipants(partyId, npcs);
  }
}
