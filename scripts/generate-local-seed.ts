import { writeFileSync } from 'node:fs';

import { LOCAL_SEED_FILE, renderLocalSeed } from '@frontend/demo/data/local-seed';

writeFileSync(LOCAL_SEED_FILE, renderLocalSeed());
console.log(`Wrote ${LOCAL_SEED_FILE}`);
