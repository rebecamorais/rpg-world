import { PartyContext } from '../index';

export const makePartiesApi = (partyContext: PartyContext) => ({
  listMine: () => partyContext.listMine(),

  create: (gmId: string, name: string) => partyContext.create(gmId, name),

  rename: (partyId: string, name: string) => partyContext.rename(partyId, name),

  delete: (partyId: string) => partyContext.delete(partyId),

  rotateInviteCode: async (partyId: string) => ({
    code: await partyContext.rotateInviteCode(partyId),
  }),

  getInvite: (code: string) => partyContext.getInvite(code),

  requestJoin: async (code: string) => ({ status: await partyContext.requestJoin(code) }),

  inviteByUsername: async (partyId: string, username: string) => ({
    status: await partyContext.inviteByUsername(partyId, username),
  }),

  acceptMember: (partyId: string, memberId: string) => partyContext.acceptMember(partyId, memberId),

  removeMember: (partyId: string, memberId: string) => partyContext.removeMember(partyId, memberId),
});
