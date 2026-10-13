import { NextResponse } from 'next/server';

import { getApi } from '@api';

import { errorResponse } from '@shared/http/route-handler';

export async function POST(req: Request) {
  // Validate session via the auth API
  const { authApi } = await getApi();
  const user = await authApi.getSessionUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse the multipart form data
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file');

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'Missing "file" field' }, { status: 400 });
  }

  try {
    const { profileApi } = await getApi();
    const { avatarUrl } = await profileApi.uploadAvatar(user.id, file);

    return NextResponse.json({ url: avatarUrl }, { status: 200 });
  } catch (err: unknown) {
    return errorResponse(err);
  }
}
