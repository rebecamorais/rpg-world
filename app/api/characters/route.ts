import { NextResponse } from 'next/server';

import { container } from '@/backend/shared/infrastructure/container';

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

    const characters =
      await container.contexts.character.getByOwner(ownerUsername);

    return NextResponse.json(
      characters.map((c: { toJSON: () => unknown }) => c.toJSON()),
    );
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
    const character = await container.contexts.character.create(body);

    return NextResponse.json({ id: character.id }, { status: 201 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 400 },
    );
  }
}
