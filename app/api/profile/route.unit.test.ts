import { SESSION_USER, api, jsonRequest, resetApi, routeContext } from '@tests/helpers/mock-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { GET, PATCH } from './route';

vi.mock('@api', () => import('@tests/helpers/mock-api'));

describe('/api/profile', () => {
  beforeEach(() => resetApi());

  it('GET devolve o perfil do usuário da sessão', async () => {
    api.profileApi.getProfile.mockResolvedValue({ id: SESSION_USER.id, username: 'hero' });

    const res = await GET(jsonRequest('/api/profile'), routeContext());

    expect(await res.json()).toEqual({ id: SESSION_USER.id, username: 'hero' });
    expect(api.profileApi.getProfile).toHaveBeenCalledWith(SESSION_USER.id);
  });

  it('PATCH atualiza o perfil da sessão, ignorando um id vindo do body, e responde 204', async () => {
    const res = await PATCH(
      jsonRequest('/api/profile', 'PATCH', { username: 'new-name', id: 'someone-else' }),
      routeContext(),
    );

    expect(res.status).toBe(204);
    expect(api.profileApi.updateProfile).toHaveBeenCalledWith({
      username: 'new-name',
      id: SESSION_USER.id,
    });
  });

  it('PATCH com o nome vazio repassa o vazio, que apaga o nome', async () => {
    const res = await PATCH(
      jsonRequest('/api/profile', 'PATCH', { fullName: '', primaryColor: '#ef4444' }),
      routeContext(),
    );

    expect(res.status).toBe(204);
    // The theme color left the profile: it doesn't reach the use case
    expect(api.profileApi.updateProfile).toHaveBeenCalledWith({
      fullName: '',
      id: SESSION_USER.id,
    });
  });

  it('responde 401 sem sessão', async () => {
    resetApi(null);

    const res = await GET(jsonRequest('/api/profile'), routeContext());

    expect(res.status).toBe(401);
  });
});
