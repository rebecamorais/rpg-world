import { NextResponse } from 'next/server';

import { getApi } from '@api';

export async function POST() {
  try {
    const { authApi } = await getApi();
    await authApi.signOut();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    console.error('Logout error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}
