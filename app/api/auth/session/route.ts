import { NextResponse } from 'next/server';

import { getApi } from '@api';

export async function GET() {
  try {
    const { authApi } = await getApi();
    const user = await authApi.getSessionUser();

    if (!user) {
      return NextResponse.json(null, { status: 401 });
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error) {
    console.error('Session API Error:', error);
    return NextResponse.json(null, { status: 500 });
  }
}
