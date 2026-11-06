import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { LOCAL_SEED_FILE, renderLocalSeed } from './local-seed';

describe('seed local', () => {
  it('está em dia com os dados da demo (se falhar: npm run seed:local)', () => {
    expect(readFileSync(LOCAL_SEED_FILE, 'utf8')).toBe(renderLocalSeed());
  });

  it('nome real não entra no seed', () => {
    expect(renderLocalSeed()).not.toMatch(/Perlman|Radia|Margaret/);
  });
});
