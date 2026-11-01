import { MemberStatus, PartyRole } from './Party';

export interface PartyPerson {
  userId: string;
  /** Null while the person hasn't picked a username (the generated one is never shown). */
  username: string | null;
  avatarUrl: string | null;
  status: MemberStatus | 'gm';
}

/** What everyone at the table sees of a character: no HP, attributes, spells or lore. */
export interface RosterCharacter {
  characterId: string;
  ownerId: string;
  name: string;
  avatarUrl: string | null;
  race: string;
  class: string;
  level: number;
  accentColor: string | null;
}

/** A character in the GM's Role Play view. */
export interface RolePlayCard extends RosterCharacter {
  ownerUsername: string | null;
  personalityTraits: string | null;
  ideals: string | null;
  bonds: string | null;
  flaws: string | null;
  passivePerception: number;
  passiveInsight: number;
}

export interface PartyView {
  id: string;
  name: string;
  system: string;
  role: PartyRole;
  people: PartyPerson[];
  roster: RosterCharacter[];
  /** The characters the person asking brought (players). */
  myCharacterIds: string[];
  /** Only for the GM. */
  gm: { inviteCode: string; rolePlay: RolePlayCard[] } | null;
}
