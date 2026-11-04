import { EncounterView } from '../domain/Encounter';
import { toGmRow } from '../domain/gm-row';
import { CombatRepo } from '../domain/repository/combat.repo';

/** The party's combat as the person asking may see it: the GM's tracker, or the turn order. */
export class GetEncounterUseCase {
  constructor(private readonly repository: CombatRepo) {}

  async execute(partyId: string, userId: string): Promise<EncounterView | null> {
    const party = await this.repository.findPartyGm(partyId);
    if (!party) return null;

    // A party without a GM has no tracker to show: everyone gets the player view
    if (party.gmId !== userId) {
      const turns = await this.repository.turns(partyId);
      return turns && { role: 'player', ...turns };
    }

    const encounter = await this.repository.findEncounter(partyId);
    if (!encounter) return null;

    const ids = [...new Set(encounter.participants.map((p) => p.characterId))];
    const sheets = new Map((await this.repository.sheets(ids)).map((s) => [s.id, s]));
    return {
      role: 'gm',
      round: encounter.round,
      rows: encounter.participants.flatMap((participant) => {
        const sheet = sheets.get(participant.characterId);
        return sheet ? [toGmRow(participant, sheet, encounter.currentParticipantId)] : [];
      }),
    };
  }
}
