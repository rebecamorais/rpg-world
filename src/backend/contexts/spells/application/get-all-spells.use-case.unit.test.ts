import { describe, expect, it, vi } from 'vitest';

import { SpellsRepo } from '../domain/repository/spells.repo';
import { GetAllSpellsUseCase } from './get-all-spells.use-case';

describe('GetAllSpellsUseCase', () => {
  it('deve chamar o repositório com os parâmetros corretos', async () => {
    const mockResponse = {
      data: [{ id: '1', name: 'Magic Missile', level: 1 }],
      total: 1,
    };
    const mockRepository = {
      findAll: vi.fn().mockResolvedValue(mockResponse),
    } as unknown as SpellsRepo;

    const useCase = new GetAllSpellsUseCase(mockRepository);
    const params = { search: 'Magic', level: 1, page: 0, limit: 10 };

    const result = await useCase.execute(params);

    expect(mockRepository.findAll).toHaveBeenCalledWith(params);
    expect(result).toEqual(mockResponse);
  });

  it('deve retornar dados paginados mesmo sem parâmetros', async () => {
    const mockResponse = {
      data: [],
      total: 0,
    };
    const mockRepository = {
      findAll: vi.fn().mockResolvedValue(mockResponse),
    } as unknown as SpellsRepo;

    const useCase = new GetAllSpellsUseCase(mockRepository);
    const result = await useCase.execute();

    expect(mockRepository.findAll).toHaveBeenCalledWith(undefined);
    expect(result).toEqual(mockResponse);
  });

  it('deve lidar com filtros complexos (Classe e Escola)', async () => {
    const mockRepository = {
      findAll: vi.fn().mockResolvedValue({ data: [], total: 0 }),
    } as unknown as SpellsRepo;

    const useCase = new GetAllSpellsUseCase(mockRepository);
    const params = { class: 'wizard', school: 'Evocation', level: 3 };

    await useCase.execute(params);

    expect(mockRepository.findAll).toHaveBeenCalledWith(params);
  });
});
