import { PartyGmAccess } from '@backend/shared/domain/PartyGmAccess';

import type { Edition } from '@shared/systems/dnd5e/content/editions';

import { InvitePreview, MemberStatus, MyParties } from '../domain/Party';
import { PartyView } from '../domain/PartyView';

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
  requestJoin(code: string): Promise<MemberStatus>;
  inviteByUsername(partyId: string, username: string): Promise<MemberStatus>;
  acceptMember(partyId: string, memberId: string): Promise<void>;
  removeMember(partyId: string, memberId: string): Promise<void>;
  get(partyId: string, userId: string): Promise<PartyView>;
  setJournal(partyId: string, userId: string, url: string | null): Promise<void>;
  setMyCharacters(partyId: string, userId: string, characterIds: string[]): Promise<void>;
}
