import { describe, it, expect } from 'vitest';
import { HealthPoints } from './HealthPoints';

describe('HealthPoints (Value Object)', () => {
    it('deve inicializar com vida atual e máxima corretas', () => {
        const hp = new HealthPoints(10, 10);
        expect(hp.current).toBe(10);
        expect(hp.max).toBe(10);
        expect(hp.status).toEqual({ current: 10, max: 10 });
    });

    it('não deve permitir vida máxima menor que 1', () => {
        expect(() => new HealthPoints(10, 0)).toThrowError("A vida máxima deve ser pelo menos 1");
        expect(() => new HealthPoints(10, -5)).toThrowError("A vida máxima deve ser pelo menos 1");
    });

    it('deve limitar a vida atual à vida máxima na inicialização', () => {
        const hp = new HealthPoints(20, 10);
        expect(hp.current).toBe(10); // current era 20, max era 10, limitou a 10
    });

    it('deve aplicar dano corretamente e não ficar abaixo de 0', () => {
        const hp = new HealthPoints(10, 10);
        const damage1 = hp.takeDamage(4);
        expect(damage1.current).toBe(6);

        const damage2 = damage1.takeDamage(10);
        expect(damage2.current).toBe(0); // Não desce de 0
    });

    it('deve aplicar cura corretamente e não passar do máximo', () => {
        const hp = new HealthPoints(5, 10);
        const heal1 = hp.heal(3);
        expect(heal1.current).toBe(8);

        const heal2 = heal1.heal(10);
        expect(heal2.current).toBe(10); // Não passa do máximo
    });

    it('deve lançar erro se cura ou dano forem negativos', () => {
        const hp = new HealthPoints(10, 10);
        expect(() => hp.takeDamage(-5)).toThrowError("Dano não pode ser negativo");
        expect(() => hp.heal(-5)).toThrowError("Cura não pode ser negativa");
    });
});
