import { NextRequest, NextResponse } from 'next/server';

import 'server-only';
import { z } from 'zod';

import { getApi } from '@api';

import type { User } from '@shared/types/user';

import { errorToHttp } from './error-response';
import { InvalidRequestError, parseInput } from './validation';

type RouteContext = { params: Promise<Record<string, string>> };

type Schema = z.ZodType | undefined;
type Parsed<S extends Schema> = S extends z.ZodType ? z.output<S> : undefined;

export interface HandlerOptions<B extends Schema, P extends Schema> {
  /** Success status code (default 200; empty results always answer 204). */
  status?: number;
  /** Request body schema. Without it the handler gets no body at all. */
  body?: B;
  /** Route params schema (e.g. `{ id: z.uuid() }`). */
  params?: P;
}

interface HandlerInput<B extends Schema, P extends Schema> {
  req: NextRequest;
  body: Parsed<B>;
  params: Parsed<P>;
}

type BaseHandler<B extends Schema, P extends Schema> = (
  input: HandlerInput<B, P>,
) => Promise<unknown>;

type AuthenticatedHandler<B extends Schema, P extends Schema> = (
  input: HandlerInput<B, P> & { user: User },
) => Promise<unknown>;

/**
 * Only `application/json` bodies are read. A cross-site form can post text/plain, urlencoded or
 * multipart without a CORS preflight, and req.json() would parse any of them (login CSRF).
 */
function isJsonContentType(req: NextRequest): boolean {
  const mediaType = req.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
  return mediaType === 'application/json';
}

async function readJson(req: NextRequest): Promise<unknown> {
  if (!isJsonContentType(req)) {
    throw new InvalidRequestError([{ path: '', message: 'Content-Type must be application/json' }]);
  }

  try {
    return await req.json();
  } catch {
    throw new InvalidRequestError([{ path: '', message: 'Body must be valid JSON' }]);
  }
}

async function parseRequest<B extends Schema, P extends Schema>(
  req: NextRequest,
  ctx: RouteContext,
  options: HandlerOptions<B, P>,
): Promise<HandlerInput<B, P>> {
  const body = options.body ? parseInput(options.body, await readJson(req)) : undefined;
  const params = options.params ? parseInput(options.params, await ctx.params) : undefined;
  return { req, body: body as Parsed<B>, params: params as Parsed<P> };
}

function toResponse(result: unknown, status: number) {
  if (result === null || result === undefined) {
    return new Response(null, { status: 204 });
  }
  return NextResponse.json(result, { status });
}

/** JSON error response for routes that can't use withHandler/withAuth (e.g. multipart uploads). */
export function errorResponse(err: unknown) {
  const { status, body } = errorToHttp(err);
  return NextResponse.json(body, { status });
}

/**
 * Base handler wrapper: no auth required.
 * Validates input, handles NextResponse, try/catch and status codes.
 */
export function withHandler<B extends Schema = undefined, P extends Schema = undefined>(
  handler: BaseHandler<B, P>,
  options: HandlerOptions<B, P> = {},
) {
  return async (req: NextRequest, ctx: RouteContext) => {
    try {
      const input = await parseRequest(req, ctx, options);
      return toResponse(await handler(input), options.status ?? 200);
    } catch (err: unknown) {
      return errorResponse(err);
    }
  };
}

/**
 * Authenticated handler wrapper: validates session → auto 401, then behaves like withHandler
 * and also injects the session `user`.
 */
export function withAuth<B extends Schema = undefined, P extends Schema = undefined>(
  handler: AuthenticatedHandler<B, P>,
  options: HandlerOptions<B, P> = {},
) {
  return async (req: NextRequest, ctx: RouteContext) => {
    const { authApi } = await getApi();
    const user = await authApi.getSessionUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const input = await parseRequest(req, ctx, options);
      return toResponse(await handler({ ...input, user }), options.status ?? 200);
    } catch (err: unknown) {
      return errorResponse(err);
    }
  };
}
