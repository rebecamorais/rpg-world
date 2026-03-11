import { NextResponse } from 'next/server';

import 'server-only';

import { getApi } from '@api';

import type { User } from '@shared/types/user';

type RouteContext = { params: Promise<Record<string, string>> };

type BaseHandler<B = void> = (
  body: B extends void ? undefined : B,
  ctx: RouteContext,
) => Promise<unknown>;

type AuthenticatedHandler<B = void> = (
  user: User,
  body: B extends void ? undefined : B,
  ctx: RouteContext,
) => Promise<unknown>;

// Shared internal handler runner
async function runHandler<B>(
  req: Request,
  ctx: RouteContext,
  handler: (body: B extends void ? undefined : B, ctx: RouteContext) => Promise<unknown>,
  successStatus: number,
) {
  try {
    const hasBody = ['POST', 'PUT', 'PATCH'].includes(req.method);
    const body = hasBody ? ((await req.json()) as B) : undefined;

    const result = await handler(body as B extends void ? undefined : B, ctx);

    if (result === null || result === undefined) {
      return new Response(null, { status: 204 });
    }

    return NextResponse.json(result, { status: successStatus });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = (err as { status?: number }).status ?? 400;
    return NextResponse.json({ error: message }, { status });
  }
}

/**
 * Base handler wrapper: no auth required.
 * Handles req.json(), NextResponse, try/catch, and status codes.
 *
 * Usage:
 *   export const GET = withHandler(async (_body, ctx) => {
 *     const { id } = await ctx.params;
 *     return someApi.getPublicData(id);
 *   });
 */
export function withHandler<B = void>(handler: BaseHandler<B>, successStatus = 200) {
  return (req: Request, ctx: RouteContext) => runHandler<B>(req, ctx, handler, successStatus);
}

/**
 * Authenticated handler wrapper: validates session → auto 401.
 * Builds on withHandler, also injects `user` resolved from session.
 *
 * Usage:
 *   export const POST = withAuth<CreateBody>(async (user, body) => {
 *     return someApi.create({ ...body, ownerId: user.id });
 *   }, 201);
 */
export function withAuth<B = void>(handler: AuthenticatedHandler<B>, successStatus = 200) {
  return async (req: Request, ctx: RouteContext) => {
    const { authApi } = await getApi();
    const user = await authApi.getSessionUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return runHandler<B>(req, ctx, (body, c) => handler(user, body, c), successStatus);
  };
}
