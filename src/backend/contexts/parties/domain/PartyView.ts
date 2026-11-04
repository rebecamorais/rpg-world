import type { Edition } from '@shared/systems/dnd5e/content/editions';

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

/** A player asking to become the GM of a party without one; the others accept or refuse. */
export interface GmClaim {
  candidateId: string;
  /** Null while the candidate hasn't picked a username. */
  candidateUsername: string | null;
  createdAt: string;
  /** The active players, other than the candidate, who haven't accepted yet. */
  pendingUserIds: string[];
  /** Once the request is a day old, the players waiting on others can ask support to step in. */
  canAskSupport: boolean;
}

export interface PartyView {
  id: string;
  name: string;
  system: string;
  edition: Edition;
  /** The party's picture, also the invite link's preview; null when the GM hasn't set one. */
  imageUrl: string | null;
  role: PartyRole;
  /** False when the GM deleted their account and nobody took over yet. */
  hasGm: boolean;
  /** The open request to become GM; always null while the party has a GM. */
  gmClaim: GmClaim | null;
  people: PartyPerson[];
  roster: RosterCharacter[];
  /** The characters the person asking brought (players). */
  myCharacterIds: string[];
  /** The linked Google Doc ID, for the GM and active players. */
  journalDocId: string | null;
  /** Only for the GM. */
  gm: { inviteCode: string; rolePlay: RolePlayCard[] } | null;
}
