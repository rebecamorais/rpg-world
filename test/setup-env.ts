import { execSync } from 'child_process';

export function setupTestEnvironment() {
  try {
    const statusJson = execSync('npx supabase status -o json --workdir database/db-test', {
      encoding: 'utf-8',
    });

    const status = JSON.parse(statusJson);

    process.env.NEXT_PUBLIC_SUPABASE_URL = status.API_URL;
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = status.ANON_KEY;
    process.env.SUPABASE_SECRET_KEY = status.SERVICE_ROLE_KEY;

    console.log('✅ Ambiente de teste sincronizado:', status.API_URL);
  } catch (err: unknown) {
    console.error('❌ Erro no setup-env.ts: Erro ao ler o status do Supabase.');
    console.error(JSON.stringify(err));
    process.exit(1);
  }
}
