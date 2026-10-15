'use client';

import Link from 'next/link';

import { useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';
import { EmptyState, ErrorState } from '@frontend/components/ui/empty-state';
import { AppIcon } from '@frontend/components/ui/icon';
import { useCharactersContext } from '@frontend/context/CharactersContext';
import { useCurrentUser } from '@frontend/context/UserContext';
import { useErrorMessage } from '@frontend/hooks/useErrorMessage';

import { CharacterCard, CharacterCardSkeleton } from './CharacterCard';
import { DeleteCharacterDialog } from './DeleteCharacterDialog';

/**
 * Main dashboard component showing the list of adventure characters.
 * Integrates with CharactersContext for shared state and operations.
 */
export default function CharacterList() {
  const { currentUser } = useCurrentUser();
  const t = useTranslations('characters');
  const { getErrorMessage } = useErrorMessage();
  const {
    characters,
    isLoading,
    error,
    characterToDelete,
    setCharacterToDelete,
    confirmName,
    setConfirmName,
    handleDelete,
    isDeleting,
  } = useCharactersContext();

  if (!currentUser) return null;

  if (error) {
    return (
      <div className="space-y-6">
        <ErrorState title={t('loadErrorTitle')} description={getErrorMessage(error)} />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6" aria-busy="true">
        <span role="status" className="sr-only">
          {t('loadingList')}
        </span>
        <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <CharacterCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (characters.length === 0) {
    return (
      <div className="space-y-6">
        <EmptyState
          icon="UserPlus"
          title={t('emptyState')}
          description={t('createFirstDescription')}
          className="min-h-[450px]"
          action={
            <Button asChild size="lg">
              <Link href="/characters/new">
                <AppIcon name="Plus" size={20} aria-hidden="true" />
                {t('createFirst')}
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid auto-rows-fr grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2">
        {characters.map((character) => (
          <CharacterCard key={character.id} character={character} />
        ))}
      </div>

      <DeleteCharacterDialog
        character={characterToDelete}
        confirmName={confirmName}
        onConfirmNameChange={setConfirmName}
        onConfirm={handleDelete}
        onCancel={() => {
          setCharacterToDelete(null);
          setConfirmName('');
        }}
        isPending={isDeleting}
      />
    </div>
  );
}
