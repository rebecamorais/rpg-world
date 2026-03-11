import { existsSync, mkdirSync, symlinkSync } from 'node:fs';
import { dirname } from 'node:path';

// Estrutura: [Caminho do Link, Destino Real]
// Usamos caminhos relativos à raiz do projeto para evitar confusão
const symlinks: [string, string][] = [
  // Linka a pasta de migrations global
  ['database/db-dev/supabase/migrations', '../../migrations'],
  ['database/db-test/supabase/migrations', '../../migrations'],

  // Linka a pasta de seeds global só pra dev
  ['database/db-dev/supabase/seeds', '../seeds'],
];

for (const [linkPath, targetPath] of symlinks) {
  try {
    // 1. Garante que a pasta pai do link existe (ex: database/db-test/supabase)
    const parentDir = dirname(linkPath);
    if (!existsSync(parentDir)) {
      mkdirSync(parentDir, { recursive: true });
    }

    // 2. Verifica se algo já existe no caminho do link
    if (!existsSync(linkPath)) {
      // No Windows, symlink de diretório precisa do terceiro argumento 'dir'
      const type = targetPath.endsWith('/') || !targetPath.includes('.') ? 'dir' : 'file';

      symlinkSync(targetPath, linkPath, type);
      console.log(`✅ Symlink criado: ${linkPath} → ${targetPath}`);
    } else {
      console.log(`ℹ️  Symlink ou diretório já existe: ${linkPath}`);
    }
  } catch (error: unknown) {
    console.error(`❌ Erro ao criar symlink para ${linkPath}: ${JSON.stringify(error)}`);
    // Não mata o processo para não quebrar o npm install, mas avisa o dev
  }
}
