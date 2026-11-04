import { NextRequest } from 'next/server';

import { api, jsonRequest, resetApi, routeContext } from '@tests/helpers/mock-api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { UserError, UserErrorCodes } from '@backend/contexts/users/domain/UserError';

import * as route from './route';

vi.mock('@api', () => import('@tests/helpers/mock-api'));

const URL_PATH = '/api/account/delete';
const TOKEN = 'a-valid-looking-token';

describe('POST /api/account/delete', () => {
  beforeEach(() => resetApi());

  it('não exige sessão: exclui pelo token e responde 204', async () => {
    resetApi(null);

    const res = await route.POST(jsonRequest(URL_PATH, 'POST', { token: TOKEN }), routeContext());

    expect(res.status).toBe(204);
    expect(api.authApi.deleteAccount).toHaveBeenCalledWith(TOKEN);
  });

  it('encerra a sessão da conta excluída (que já não resolve) depois de excluir', async () => {
    api.authApi.getSessionUser.mockResolvedValue(null);
    const res = await route.POST(jsonRequest(URL_PATH, 'POST', { token: TOKEN }), routeContext());

    expect(res.status).toBe(204);
    expect(api.authApi.signOut).toHaveBeenCalledOnce();
    expect(api.authApi.deleteAccount.mock.invocationCallOrder[0]).toBeLessThan(
      api.authApi.signOut.mock.invocationCallOrder[0],
    );
  });

  it('sessão de outra conta aberta neste navegador continua: não encerra', async () => {
    // Still resolves after the deletion, so it is not the deleted account's
    const res = await route.POST(jsonRequest(URL_PATH, 'POST', { token: TOKEN }), routeContext());

    expect(res.status).toBe(204);
    expect(api.authApi.deleteAccount).toHaveBeenCalledWith(TOKEN);
    expect(api.authApi.signOut).not.toHaveBeenCalled();
  });

  it('falha ao encerrar a sessão não vira erro: a conta já foi excluída', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    api.authApi.getSessionUser.mockResolvedValue(null);
    api.authApi.signOut.mockRejectedValue(new Error('connect ECONNREFUSED'));

    const res = await route.POST(jsonRequest(URL_PATH, 'POST', { token: TOKEN }), routeContext());

    expect(res.status).toBe(204);
    expect(consoleError).toHaveBeenCalled();
    expect(JSON.stringify(consoleError.mock.calls)).not.toContain(TOKEN);
  });

  it('link inválido responde 400 com o código, sem encerrar a sessão', async () => {
    api.authApi.deleteAccount.mockRejectedValue(
      new UserError(UserErrorCodes.DELETION_LINK_INVALID),
    );

    const res = await route.POST(jsonRequest(URL_PATH, 'POST', { token: TOKEN }), routeContext());

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: UserErrorCodes.DELETION_LINK_INVALID });
    expect(api.authApi.signOut).not.toHaveBeenCalled();
  });

  it('responde 400 sem token', async () => {
    const res = await route.POST(jsonRequest(URL_PATH, 'POST', {}), routeContext());

    expect(res.status).toBe(400);
    expect(api.authApi.deleteAccount).not.toHaveBeenCalled();
  });

  it('recusa corpo que não é JSON, que um formulário de outro site poderia enviar', async () => {
    const res = await route.POST(
      new NextRequest(new URL(URL_PATH, 'http://localhost'), {
        method: 'POST',
        body: JSON.stringify({ token: TOKEN }),
        headers: { 'Content-Type': 'text/plain' },
      }),
      routeContext(),
    );

    expect(res.status).toBe(400);
    expect(api.authApi.deleteAccount).not.toHaveBeenCalled();
  });

  it('só existe POST: abrir a URL nunca exclui', () => {
    expect(Object.keys(route)).toEqual(['POST']);
  });
});
