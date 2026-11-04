import { NextRequest } from 'next/server';

import { SESSION_USER, api, jsonRequest, resetApi, routeContext } from '@tests/helpers/mock-api';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { UserError, UserErrorCodes } from '@backend/contexts/users/domain/UserError';

import { POST } from './route';

vi.mock('@api', () => import('@tests/helpers/mock-api'));

const URL_PATH = '/api/profile/deletion-request';

describe('POST /api/profile/deletion-request', () => {
  beforeEach(() => {
    resetApi();
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://rpg.test/');
  });

  afterEach(() => vi.unstubAllEnvs());

  it('responde 401 sem sessão', async () => {
    resetApi(null);

    const res = await POST(
      jsonRequest(URL_PATH, 'POST', { username: 'Hero', password: 'secret' }),
      routeContext(),
    );

    expect(res.status).toBe(401);
    expect(api.authApi.requestAccountDeletion).not.toHaveBeenCalled();
  });

  it('usa a conta da sessão, ignorando ids vindos do body, e responde 204', async () => {
    const res = await POST(
      jsonRequest(URL_PATH, 'POST', {
        username: 'Hero',
        password: 'secret',
        userId: 'someone-else',
        email: 'someone@else.test',
      }),
      routeContext(),
    );

    expect(res.status).toBe(204);
    expect(api.authApi.requestAccountDeletion).toHaveBeenCalledWith(
      { userId: SESSION_USER.id, email: SESSION_USER.email, username: 'Hero', password: 'secret' },
      'https://rpg.test/en/delete-account',
    );
  });

  it('o link usa o idioma da pessoa', async () => {
    const req = new NextRequest(new URL(URL_PATH, 'http://localhost'), {
      method: 'POST',
      body: JSON.stringify({ username: 'Hero' }),
      headers: { 'Content-Type': 'application/json', Cookie: 'NEXT_LOCALE=pt' },
    });

    await POST(req, routeContext());

    expect(api.authApi.requestAccountDeletion.mock.calls[0][1]).toBe(
      'https://rpg.test/pt/delete-account',
    );
  });

  it('idioma desconhecido no cookie não entra na URL', async () => {
    const req = new NextRequest(new URL(URL_PATH, 'http://localhost'), {
      method: 'POST',
      body: JSON.stringify({ username: 'Hero' }),
      headers: { 'Content-Type': 'application/json', Cookie: 'NEXT_LOCALE=evil.test%2F' },
    });

    await POST(req, routeContext());

    expect(api.authApi.requestAccountDeletion.mock.calls[0][1]).toBe(
      'https://rpg.test/en/delete-account',
    );
  });

  it('senha opcional: quem não tem senha manda só o username', async () => {
    const res = await POST(jsonRequest(URL_PATH, 'POST', { username: 'Hero' }), routeContext());

    expect(res.status).toBe(204);
    expect(api.authApi.requestAccountDeletion.mock.calls[0][0].password).toBeUndefined();
  });

  it('senha vazia chega ao caso de uso, que recusa para conta com senha', async () => {
    await POST(jsonRequest(URL_PATH, 'POST', { username: 'Hero', password: '' }), routeContext());

    expect(api.authApi.requestAccountDeletion.mock.calls[0][0].password).toBe('');
  });

  it('não mexe no username: a comparação é exata', async () => {
    await POST(jsonRequest(URL_PATH, 'POST', { username: ' Hero ' }), routeContext());

    expect(api.authApi.requestAccountDeletion.mock.calls[0][0].username).toBe(' Hero ');
  });

  it('erro de conferência responde 400 com o código', async () => {
    api.authApi.requestAccountDeletion.mockRejectedValue(
      new UserError(UserErrorCodes.DELETION_PASSWORD_INVALID),
    );

    const res = await POST(
      jsonRequest(URL_PATH, 'POST', { username: 'Hero', password: 'wrong' }),
      routeContext(),
    );

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: UserErrorCodes.DELETION_PASSWORD_INVALID });
  });

  it('sessão sem e-mail responde 500, sem pedir nada', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    resetApi({ id: SESSION_USER.id });

    const res = await POST(jsonRequest(URL_PATH, 'POST', { username: 'Hero' }), routeContext());

    expect(res.status).toBe(500);
    expect(api.authApi.requestAccountDeletion).not.toHaveBeenCalled();
  });

  it('responde 400 sem username', async () => {
    const res = await POST(jsonRequest(URL_PATH, 'POST', { password: 'x' }), routeContext());

    expect(res.status).toBe(400);
    expect(api.authApi.requestAccountDeletion).not.toHaveBeenCalled();
  });
});
