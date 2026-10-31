import { InvitePreview, MemberStatus, PartySummary } from '../Party';
import { PartyPerson, RosterCharacter } from '../PartyView';
import { RolePlayLore, RolePlaySheet } from '../role-play-card';

export interface PartyRecord {
  id: string;
  name: string;
  system: string;
  gmId: string;
}

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
  /** Null when it doesn't exist or the person has no link to it. */
  findParty(id: string): Promise<PartyRecord | null>;
  people(partyId: string): Promise<PartyPerson[]>;
  roster(partyId: string): Promise<RosterCharacter[]>;
  /** Null for anyone but the GM. */
  inviteCode(partyId: string): Promise<string | null>;
  /** The sheets behind the GM's Role Play cards (only the GM can read them). */
  rolePlaySheets(
    characterIds: string[],
  ): Promise<{ id: string; sheet: RolePlaySheet; lore: RolePlayLore | null }[]>;
  /** The person's own characters; any other is refused (CHARACTER_NOT_ALLOWED). */
  addCharacters(partyId: string, characterIds: string[]): Promise<void>;
  removeCharacters(partyId: string, characterIds: string[]): Promise<void>;
}
