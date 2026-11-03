import { parseGoogleDocId } from '@shared/google-docs';

import { PartyError, PartyErrorCodes } from '../domain/PartyError';
import { PartyRepo } from '../domain/repository/party.repo';

/** The GM links a Google Doc as the party journal (or unlinks it with null). */
export class SetJournalUseCase {
  constructor(private readonly repository: PartyRepo) {}

  async execute(partyId: string, userId: string, url: string | null): Promise<void> {
    const party = await this.repository.findParty(partyId);
    if (party?.gmId !== userId) throw new PartyError(PartyErrorCodes.NOT_FOUND);

    if (url === null) return this.repository.setJournal(partyId, null);

    const docId = parseGoogleDocId(url);
    if (!docId) throw new PartyError(PartyErrorCodes.JOURNAL_URL_INVALID);
    await this.repository.setJournal(partyId, docId);
  }
}
