import { NextResponse } from 'next/server';

import { getApi } from '@api';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ownerUsername = searchParams.get('ownerUsername');

    if (!ownerUsername) {
      return NextResponse.json(
        { error: 'ownerUsername query param is required' },
        { status: 400 },
      );
    }
    const { charactersApi } = await getApi();
    const result = await charactersApi.getByOwner(ownerUsername);

    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { charactersApi } = await getApi();
    const character = await charactersApi.create(body);

    return NextResponse.json({ id: character.id }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 400 },
    );
  }
}
