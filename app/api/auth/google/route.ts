import { NextResponse } from 'next/server';

import { getContainer } from '@backend/shared/providers/get-container';

export async function GET(req: Request) {
  const requestUrl = new URL(req.url);

  // Bypasses getApi() because we only need the OAuth URL from the Supabase SDK
  const container = await getContainer();
  const userClient = container.get('userClient');

  const { data, error } = await userClient.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${requestUrl.origin}/api/auth/callback`,
    },
  });

  if (error || !data.url) {
    return NextResponse.redirect(
      new URL(
        `/auth/error?message=${encodeURIComponent(error?.message || 'Failed to initialize Google OAuth')}`,
        requestUrl.origin,
      ),
    );
  }

  // Redirect to the Google OAuth URL generator
  return NextResponse.redirect(data.url);
}
