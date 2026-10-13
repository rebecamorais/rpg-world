import { NextRequest, NextResponse } from 'next/server';

import { getApi } from '@api';

import { errorResponse } from '@shared/http/route-handler';
import { parseInput, uuidParamsSchema } from '@shared/http/validation';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

  const file = formData.get('file');

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'Missing "file" field' }, { status: 400 });
  }

  // 3. Process upload via characters API
  try {
    const { id } = parseInput(uuidParamsSchema, await params);
    const { charactersApi } = await getApi();
    const publicUrl = await charactersApi.uploadAvatar(id, user.id, file);

    return NextResponse.json({ url: publicUrl }, { status: 200 });
  } catch (err: unknown) {
    return errorResponse(err);
  }
}
