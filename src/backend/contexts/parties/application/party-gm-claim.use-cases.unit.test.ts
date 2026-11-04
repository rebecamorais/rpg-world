import { describe, expect, it, vi } from 'vitest';

import { PartyError, PartyErrorCodes } from '../domain/PartyError';
import { PartyRepo } from '../domain/repository/party.repo';
import {
  CancelGmClaimUseCase,
  ClaimPartyGmUseCase,
  VoteGmClaimUseCase,
} from './party-gm-claim.use-cases';

const makeRepo = () => ({
  claimGm: vi.fn<PartyRepo['claimGm']>().mockResolvedValue('pending'),
  voteGmClaim: vi.fn<PartyRepo['voteGmClaim']>().mockResolvedValue('pending'),
  cancelGmClaim: vi.fn<PartyRepo['cancelGmClaim']>().mockResolvedValue(undefined),
});

describe('pedido de mestre', () => {
  it('pedir devolve o que o banco respondeu', async () => {
    const repo = makeRepo();
    repo.claimGm.mockResolvedValue('approved');

    expect(await new ClaimPartyGmUseCase(repo as unknown as PartyRepo).execute('p')).toBe(
      'approved',
    );
    expect(repo.claimGm).toHaveBeenCalledWith('p');
  });

  it.each([
    [true, 'pending'],
    [false, 'cancelled'],
  ] as const)('votar accept=%s devolve %s', async (accept, status) => {
    const repo = makeRepo();
    repo.voteGmClaim.mockResolvedValue(status);

    expect(await new VoteGmClaimUseCase(repo as unknown as PartyRepo).execute('p', accept)).toBe(
      status,
    );
    expect(repo.voteGmClaim).toHaveBeenCalledWith('p', accept);
  });

  it('desistir chama o banco', async () => {
    const repo = makeRepo();

    await new CancelGmClaimUseCase(repo as unknown as PartyRepo).execute('p');

    expect(repo.cancelGmClaim).toHaveBeenCalledWith('p');
  });

  it('os erros do banco chegam traduzidos, sem mudar', async () => {
    const repo = makeRepo();
    repo.claimGm.mockRejectedValue(new PartyError(PartyErrorCodes.HAS_GM));
    repo.voteGmClaim.mockRejectedValue(new PartyError(PartyErrorCodes.CANNOT_VOTE));
    repo.cancelGmClaim.mockRejectedValue(new PartyError(PartyErrorCodes.CLAIM_NOT_FOUND));
    const asRepo = repo as unknown as PartyRepo;

    await expect(new ClaimPartyGmUseCase(asRepo).execute('p')).rejects.toMatchObject({
      message: PartyErrorCodes.HAS_GM,
    });
    await expect(new VoteGmClaimUseCase(asRepo).execute('p', true)).rejects.toMatchObject({
      message: PartyErrorCodes.CANNOT_VOTE,
    });
    await expect(new CancelGmClaimUseCase(asRepo).execute('p')).rejects.toMatchObject({
      message: PartyErrorCodes.CLAIM_NOT_FOUND,
    });
  });
});
