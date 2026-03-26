import { NextRequest, NextResponse } from 'next/server';

import { getApi } from '@api';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // 1. Validate session
  const { authApi } = await getApi();
  const user = await authApi.getSessionUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Parse form data
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('avatar');

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'Missing "avatar" file field' }, { status: 400 });
  }

  // 3. Process upload via characters API
  try {
    const { charactersApi } = await getApi();
    const publicUrl = await charactersApi.uploadAvatar(id, user.id, file);

    return NextResponse.json({ url: publicUrl }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Upload failed';
    const status = message.includes('Unauthorized')
      ? 403
      : message.includes('large') || message.includes('type')
        ? 422
        : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
