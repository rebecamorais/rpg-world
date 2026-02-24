import { NextResponse } from 'next/server';

import { container } from '@/backend/shared/infrastructure/container';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const character = await container.contexts.character.getById(id);

    return NextResponse.json(character.toJSON());
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

    const character = await container.contexts.character.update(
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

    await container.contexts.character.delete(id, ownerUsername);

    return NextResponse.json({ deleted: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 400 },
    );
  }
}
