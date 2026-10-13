import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { errorToHttp } from './error-response';
import { INVALID_REQUEST, InvalidRequestError, parseInput } from './validation';

const schema = z.object({ name: z.string().min(1), level: z.number().int() });

describe('parseInput', () => {
  it('retorna o dado validado e remove chaves desconhecidas', () => {
    expect(parseInput(schema, { name: 'Hero', level: 2, extra: true })).toEqual({
      name: 'Hero',
      level: 2,
    });
  });

  it('lança InvalidRequestError com o caminho de cada campo inválido', () => {
    const error = (() => {
      try {
        parseInput(schema, { name: '', level: 'x' });
      } catch (e) {
        return e;
      }
    })() as InvalidRequestError;

    expect(error).toBeInstanceOf(InvalidRequestError);
    expect(error.code).toBe(INVALID_REQUEST);
    expect(error.kind).toBe('validation');
    expect(error.issues.map((issue) => issue.path)).toEqual(['name', 'level']);
  });

  it('vira 400 com os campos inválidos na resposta HTTP', () => {
    const error = new InvalidRequestError([{ path: 'name', message: 'Required' }]);
    expect(errorToHttp(error)).toEqual({
      status: 400,
      body: { error: INVALID_REQUEST, issues: [{ path: 'name', message: 'Required' }] },
    });
  });
});
