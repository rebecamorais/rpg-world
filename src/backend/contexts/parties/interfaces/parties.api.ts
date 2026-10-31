import { PartyContext } from '../index';

export const makePartiesApi = (partyContext: PartyContext) => ({
  listMine: () => partyContext.listMine(),

  create: (gmId: string, name: string) => partyContext.create(gmId, name),

  rename: (partyId: string, name: string) => partyContext.rename(partyId, name),

  delete: (partyId: string) => partyContext.delete(partyId),

  rotateInviteCode: async (partyId: string) => ({
    code: await partyContext.rotateInviteCode(partyId),
  }),
});
