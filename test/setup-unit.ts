import { vi } from 'vitest';

// `server-only` throws outside a React Server Components bundle; tests import server modules directly.
vi.mock('server-only', () => ({}));
