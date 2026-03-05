import { vi } from 'vitest';

// Mock server-only para ambientes sem Next.js (ex.: testes)
vi.mock('server-only', () => ({}));

// Mock next/headers pois não existe fora do Next.js runtime
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
  headers: vi.fn(() => new Headers()),
}));
