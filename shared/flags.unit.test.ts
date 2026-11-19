import { describe, expect, it } from 'vitest';

import { maintenanceFlag } from './flags';

describe('maintenanceFlag', () => {
  // Dev, CI and the tests have no Edge Config: the site must stay up
  it('fica desligada sem EDGE_CONFIG', async () => {
    expect(process.env.EDGE_CONFIG).toBeUndefined();

    await expect(maintenanceFlag(new Request('http://localhost/characters'))).resolves.toBe(false);
  });
});
