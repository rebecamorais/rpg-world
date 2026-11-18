import { PartyGmAccess } from '@backend/shared/domain/PartyGmAccess';

import type { Edition } from '@shared/systems/dnd5e/content/editions';

import { InviteCard, InvitePreview, MemberStatus, MyParties } from '../domain/Party';
import { PartyView } from '../domain/PartyView';
import { GmClaimStatus } from '../domain/repository/party.repo';

/**
 * Operations the parties context exposes to the interface layer. They act as the signed-in user:
 * who may change what is decided by the database (RLS and the party functions).
 */
export interface PartyContext extends PartyGmAccess {
  listMine(): Promise<MyParties>;
  create(gmId: string, name: string): Promise<{ id: string }>;
  rename(partyId: string, name: string): Promise<void>;
  setEdition(partyId: string, edition: Edition): Promise<void>;
  delete(partyId: string): Promise<void>;
  rotateInviteCode(partyId: string): Promise<string>;
  getInvite(code: string): Promise<InvitePreview>;
  getInviteCard(code: string): Promise<InviteCard | null>;
  requestJoin(code: string): Promise<MemberStatus>;
  inviteByUsername(partyId: string, username: string): Promise<MemberStatus>;
  acceptMember(partyId: string, memberId: string): Promise<void>;
  removeMember(partyId: string, memberId: string): Promise<void>;
  get(partyId: string, userId: string): Promise<PartyView>;
  setJournal(partyId: string, userId: string, url: string | null): Promise<void>;
  uploadImage(partyId: string, userId: string, file: Blob): Promise<string>;
  removeImage(partyId: string, userId: string): Promise<void>;
  claimGm(partyId: string): Promise<GmClaimStatus>;
  voteGmClaim(partyId: string, accept: boolean): Promise<GmClaimStatus>;
  cancelGmClaim(partyId: string): Promise<void>;
  setMyCharacters(partyId: string, userId: string, characterIds: string[]): Promise<void>;
}
