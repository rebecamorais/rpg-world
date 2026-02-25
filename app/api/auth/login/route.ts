import { NextResponse } from 'next/server';

import { getOrCreateUser } from '@/backend/store/memory-store';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.username) {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 },
      );
    }

    // Temporary implementation using memory store directly
    // This will be replaced by container.contexts.user later
    const user = getOrCreateUser(body.username, body.displayName);

    return NextResponse.json(user, { status: 200 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
