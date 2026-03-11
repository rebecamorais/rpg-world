import { NextResponse } from 'next/server';

import { getApi } from '@api';

export async function POST(req: Request) {
  try {
    const { newPassword } = await req.json();

    if (!newPassword) {
      return NextResponse.json({ error: 'New password is required' }, { status: 400 });
    }

    const { authApi } = await getApi();
    await authApi.updatePassword(newPassword);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 400 },
    );
  }
}
