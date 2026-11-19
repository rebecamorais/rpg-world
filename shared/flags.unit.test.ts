import { afterEach, describe, expect, it, vi } from 'vitest';

const get = vi.fn();

// Same contract as the real adapter: the `flags` item, and an error when it or the key is missing
vi.mock('@flags-sdk/edge-config', () => ({
  edgeConfigAdapter: () => ({
    async decide({ key }: { key: string }) {
      const flags = await get('flags');
      if (!flags || !(key in flags)) throw new Error(`Flag "${key}" not found`);
      return flags[key];
    },
  }),
}));

/** The flag module reads EDGE_CONFIG when it loads: a fresh copy per environment. */
async function loadFlag(edgeConfig: string) {
  vi.stubEnv('EDGE_CONFIG', edgeConfig);
  vi.resetModules();
  return (await import('./flags')).maintenanceFlag;
}

const evaluate = (flag: Awaited<ReturnType<typeof loadFlag>>) =>
  flag(new Request('http://localhost/characters'));

describe('maintenanceFlag', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    get.mockReset();
  });

  // Dev, CI and the tests have no Edge Config: the site must stay up
  it('fica desligada sem EDGE_CONFIG, sem consultar o Edge Config', async () => {
    const flag = await loadFlag('');

    await expect(evaluate(flag)).resolves.toBe(false);
    expect(get).not.toHaveBeenCalled();
  });

  it('lê a chave maintenance do item flags', async () => {
    get.mockResolvedValue({ maintenance: true });
    const flag = await loadFlag('https://edge-config.vercel.com/ecfg_test?token=t');

    await expect(evaluate(flag)).resolves.toBe(true);
    expect(get).toHaveBeenCalledWith('flags');
  });

  it.each([
    ['sem a chave', () => get.mockResolvedValue({})],
    ['sem o item flags', () => get.mockResolvedValue(undefined)],
    ['com o Edge Config fora do ar', () => get.mockRejectedValue(new Error('unreachable'))],
  ])('fica desligada %s', async (_case, arrange) => {
    arrange();
    const flag = await loadFlag('https://edge-config.vercel.com/ecfg_test?token=t');

    await expect(evaluate(flag)).resolves.toBe(false);
  });
});
