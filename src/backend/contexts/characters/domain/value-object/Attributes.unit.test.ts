import { describe, it, expect } from 'vitest';
import { Attributes } from './Attributes';

describe('Attributes (Value Object)', () => {
    it('deve inicializar com valores padrão (10) quando vazio', () => {
        const attr = new Attributes();
        expect(attr.get('STR')).toBe(10);
        expect(attr.get('DEX')).toBe(10);
    });

    it('deve inicializar com valores passados por parâmetro', () => {
        const attr = new Attributes({ STR: 16, DEX: 14 });
        expect(attr.get('STR')).toBe(16);
        expect(attr.get('DEX')).toBe(14);
        expect(attr.get('CON')).toBe(10); // não passado, assume 10
    });

    it('deve permitir alterar um valor válido', () => {
        const attr = new Attributes();
        attr.set('STR', 20);
        expect(attr.get('STR')).toBe(20);
    });

    it('deve retornar todos os valores', () => {
        const attr = new Attributes({ STR: 18, INT: 12 });
        const all = attr.getAll();
        expect(all).toEqual({ STR: 18, INT: 12 });
    });

    it('deve lançar erro se tentar setar um valor menor que 1', () => {
        const attr = new Attributes();
        expect(() => attr.set('STR', 0)).toThrowError("Atributo não pode ser menor que 1");
    });
});
