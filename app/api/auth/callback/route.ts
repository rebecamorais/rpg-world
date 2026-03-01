import { NextResponse } from 'next/server';

import { getApi } from '@api';

export async function GET(req: Request) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/system';

  if (!code) {
    return NextResponse.redirect(
      new URL('/login?error=auth_callback_failed', requestUrl.origin),
    );
  }

  try {
    const { authApi } = await getApi();
    await authApi.callbackExchange(code);

    // Redirect to the intended page or default system dashboard
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  } catch {
    // If exchange fails (e.g., link expired), redirect back to login with error
    return NextResponse.redirect(
      new URL('/login?error=auth_callback_failed', requestUrl.origin),
    );
  }
}
