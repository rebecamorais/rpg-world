import { beforeEach, describe, expect, it } from 'vitest';

import { inviteCode } from '../../../../../test/helpers/parties';
import { createSignedInClient } from '../../../../../test/helpers/signed-in-client';
import { PartyErrorCodes } from '../domain/PartyError';
import { SupabasePartyRepository } from './supabase-party.repository';

type Session = Awaited<ReturnType<typeof createSignedInClient>>;

describe('SupabasePartyRepository (Integration)', () => {
  let gm: Session;
  let stranger: Session;

  beforeEach(async () => {
    gm = await createSignedInClient('gm');
    stranger = await createSignedInClient('stranger');
  });

  it('cria, renomeia, troca o código e apaga a mesa do mestre', async () => {
    const repo = new SupabasePartyRepository(gm.client);

    const id = await repo.create(gm.userId, 'Mesa');
    expect(await repo.rename(id, 'Mesa Nova')).toBe(true);
    const code = crypto.randomUUID().replaceAll('-', '');
    expect(await repo.setInviteCode(id, code)).toBe(true);
    expect(await inviteCode(id)).toBe(code);

    expect(await repo.listMine()).toEqual([
      {
        id,
        name: 'Mesa Nova',
        system: 'dnd_5e',
        role: 'gm',
        status: 'gm',
        gmUsername: null,
        pendingRequests: 0,
      },
    ]);
    expect(await repo.delete(id)).toBe(true);
    expect(await repo.listMine()).toEqual([]);
  });

  it('em mesa alheia renomear, trocar o código e apagar respondem false', async () => {
    const id = await new SupabasePartyRepository(gm.client).create(gm.userId, 'Mesa');
    const repo = new SupabasePartyRepository(stranger.client);

    expect(await repo.rename(id, 'X')).toBe(false);
    expect(await repo.setInviteCode(id, crypto.randomUUID().replaceAll('-', ''))).toBe(false);
    expect(await repo.delete(id)).toBe(false);
  });

  it('traduz party_gm_limit para PartyError GM_LIMIT', async () => {
    const repo = new SupabasePartyRepository(gm.client);
    for (let i = 1; i <= 5; i++) await repo.create(gm.userId, `Mesa ${i}`);

    const error = await repo.create(gm.userId, 'Mesa 6').catch((e) => e);

    expect(error.code).toBe(PartyErrorCodes.GM_LIMIT);
  });
});
