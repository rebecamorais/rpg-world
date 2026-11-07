import { CombatError, CombatErrorCodes } from '../domain/CombatError';
import { CombatRepo, ParticipantPatch } from '../domain/repository/combat.repo';

/** The GM edits a row: initiative, an enemy's label and HP (kept within the sheet's max). */
export class UpdateParticipantUseCase {
  constructor(private readonly repository: CombatRepo) {}

  async execute(partyId: string, participantId: string, patch: ParticipantPatch): Promise<void> {
    const encounter = await this.repository.findEncounter(partyId);
    const participant = encounter?.participants.find((p) => p.id === participantId);
    if (!participant) throw new CombatError(CombatErrorCodes.NOT_FOUND);

    // Side, visibility, fate and death saves are npc settings
    const npcOnly: (keyof ParticipantPatch)[] = [
      'side',
      'visibility',
      'fate',
      'deathSaves',
      'deathRevealed',
    ];
    if (participant.side === 'player' && npcOnly.some((key) => patch[key] !== undefined)) {
      throw new CombatError(CombatErrorCodes.INVALID_CHANGE);
    }

    const changes: ParticipantPatch = { ...patch };
    if (changes.label !== undefined) changes.label = changes.label.trim();
    if (changes.hpCurrent !== undefined) {
      const [sheet] = await this.repository.sheets([participant.characterId]);
      changes.hpCurrent = Math.max(
        0,
        Math.min(changes.hpCurrent, sheet?.hpMax ?? changes.hpCurrent),
      );
    }

    if (!(await this.repository.updateParticipant(partyId, participantId, changes))) {
      throw new CombatError(CombatErrorCodes.NOT_FOUND);
    }
  }
}
