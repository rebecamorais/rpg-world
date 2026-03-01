import { NextResponse } from 'next/server';

import { getApi } from '@api';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Use absolute URL for the callback
    const requestUrl = new URL(req.url);
    const redirectTo = `${requestUrl.origin}/api/auth/callback`;

    const { authApi } = await getApi();
    await authApi.signInWithMagicLink(email, redirectTo);

    return NextResponse.json(
      { message: 'Magic link sent successfully' },
      { status: 200 },
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
