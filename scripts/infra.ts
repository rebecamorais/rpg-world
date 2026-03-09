import { execSync } from 'child_process';

const WORKDIRS = {
  dev: 'database/db-dev',
  test: 'database/db-test',
};

const run = (cmd: string, stepName: string) => {
  console.log(`⏳ [${stepName}]...`);
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (e) {
    console.error(`❌ Falha em: ${stepName}: ${e}`);
    process.exit(1);
  }
};

const actions = {
  sync: () => {
    console.log('🔄 Sincronizando Migrations e Seeds...');
    run('npx tsx scripts/setup-symlinks.ts', 'Rodando Setup de Symlinks');
  },

  up: () => {
    actions.sync(); // Garante o sync SEMPRE antes de subir
    console.log('🚀 Subindo infraestrutura...');
    run(`npx supabase start --workdir ${WORKDIRS.dev}`, 'Start Dev');
    run(`npx supabase start --workdir ${WORKDIRS.test}`, 'Start Test');
    run(
      'npx supabase gen types typescript --local --workdir database/db-dev > lib/types/database.ts',
      'Update Types',
    );
    console.log('✅ Infra pronta!');
  },

  down: () => {
    console.log('🛑 Parando infraestrutura...');
    run(`npx supabase stop --workdir ${WORKDIRS.dev}`, 'Stop Dev');
    run(`npx supabase stop --workdir ${WORKDIRS.test}`, 'Stop Test');
  },

  clean: () => {
    console.log('🧹 Limpeza profunda...');
    run(`npx supabase stop --no-backup --workdir ${WORKDIRS.dev}`, 'Reset Dev');
    run(
      `npx supabase stop --no-backup --workdir ${WORKDIRS.test}`,
      'Reset Test',
    );
    run('docker system prune --volumes -f', 'Docker Prune');
    actions.up(); // O up já vai chamar o sync automaticamente
  },
};

const command = process.argv[2] as keyof typeof actions;

if (command in actions) {
  actions[command]();
} else {
  console.log('Uso: npm run infra [up|down|clean|sync]');
}
