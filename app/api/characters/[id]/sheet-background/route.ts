import { NextRequest, NextResponse } from 'next/server';

import { getApi } from '@api';

import { errorResponse } from '@shared/http/route-handler';
import { parseInput, uuidParamsSchema } from '@shared/http/validation';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { authApi, charactersApi } = await getApi();
  const user = await authApi.getSessionUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing "file" field' }, { status: 400 });
  }

  try {
    const { id } = parseInput(uuidParamsSchema, await params);
    const url = await charactersApi.uploadSheetBackground(id, user.id, file);
    return NextResponse.json({ url }, { status: 200 });
  } catch (err: unknown) {
    return errorResponse(err);
  }
}
