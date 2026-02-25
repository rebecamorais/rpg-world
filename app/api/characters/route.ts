import { NextResponse } from 'next/server';

import { api } from '@api';

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

    const characters = await api.characters.getByOwner(ownerUsername);

    return NextResponse.json(characters);
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
    const character = await api.characters.create(body);

    return NextResponse.json({ id: character.id }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 400 },
    );
  }
}
