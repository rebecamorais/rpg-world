import { describe, expect, it } from 'vitest';

import { isGrimoireLabEnabled } from './lab-access';

describe('isGrimoireLabEnabled', () => {
  it('opens the lab in development and in tests', () => {
    expect(isGrimoireLabEnabled({ NODE_ENV: 'development' })).toBe(true);
    expect(isGrimoireLabEnabled({ NODE_ENV: 'test' })).toBe(true);
  });

  it('keeps it closed in a production build', () => {
    expect(isGrimoireLabEnabled({ NODE_ENV: 'production' })).toBe(false);
    expect(isGrimoireLabEnabled({ NODE_ENV: 'production', GRIMOIRE_LAB: '0' })).toBe(false);
    expect(isGrimoireLabEnabled({ NODE_ENV: 'production', VERCEL_ENV: 'production' })).toBe(false);
  });

  it('opens a production build only when GRIMOIRE_LAB=1 is set on purpose', () => {
    expect(isGrimoireLabEnabled({ NODE_ENV: 'production', GRIMOIRE_LAB: '1' })).toBe(true);
  });
});
