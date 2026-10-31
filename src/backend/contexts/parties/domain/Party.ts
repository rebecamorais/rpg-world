import { PartyError, PartyErrorCodes } from './PartyError';

/** A person can be the GM of this many parties at most (the database enforces it too). */
export const MAX_GM_PARTIES = 5;
const MAX_NAME_LENGTH = 60;

export type PartyRole = 'gm' | 'player';
export type MemberStatus = 'requested' | 'invited' | 'active';

/** A party as listed for the person asking: their role and where their membership stands. */
export interface PartySummary {
  id: string;
  name: string;
  system: string;
  role: PartyRole;
  status: MemberStatus | 'gm';
  gmUsername: string | null;
  /** Join requests waiting for the GM (0 for players). */
  pendingRequests: number;
}

export interface MyParties {
  asGm: PartySummary[];
  /** Parties the person is an active member of. */
  asPlayer: PartySummary[];
  /** Invitations waiting for the person's answer. */
  invites: PartySummary[];
  /** Join requests of the person, waiting for the GM. */
  requests: PartySummary[];
}

export function partyName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > MAX_NAME_LENGTH) {
    throw new PartyError(PartyErrorCodes.NAME_INVALID);
  }
  return trimmed;
}
