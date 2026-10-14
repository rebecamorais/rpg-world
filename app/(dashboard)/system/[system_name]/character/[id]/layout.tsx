import { ReactNode } from 'react';

import { CharacterSheetShell } from '@frontend/components/character/sheet/CharacterSheetShell';
import { CharacterProvider } from '@frontend/context/CharacterContext';

export default function CharacterLayout({ children }: { children: ReactNode }) {
  return (
    <CharacterProvider>
      <CharacterSheetShell>{children}</CharacterSheetShell>
    </CharacterProvider>
  );
}
