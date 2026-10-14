import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// Iconify fetches icon data from its public API at runtime; tests stay offline.
vi.mock('@iconify/react', () => ({ Icon: () => null }));

afterEach(() => cleanup());
