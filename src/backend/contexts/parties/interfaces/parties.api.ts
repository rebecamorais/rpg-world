import type { Edition } from '@shared/systems/dnd5e/content/editions';

import { PartyContext } from '../index';

export const makePartiesApi = (partyContext: PartyContext) => ({
  listMine: () => partyContext.listMine(),

  create: (gmId: string, name: string) => partyContext.create(gmId, name),

  rename: (partyId: string, name: string) => partyContext.rename(partyId, name),

  setEdition: (partyId: string, edition: Edition) => partyContext.setEdition(partyId, edition),

  setJournal: (partyId: string, userId: string, url: string | null) =>
    partyContext.setJournal(partyId, userId, url),

  uploadImage: async (partyId: string, userId: string, file: Blob) => ({
    url: await partyContext.uploadImage(partyId, userId, file),
  }),

  removeImage: (partyId: string, userId: string) => partyContext.removeImage(partyId, userId),

  delete: (partyId: string) => partyContext.delete(partyId),

  rotateInviteCode: async (partyId: string) => ({
    code: await partyContext.rotateInviteCode(partyId),
  }),

  getInvite: (code: string) => partyContext.getInvite(code),

  getInviteCard: (code: string) => partyContext.getInviteCard(code),

  requestJoin: async (code: string) => ({ status: await partyContext.requestJoin(code) }),

  inviteByUsername: async (partyId: string, username: string) => ({
    status: await partyContext.inviteByUsername(partyId, username),
  }),

  acceptMember: (partyId: string, memberId: string) => partyContext.acceptMember(partyId, memberId),

  removeMember: (partyId: string, memberId: string) => partyContext.removeMember(partyId, memberId),

  claimGm: async (partyId: string) => ({ status: await partyContext.claimGm(partyId) }),

  voteGmClaim: async (partyId: string, accept: boolean) => ({
    status: await partyContext.voteGmClaim(partyId, accept),
  }),

  cancelGmClaim: async (partyId: string) => {
    await partyContext.cancelGmClaim(partyId);
    return { status: 'cancelled' as const };
  },

  get: (partyId: string, userId: string) => partyContext.get(partyId, userId),

  setMyCharacters: (partyId: string, userId: string, characterIds: string[]) =>
    partyContext.setMyCharacters(partyId, userId, characterIds),
});
