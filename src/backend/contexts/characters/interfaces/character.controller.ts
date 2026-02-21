// src/backend/contexts/characters/interfaces/character.controller.ts
import { GetCharacterUseCase } from '../application';
import { InMemoryCharacterRepository } from '../infrastructure/in-memory-character.repository';
import { NextResponse } from 'next/server';

export class CharacterController {
    static async getById(id: string) {
        try {
            const repository = new InMemoryCharacterRepository();
            const service = new GetCharacterUseCase(repository);
            const data = await service.execute(id);

            return NextResponse.json(data);
        } catch (err: unknown) {
            return NextResponse.json({ error: (err as Error).message }, { status: 404 });
        }
    }
}