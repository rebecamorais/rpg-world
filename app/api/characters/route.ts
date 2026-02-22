import { NextResponse } from 'next/server';
import { GetCharactersByOwnerUseCase } from '@/backend/contexts/characters/application/get-characters/get-characters-by-owner.use-case';
import { CreateCharacterUseCase } from '@/backend/contexts/characters/application/create-character/create-character.use-case';
import { InMemoryCharacterRepository } from '@/backend/contexts/characters/infrastructure/in-memory-character.repository';

// TODO: Replace with singleton or Supabase adapter later
// Exporting the same instance used in [id] route for consistency in memory
export const repo = new InMemoryCharacterRepository();

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const ownerUsername = searchParams.get('ownerUsername');

        if (!ownerUsername) {
            return NextResponse.json({ error: 'ownerUsername query param is required' }, { status: 400 });
        }

        const useCase = new GetCharactersByOwnerUseCase(repo);
        const characters = await useCase.execute(ownerUsername);

        return NextResponse.json(characters.map(c => c.toJSON()));
    } catch (err: unknown) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const useCase = new CreateCharacterUseCase(repo);
        const character = await useCase.execute({
            id: body.id || crypto.randomUUID(),
            name: body.name,
            ownerUsername: body.ownerUsername,
            system: body.system || 'DnD_5e',
            characterClass: body.class,
            race: body.race,
            level: body.level || 1
        });

        return NextResponse.json({ id: character.id }, { status: 201 });
    } catch (err: unknown) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Unknown error' },
            { status: 400 }
        );
    }
}
