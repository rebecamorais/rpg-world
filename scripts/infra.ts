import chalk from 'chalk';
import { execSync } from 'child_process';
import sade from 'sade';

const WORKDIRS = {
  dev: 'database/db-dev',
  test: 'database/db-test',
};

const run = (cmd: string, stepName: string) => {
  console.log(chalk.cyan(`⏳ [${stepName}]...`));
  try {
    execSync(cmd, { stdio: 'inherit' });
  } catch (e) {
    console.error(chalk.red(`❌ Falha em: ${stepName}\n`), e);
    process.exit(1);
  }
};

const actions = {
  sync: () => {
    console.log(chalk.blue('🔄 Sincronizando Migrations e Seeds...'));
    run('npx tsx scripts/setup-symlinks.ts', 'Rodando Setup de Symlinks');
  },

  up: () => {
    actions.sync(); // Garante o sync SEMPRE antes de subir
    console.log(chalk.green('🚀 Subindo infraestrutura...'));
    run(`npx supabase start --workdir ${WORKDIRS.dev}`, 'Start Dev');
    run(`npx supabase start --workdir ${WORKDIRS.test}`, 'Start Test');
    run(
      'npx supabase gen types typescript --local --workdir database/db-dev > lib/types/database.ts',
      'Update Types',
    );
    console.log(chalk.green.bold('✅ Infra pronta!'));
  },

  down: () => {
    console.log(chalk.yellow('🛑 Parando infraestrutura...'));
    run(`npx supabase stop --workdir ${WORKDIRS.dev}`, 'Stop Dev');
    run(`npx supabase stop --workdir ${WORKDIRS.test}`, 'Stop Test');
  },

  clean: () => {
    console.log(chalk.magenta('🧹 Limpeza profunda...'));
    run(`npx supabase stop --no-backup --workdir ${WORKDIRS.dev}`, 'Reset Dev');
    run(`npx supabase stop --no-backup --workdir ${WORKDIRS.test}`, 'Reset Test');
    run('docker system prune --volumes -f', 'Docker Prune');
    actions.up(); // O up já vai chamar o sync automaticamente
  },
};

const prog = sade('infra');

prog.version('1.0.0').describe('Gerenciar infraestrutura do projeto (Supabase, Docker, etc)');

prog.command('up').describe('Sobe a infraestrutura local (Dev e Test)').action(actions.up);

prog.command('down').describe('Para a infraestrutura local').action(actions.down);

prog.command('clean').describe('Gera um reset total e sobe novamente').action(actions.clean);

prog.command('sync').describe('Sincroniza symlinks de migrations e seeds').action(actions.sync);

prog.parse(process.argv);
