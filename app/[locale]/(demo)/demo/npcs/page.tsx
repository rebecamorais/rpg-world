import CharacterList from '@frontend/components/character/CharacterList';
import { CharactersProvider } from '@frontend/context/CharactersContext';

export default function DemoNpcsRoute() {
  return (
    <CharactersProvider kind="npc">
      <CharacterList />
    </CharactersProvider>
  );
}
