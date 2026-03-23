import { NextResponse } from 'next/server';

import { getApi } from '@api';

export async function GET(req: Request) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') ?? '/characters';

  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');

  if (error || error_description) {
    return NextResponse.redirect(
      new URL(
        `/auth/error?message=${encodeURIComponent(error_description || error || 'Auth error')}`,
        requestUrl.origin,
      ),
    );
  }

  if (!code) {
    return NextResponse.redirect(
      new URL(`/auth/error?message=No+code+provided`, requestUrl.origin),
    );
  }

  try {
    const { authApi } = await getApi();
    await authApi.callbackExchange(code);

    // Redirect to the intended page or default system dashboard
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  } catch (error) {
    // If exchange fails (e.g., link expired), redirect to error page
    return NextResponse.redirect(
      new URL(
        `/auth/error?message=${encodeURIComponent((error as Error).message)}`,
        requestUrl.origin,
      ),
    );
  }
}
