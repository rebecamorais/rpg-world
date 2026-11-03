import { NextRequest, NextResponse } from 'next/server';

import { getApi } from '@api';

import { partyParamsSchema } from '@backend/contexts/parties/interfaces/parties.schemas';

import { errorResponse, withAuth } from '@shared/http/route-handler';
import { parseInput } from '@shared/http/validation';

/** The GM uploads the party's picture; it is saved on the party at once. Answers with its URL. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ partyId: string }> }) {
  const { authApi } = await getApi();
  const user = await authApi.getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
    const { partyId } = parseInput(partyParamsSchema, await params);
    const { partiesApi } = await getApi();
    return NextResponse.json(await partiesApi.uploadImage(partyId, user.id, file));
  } catch (err: unknown) {
    return errorResponse(err);
  }
}

export const DELETE = withAuth(
  async ({ user, params }) => {
    const { partiesApi } = await getApi();
    await partiesApi.removeImage(params.partyId, user.id);
    return null; // → 204 No Content
  },
  { params: partyParamsSchema },
);
