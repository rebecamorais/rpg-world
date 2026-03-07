import { NextResponse } from 'next/server';

import { getContainer } from '@backend/shared/infrastructure/get-container';

export async function GET(req: Request) {
  const requestUrl = new URL(req.url);

  // Use the container to get the authenticating client
  // Here we bypass getApi() because we just need to get the URL from Supabase SDK directly
  const container = await getContainer();
  const authClient = container.get('authClient');

  const { data, error } = await authClient.auth.signInWithOAuth({
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
