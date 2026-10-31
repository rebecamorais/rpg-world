import { PartyError, PartyErrorCodes } from '../domain/PartyError';
import { PartyView } from '../domain/PartyView';
import { PartyRepo } from '../domain/repository/party.repo';
import { toRolePlayCard } from '../domain/role-play-card';

/** The party page: the GM's Role Play view, or what a player sees. Others get "not found". */
export class GetPartyUseCase {
  constructor(private readonly repository: PartyRepo) {}

  async execute(partyId: string, userId: string): Promise<PartyView> {
    const party = await this.repository.findParty(partyId);
    if (!party) throw new PartyError(PartyErrorCodes.NOT_FOUND);

    const isGm = party.gmId === userId;
    const [people, roster] = await Promise.all([
      this.repository.people(partyId),
      this.repository.roster(partyId),
    ]);
    // Invited and requesting people see the party in their list, not its page
    if (!isGm && !people.some((p) => p.userId === userId && p.status === 'active')) {
      throw new PartyError(PartyErrorCodes.NOT_FOUND);
    }

    const view: PartyView = {
      id: party.id,
      name: party.name,
      system: party.system,
      role: isGm ? 'gm' : 'player',
      people,
      roster,
      myCharacterIds: roster.filter((c) => c.ownerId === userId).map((c) => c.characterId),
      gm: null,
    };
    if (!isGm) return view;

    const [inviteCode, sheets] = await Promise.all([
      this.repository.inviteCode(partyId),
      this.repository.rolePlaySheets(roster.map((c) => c.characterId)),
    ]);
    const sheetById = new Map(sheets.map((s) => [s.id, s]));
    const usernameById = new Map(people.map((p) => [p.userId, p.username]));

    return {
      ...view,
      gm: {
        inviteCode: inviteCode ?? '',
        rolePlay: roster.flatMap((character) => {
          const found = sheetById.get(character.characterId);
          return found
            ? [
                toRolePlayCard(
                  character,
                  found.sheet,
                  found.lore,
                  usernameById.get(character.ownerId) ?? null,
                ),
              ]
            : [];
        }),
      },
    };
  }
}
