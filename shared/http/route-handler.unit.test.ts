import { NextRequest } from 'next/server';

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import { AppError } from '@backend/shared/domain/AppError';

import { UNEXPECTED_ERROR } from './error-response';
import { errorResponse, withAuth, withHandler } from './route-handler';
import { INVALID_REQUEST, uuidParamsSchema } from './validation';

const getSessionUser = vi.fn();

vi.mock('@api', () => ({
  getApi: async () => ({ authApi: { getSessionUser } }),
}));

const USER = { id: 'user-1', email: 'hero@example.com' };
const CHARACTER_ID = '6f1c2a4e-8b3d-4c5e-9f7a-1b2c3d4e5f60';
const bodySchema = z.object({ name: z.string().min(1) });

function request(body?: string) {
  return new NextRequest('http://localhost/api/test', {
    method: body === undefined ? 'GET' : 'POST',
    body,
  });
}

function context(params: Record<string, string> = {}) {
  return { params: Promise.resolve(params) };
}

describe('withHandler', () => {
  it('responde 200 com o JSON retornado pelo handler', async () => {
    const route = withHandler(async () => ({ ok: true }));
    const res = await route(request(), context());

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });

  it('usa o status configurado', async () => {
    const route = withHandler(async () => ({ id: 1 }), { status: 201 });
    const res = await route(request(), context());

    expect(res.status).toBe(201);
  });

  it.each([null, undefined])(
    'responde 204 sem corpo quando o handler retorna %s',
    async (value) => {
      const route = withHandler(async () => value, { status: 201 });
      const res = await route(request(), context());

      expect(res.status).toBe(204);
      expect(await res.text()).toBe('');
    },
  );

  it('entrega ao handler o body validado, sem chaves desconhecidas', async () => {
    const handler = vi.fn(async () => ({}));
    const route = withHandler(handler, { body: bodySchema });
    await route(request(JSON.stringify({ name: 'Hero', admin: true })), context());

    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ body: { name: 'Hero' } }));
  });

  it('não lê o body quando a rota não declara schema', async () => {
    const handler = vi.fn(async () => ({}));
    const route = withHandler(handler);
    await route(request('not json'), context());

    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ body: undefined }));
  });

  it('responde 400 quando o body não é JSON válido', async () => {
    const handler = vi.fn();
    const route = withHandler(handler, { body: bodySchema });
    const res = await route(request('{ not json'), context());

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: INVALID_REQUEST,
      issues: [{ path: '', message: 'Body must be valid JSON' }],
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it('responde 400 com os campos inválidos quando o body não segue o schema', async () => {
    const handler = vi.fn();
    const route = withHandler(handler, { body: bodySchema });
    const res = await route(request(JSON.stringify({ name: '' })), context());

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe(INVALID_REQUEST);
    expect(json.issues.map((issue: { path: string }) => issue.path)).toEqual(['name']);
    expect(handler).not.toHaveBeenCalled();
  });

  it('valida os params da rota', async () => {
    const handler = vi.fn(async () => ({}));
    const route = withHandler(handler, { params: uuidParamsSchema });

    const invalid = await route(request(), context({ id: 'not-a-uuid' }));
    expect(invalid.status).toBe(400);
    expect(handler).not.toHaveBeenCalled();

    const valid = await route(request(), context({ id: CHARACTER_ID }));
    expect(valid.status).toBe(200);
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({ params: { id: CHARACTER_ID } }));
  });

  it.each([
    ['validation', 400],
    ['not_found', 404],
    ['forbidden', 403],
  ] as const)('traduz AppError do tipo %s para %i', async (kind, status) => {
    const route = withHandler(async () => {
      throw new AppError('some_error_code', kind);
    });
    const res = await route(request(), context());

    expect(res.status).toBe(status);
    expect(await res.json()).toEqual({ error: 'some_error_code' });
  });

  it('responde 500 genérico sem vazar a mensagem de um erro inesperado', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const route = withHandler(async () => {
      throw new Error('relation "characters" does not exist');
    });
    const res = await route(request(), context());

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: UNEXPECTED_ERROR });
  });
});

describe('withAuth', () => {
  beforeEach(() => {
    getSessionUser.mockReset();
  });

  it('responde 401 sem chamar o handler quando não há sessão', async () => {
    getSessionUser.mockResolvedValue(null);
    const handler = vi.fn();
    const route = withAuth(handler, { body: bodySchema });
    const res = await route(request(JSON.stringify({ name: 'Hero' })), context());

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'Unauthorized' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('checa a sessão antes de validar o input', async () => {
    getSessionUser.mockResolvedValue(null);
    const route = withAuth(vi.fn(), { body: bodySchema });
    const res = await route(request('{ not json'), context());

    expect(res.status).toBe(401);
  });

  it('injeta o usuário da sessão junto com body e params validados', async () => {
    getSessionUser.mockResolvedValue(USER);
    const handler = vi.fn(async () => ({ ok: true }));
    const route = withAuth(handler, { body: bodySchema, params: uuidParamsSchema, status: 201 });
    const res = await route(
      request(JSON.stringify({ name: 'Hero' })),
      context({ id: CHARACTER_ID }),
    );

    expect(res.status).toBe(201);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({ user: USER, body: { name: 'Hero' }, params: { id: CHARACTER_ID } }),
    );
  });

  it('responde 400 quando o usuário está logado mas o input é inválido', async () => {
    getSessionUser.mockResolvedValue(USER);
    const handler = vi.fn();
    const route = withAuth(handler, { body: bodySchema });
    const res = await route(request(JSON.stringify({})), context());

    expect(res.status).toBe(400);
    expect(handler).not.toHaveBeenCalled();
  });

  it('traduz erros do handler como o withHandler', async () => {
    getSessionUser.mockResolvedValue(USER);
    const route = withAuth(async () => {
      throw new AppError('character_error_access_forbidden', 'forbidden');
    });
    const res = await route(request(), context());

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: 'character_error_access_forbidden' });
  });

  it('responde 204 quando o handler não retorna nada', async () => {
    getSessionUser.mockResolvedValue(USER);
    const route = withAuth(async () => undefined);
    const res = await route(request(), context());

    expect(res.status).toBe(204);
  });
});

describe('errorResponse', () => {
  it('monta a resposta JSON a partir do erro', async () => {
    const res = errorResponse(new AppError('lore_error_not_found', 'not_found'));

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'lore_error_not_found' });
  });
});
