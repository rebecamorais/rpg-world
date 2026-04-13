import CharacterList from '@frontend/components/character/CharacterList';
import { CharactersProvider } from '@frontend/context/CharactersContext';

export default function CharactersPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 p-4">
      <CharactersProvider>
        <CharacterList />
      </CharactersProvider>
    </main>
  );
}
