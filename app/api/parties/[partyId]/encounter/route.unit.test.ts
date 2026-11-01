import { SESSION_USER, api, jsonRequest, resetApi, routeContext } from '@tests/helpers/mock-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PUT as setOrder } from './order/route';
import { PUT as setConditions } from './participants/[participantId]/conditions/route';
import {
  DELETE as removeParticipant,
  PATCH as updateParticipant,
} from './participants/[participantId]/route';
import { POST as addParticipant } from './participants/route';
import { GET, POST as create, DELETE as finish } from './route';
import { POST as start } from './start/route';
import { POST as endTurn } from './turn/route';

vi.mock('@api', () => import('@tests/helpers/mock-api'));

const PARTY = '6f1c2a4e-8b3d-4c5e-9f7a-1b2c3d4e5f60';
const PARTICIPANT = '7a2d3b5f-9c4e-4d6f-8a1b-2c3d4e5f6071';
const CHARACTER = '8b3e4c6a-1d5f-4e7a-9b2c-3d4e5f607182';
const base = `/api/parties/${PARTY}/encounter`;
const party = () => routeContext({ partyId: PARTY });
const row = () => routeContext({ partyId: PARTY, participantId: PARTICIPANT });

describe('/api/parties/[partyId]/encounter', () => {
  beforeEach(() => resetApi());

  it('GET devolve a visão de quem pede; sem combate, 204', async () => {
    api.combatApi.get.mockResolvedValue({ role: 'player', round: 1, turns: [] });
    const res = await GET(jsonRequest(base), party());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ role: 'player', round: 1, turns: [] });
    expect(api.combatApi.get).toHaveBeenCalledWith(PARTY, SESSION_USER.id);

    api.combatApi.get.mockResolvedValue(null);
    expect((await GET(jsonRequest(base), party())).status).toBe(204);
  });

  it('POST prepara (201), DELETE encerra (204), start começa (204)', async () => {
    expect((await create(jsonRequest(base, 'POST'), party())).status).toBe(201);
    expect((await finish(jsonRequest(base, 'DELETE'), party())).status).toBe(204);
    expect((await start(jsonRequest(`${base}/start`, 'POST'), party())).status).toBe(204);
    expect(api.combatApi.create).toHaveBeenCalledWith(PARTY);
    expect(api.combatApi.finish).toHaveBeenCalledWith(PARTY);
    expect(api.combatApi.start).toHaveBeenCalledWith(PARTY);
  });

  it('participantes: POST com quantidade 1 e lado inimigo por padrão; PATCH e DELETE pela linha', async () => {
    const added = await addParticipant(
      jsonRequest(`${base}/participants`, 'POST', { characterId: CHARACTER }),
      party(),
    );
    expect(added.status).toBe(201);
    expect(api.combatApi.addParticipant).toHaveBeenCalledWith(PARTY, CHARACTER, 1, 'enemy');

    await addParticipant(
      jsonRequest(`${base}/participants`, 'POST', { characterId: CHARACTER, side: 'ally' }),
      party(),
    );
    expect(api.combatApi.addParticipant).toHaveBeenLastCalledWith(PARTY, CHARACTER, 1, 'ally');

    const patched = await updateParticipant(
      jsonRequest(`${base}/participants/${PARTICIPANT}`, 'PATCH', { initiative: 12 }),
      row(),
    );
    expect(patched.status).toBe(204);
    expect(api.combatApi.updateParticipant).toHaveBeenCalledWith(PARTY, PARTICIPANT, {
      initiative: 12,
    });

    const removed = await removeParticipant(
      jsonRequest(`${base}/participants/${PARTICIPANT}`, 'DELETE'),
      row(),
    );
    expect(removed.status).toBe(204);
    expect(api.combatApi.removeParticipant).toHaveBeenCalledWith(PARTY, PARTICIPANT);
  });

  it('condições: PUT troca a lista do participante; mais de 20 itens responde 400', async () => {
    const url = `${base}/participants/${PARTICIPANT}/conditions`;
    const conditions = [{ key: 'dnd5e:srd-5.2:condition:prone' }];
    const ok = await setConditions(jsonRequest(url, 'PUT', { conditions }), row());
    expect(ok.status).toBe(204);
    expect(api.combatApi.setConditions).toHaveBeenCalledWith(PARTY, PARTICIPANT, [
      { key: 'dnd5e:srd-5.2:condition:prone', level: null },
    ]);

    api.combatApi.setConditions.mockClear();
    const many = Array.from({ length: 21 }, () => ({ key: 'dnd5e:srd-5.2:condition:prone' }));
    const bad = await setConditions(jsonRequest(url, 'PUT', { conditions: many }), row());
    expect(bad.status).toBe(400);
    expect(api.combatApi.setConditions).not.toHaveBeenCalled();
  });

  it('ordem e turno', async () => {
    const ordered = await setOrder(
      jsonRequest(`${base}/order`, 'PUT', { participantIds: [PARTICIPANT] }),
      party(),
    );
    expect(ordered.status).toBe(204);
    expect(api.combatApi.setOrder).toHaveBeenCalledWith(PARTY, [PARTICIPANT]);

    const ended = await endTurn(
      jsonRequest(`${base}/turn`, 'POST', { participantId: PARTICIPANT }),
      party(),
    );
    expect(ended.status).toBe(204);
    expect(api.combatApi.endTurn).toHaveBeenCalledWith(PARTY, PARTICIPANT);
  });

  it('body inválido responde 400 sem chamar a API', async () => {
    const cases = [
      addParticipant(
        jsonRequest(`${base}/participants`, 'POST', { characterId: CHARACTER, count: 21 }),
        party(),
      ),
      addParticipant(
        jsonRequest(`${base}/participants`, 'POST', { characterId: CHARACTER, side: 'player' }),
        party(),
      ),
      updateParticipant(
        jsonRequest(`${base}/participants/${PARTICIPANT}`, 'PATCH', { hpCurrent: -1 }),
        row(),
      ),
      setOrder(jsonRequest(`${base}/order`, 'PUT', { participantIds: [] }), party()),
      endTurn(jsonRequest(`${base}/turn`, 'POST', { participantId: 'x' }), party()),
    ];
    for (const res of await Promise.all(cases)) expect(res.status).toBe(400);
    expect(api.combatApi.addParticipant).not.toHaveBeenCalled();
    expect(api.combatApi.updateParticipant).not.toHaveBeenCalled();
    expect(api.combatApi.setOrder).not.toHaveBeenCalled();
    expect(api.combatApi.endTurn).not.toHaveBeenCalled();
  });

  it('responde 401 sem sessão', async () => {
    resetApi(null);

    expect((await GET(jsonRequest(base), party())).status).toBe(401);
    expect(api.combatApi.get).not.toHaveBeenCalled();
  });
});
