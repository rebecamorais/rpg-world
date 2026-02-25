import { NextResponse } from 'next/server';

import { api } from '@api';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const character = await api.characters.getById(id);

    return NextResponse.json(character);
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 404 },
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (!body.ownerUsername)
      throw new Error('ownerUsername query is required for update validation');

    const character = await api.characters.update(
      id,
      body.ownerUsername,
      body.updates,
    );

    return NextResponse.json({ id: character.id });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 400 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const ownerUsername = searchParams.get('ownerUsername');

    if (!ownerUsername)
      throw new Error('ownerUsername query is required for deletion');

    await api.characters.delete(id, ownerUsername);

    return NextResponse.json({ deleted: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 400 },
    );
  }
}
