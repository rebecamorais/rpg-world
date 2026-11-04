import { GmClaimStatus, PartyRepo } from '../domain/repository/party.repo';

/** An active player asks to become the GM of a party without one. */
export class ClaimPartyGmUseCase {
  constructor(private readonly repository: PartyRepo) {}

  execute(partyId: string): Promise<GmClaimStatus> {
    return this.repository.claimGm(partyId);
  }
}

/** The other active players accept; a refusal ends the request. */
export class VoteGmClaimUseCase {
  constructor(private readonly repository: PartyRepo) {}

  execute(partyId: string, accept: boolean): Promise<GmClaimStatus> {
    return this.repository.voteGmClaim(partyId, accept);
  }
}

/** The candidate gives up. */
export class CancelGmClaimUseCase {
  constructor(private readonly repository: PartyRepo) {}

  execute(partyId: string): Promise<void> {
    return this.repository.cancelGmClaim(partyId);
  }
}
