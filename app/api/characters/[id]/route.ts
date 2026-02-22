// app/api/characters/[id]/route.ts
import { NextResponse } from 'next/server';
import { GetCharacterUseCase } from '@/backend/contexts/characters/application/get-characters/get-characters.use-case';
import { InMemoryCharacterRepository } from '@/backend/contexts/characters/infrastructure/in-memory-character.repository';

// We instantiate the dependencies once for now (since we use in-memory it must persist across requests in dev mode ideally, but we'll mock it here)
// In a real app with Supabase, this would be a SupabaseRepo
const repo = new InMemoryCharacterRepository();

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const useCase = new GetCharacterUseCase(repo);
        const character = await useCase.execute(params.id);

        // Convert Domain Entity to DTO (JSON)
        return NextResponse.json({
            id: character.id,
            name: character.name,
            system: character.system,
            ownerUsername: character.ownerUsername,
            attributes: character.attributes.getAll(),
            hp: character.hp.status,
            level: character.level
        });
    } catch (err: unknown) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Unknown error' },
            { status: 404 }
        );
    }
}