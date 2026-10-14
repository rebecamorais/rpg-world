import { setupTestEnvironment } from './setup-env';

// Runs once before the workers start, so the keys it puts in process.env reach every test.
// Kept out of the config file so that loading the config (e.g. by knip) has no side effects.
export default function setup() {
  setupTestEnvironment();
}
