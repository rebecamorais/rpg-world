import { describe, it, expect, beforeEach } from 'vitest';
import { GetCharacterUseCase } from './get-characters.use-case';
import { InMemoryCharacterRepository } from '../../infrastructure/in-memory-character.repository';
import { Character } from '../../domain/entity/Character';

class MockCharacter extends Character {
    getCombatStats() {
        return {};
    }
}

describe('GetCharacterUseCase (Integration)', () => {
    let repo: InMemoryCharacterRepository;
    let useCase: GetCharacterUseCase;

    beforeEach(() => {
        repo = new InMemoryCharacterRepository();
        useCase = new GetCharacterUseCase(repo);
    });

    it('deve retornar um personagem existente', async () => {
        // Mock Setup
        const mockChar = new MockCharacter('char-123', 'Hero', 'Generic', 'user1', {} as any, {} as any, 1);
        await repo.save(mockChar);

        // Act
        const result = await useCase.execute('char-123');

        // Assert
        expect(result).toBeDefined();
        expect(result.id).toBe('char-123');
        expect(result.name).toBe('Hero');
    });

    it('deve lançar erro se o personagem não for encontrado', async () => {
        await expect(useCase.execute('invalid-id')).rejects.toThrowError("Personagem não encontrado.");
    });
});
