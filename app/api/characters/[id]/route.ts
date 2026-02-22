import { NextResponse } from 'next/server';
import { GetCharacterUseCase } from '@/backend/contexts/characters/application/get-characters/get-characters.use-case';
import { UpdateCharacterUseCase } from '@/backend/contexts/characters/application/update-character/update-character.use-case';
import { DeleteCharacterUseCase } from '@/backend/contexts/characters/application/delete-character/delete-character.use-case';
import { repo } from '../route';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const useCase = new GetCharacterUseCase(repo);
        const character = await useCase.execute(params.id);

        // Convert Domain Entity to DTO (JSON) via polymorphic encapsulation
        return NextResponse.json(character.toJSON());
    } catch (err: unknown) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Unknown error' },
            { status: 404 }
        );
    }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();

        if (!body.ownerUsername) throw new Error("ownerUsername query is required for update validation");

        const useCase = new UpdateCharacterUseCase(repo);
        const character = await useCase.execute({
            id: params.id,
            ownerUsername: body.ownerUsername,
            updates: body.updates
        });

        return NextResponse.json({ id: character.id });
    } catch (err: unknown) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Unknown error' },
            { status: 400 }
        );
    }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    try {
        const { searchParams } = new URL(req.url);
        const ownerUsername = searchParams.get('ownerUsername');

        if (!ownerUsername) throw new Error("ownerUsername query is required for deletion");

        const useCase = new DeleteCharacterUseCase(repo);
        await useCase.execute(params.id, ownerUsername);

        return NextResponse.json({ deleted: true });
    } catch (err: unknown) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Unknown error' },
            { status: 400 }
        );
    }
}