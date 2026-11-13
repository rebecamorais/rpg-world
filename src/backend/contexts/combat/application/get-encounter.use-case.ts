import { EncounterView } from '../domain/Encounter';
import { toGmRow } from '../domain/gm-row';
import { ownCharacterIds, withOwnVitals } from '../domain/player-view';
import { CombatRepo } from '../domain/repository/combat.repo';

/** The party's combat as the person asking may see it: the GM's tracker, or the turn order. */
export class GetEncounterUseCase {
  constructor(private readonly repository: CombatRepo) {}

  async execute(partyId: string, userId: string): Promise<EncounterView | null> {
    const party = await this.repository.findPartyGm(partyId);
    if (!party) return null;

    // A party without a GM has no tracker to show: everyone gets the player view
    if (party.gmId !== userId) {
      const view = await this.repository.turns(partyId);
      if (!view) return null;
      // Only the player's own sheets are read: their HP, AC and speed, nobody else's
      const ids = ownCharacterIds(view.turns);
      const sheets = ids.length > 0 ? await this.repository.sheets(ids) : [];
      return { role: 'player', ...view, turns: withOwnVitals(view.turns, sheets, userId) };
    }

    const encounter = await this.repository.findEncounter(partyId);
    if (!encounter) return null;

    const ids = [...new Set(encounter.participants.map((p) => p.characterId))];
    const [sheetList, usernames] = await Promise.all([
      this.repository.sheets(ids),
      this.repository.usernames(partyId),
    ]);
    const sheets = new Map(sheetList.map((s) => [s.id, s]));
    return {
      role: 'gm',
      round: encounter.round,
      rows: encounter.participants.flatMap((participant) => {
        const sheet = sheets.get(participant.characterId);
        if (!sheet) return [];
        const ownerUsername = usernames[sheet.ownerId] ?? null;
        return [toGmRow(participant, sheet, encounter.currentParticipantId, ownerUsername)];
      }),
    };
  }
}
