import { PartySummary } from '../Party';

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
}
