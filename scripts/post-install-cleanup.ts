import { existsSync, rmSync } from 'node:fs';

const paths = [
  'database/db-dev/supabase/.temp',
  'database/db-test/supabase/.temp',
];

paths.forEach((p) => {
  if (existsSync(p)) {
    rmSync(p, { recursive: true, force: true });
    console.log(`🧹 Limpeza: ${p}`);
  }
});

console.log('✨ Pastas temporárias tratadas com sucesso.');
