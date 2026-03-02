// tests/setup-env.ts
import { execSync } from 'child_process';

export function setupTestEnvironment() {
  try {
    const statusJson = execSync(
      'supabase status -o json --config supabase-test/config.toml',
      { encoding: 'utf-8' },
    );

    const status = JSON.parse(statusJson);

    // Injeta as variáveis que o seu Supabase Client (src) espera
    process.env.NEXT_PUBLIC_SUPABASE_URL = status.API_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = status.ANON_KEY;
    process.env.SUPABASE_SERVICE_ROLE_KEY = status.SERVICE_ROLE_KEY;

    console.log(
      '✅ Ambiente de teste sincronizado com a porta:',
      status.API_URL,
    );
  } catch (e) {
    console.error(
      '❌ Erro: Não foi possível ler o status do Supabase de teste.',
    );
    console.error(
      'Certifique-se de que ele está rodando (npm run test:start).',
    );
    process.exit(1);
  }
}
