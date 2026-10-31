import { InvitePreview, MemberStatus, PartySummary } from '../Party';

/**
 * Acts as the signed-in user: the database decides who may do what (RLS and the party functions),
 * so methods that change a row answer `false` when nothing was allowed to change.
 */
export interface PartyRepo {
  listMine(): Promise<PartySummary[]>;
  create(gmId: string, name: string): Promise<string>;
  rename(id: string, name: string): Promise<boolean>;
  delete(id: string): Promise<boolean>;
  setInviteCode(id: string, code: string): Promise<boolean>;
  getInvite(code: string): Promise<InvitePreview | null>;
  /** Asks to join through the link; someone already invited joins at once. */
  requestJoin(code: string): Promise<MemberStatus>;
  /** The GM invites by username; someone who already asked joins at once. */
  invite(partyId: string, username: string): Promise<MemberStatus>;
  /** The GM approving a request, or the invited person accepting. */
  activateMember(partyId: string, userId: string): Promise<boolean>;
  /** Leaving, declining or withdrawing (the person); removing or declining (the GM). */
  deleteMember(partyId: string, userId: string): Promise<boolean>;
}
