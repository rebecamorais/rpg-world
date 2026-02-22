import { describe, it, expect, beforeEach } from 'vitest';
import { DeleteCharacterUseCase } from './delete-character.use-case';
import { InMemoryCharacterRepository } from '../../infrastructure/in-memory-character.repository';
import { DnD5eCharacter } from '../../domain/entity/DnD5eCharacter';
import { Attributes } from '../../domain/value-object/Attributes';
import { HealthPoints } from '../../domain/value-object/HealthPoints';

describe('DeleteCharacterUseCase (Integration)', () => {
    let repo: InMemoryCharacterRepository;
    let useCase: DeleteCharacterUseCase;

    beforeEach(async () => {
        repo = new InMemoryCharacterRepository();
        useCase = new DeleteCharacterUseCase(repo);

        const char = new DnD5eCharacter('char-1', 'Test', 'owner-1', new Attributes(), new HealthPoints(10, 10), 1);
        await repo.save(char);
    });

    it('deve deletar um personagem se o dono requisitar', async () => {
        const deleted = await useCase.execute('char-1', 'owner-1');
        expect(deleted).toBe(true);

        const found = await repo.findById('char-1');
        expect(found).toBeNull();
    });

    it('não deve deletar se o usuário não for o dono', async () => {
        await expect(useCase.execute('char-1', 'wrong-owner'))
            .rejects.toThrowError("Não autorizado a excluir este personagem.");

        // Ensure it's still there
        const found = await repo.findById('char-1');
        expect(found).not.toBeNull();
    });

    it('deve lançar erro se tentar deletar um id que não existe', async () => {
        await expect(useCase.execute('not-exist', 'owner-1'))
            .rejects.toThrowError("Personagem não encontrado.");
    });
});
