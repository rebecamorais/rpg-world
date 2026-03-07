import { existsSync, symlinkSync } from 'node:fs';
import { resolve } from 'node:path';

const envs = ['db-dev', 'db-test'];

envs.forEach((env) => {
  const migrationsDest = resolve(`./${env}/migrations`);
  if (!existsSync(migrationsDest)) {
    // Cria o link simbólico das migrations globais para dentro de cada ambiente
    symlinkSync(resolve('./migrations'), migrationsDest, 'dir');
  }
});
