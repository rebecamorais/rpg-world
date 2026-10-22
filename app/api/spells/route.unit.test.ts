import { api, jsonRequest, resetApi, routeContext } from '@tests/helpers/mock-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET } from './route';

vi.mock('@api', () => import('@tests/helpers/mock-api'));

describe('GET /api/spells', () => {
  beforeEach(() => resetApi());

  it('converte a query string em filtros tipados', async () => {
    api.spellsApi.getAllSpells.mockResolvedValue({ data: [], total: 0 });

    const res = await GET(
      jsonRequest('/api/spells?locale=pt&page=2&limit=20&level=3&school=&search=fire'),
      routeContext(),
    );

    expect(res.status).toBe(200);
    expect(api.spellsApi.getAllSpells).toHaveBeenCalledWith({
      locale: 'pt',
      page: 2,
      limit: 20,
      level: 3,
      search: 'fire',
      school: undefined,
      class: undefined,
      damageType: undefined,
      edition: undefined,
    });
  });

  it('aceita a edição', async () => {
    api.spellsApi.getAllSpells.mockResolvedValue({ data: [], total: 0 });

    await GET(jsonRequest('/api/spells?edition=2024'), routeContext());

    expect(api.spellsApi.getAllSpells).toHaveBeenCalledWith(
      expect.objectContaining({ edition: '2024' }),
    );
  });

  it('responde 400 com edição desconhecida', async () => {
    const res = await GET(jsonRequest('/api/spells?edition=1999'), routeContext());

    expect(res.status).toBe(400);
    expect(api.spellsApi.getAllSpells).not.toHaveBeenCalled();
  });

  it('aplica os valores padrão sem query', async () => {
    api.spellsApi.getAllSpells.mockResolvedValue({ data: [], total: 0 });

    await GET(jsonRequest('/api/spells'), routeContext());

    expect(api.spellsApi.getAllSpells).toHaveBeenCalledWith(
      expect.objectContaining({ locale: 'en', page: 0, limit: 12 }),
    );
  });

  it('responde 400 com limite acima do máximo', async () => {
    const res = await GET(jsonRequest('/api/spells?limit=500'), routeContext());

    expect(res.status).toBe(400);
    expect(api.spellsApi.getAllSpells).not.toHaveBeenCalled();
  });

  it('responde 401 sem sessão', async () => {
    resetApi(null);

    const res = await GET(jsonRequest('/api/spells'), routeContext());

    expect(res.status).toBe(401);
  });
});
