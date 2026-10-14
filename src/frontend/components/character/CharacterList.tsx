'use client';

import Link from 'next/link';

import { useTranslations } from 'next-intl';

import { LoadingState } from '@frontend/components/shared/LoadingState';
import { Button } from '@frontend/components/ui/button';
import { EmptyState, ErrorState } from '@frontend/components/ui/empty-state';
import { AppIcon } from '@frontend/components/ui/icon';
import { useCharactersContext } from '@frontend/context/CharactersContext';
import { useCurrentUser } from '@frontend/context/UserContext';
import { useErrorMessage } from '@frontend/hooks/useErrorMessage';

import { CharacterCard } from './CharacterCard';
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
    return <ErrorState title={t('loadErrorTitle')} description={getErrorMessage(error)} />;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center py-20">
        <LoadingState thematic />
      </div>
    );
  }

  if (characters.length === 0) {
    return (
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
    );
  }

  return (
    <div className="space-y-10">
      {/* Header Section */}
      <div className="border-muted/20 flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h2 className="text-foreground text-4xl font-black tracking-tighter sm:text-5xl">
            {t('title')}
          </h2>
          <div className="flex items-center gap-3">
            <div className="border-success-muted bg-success-surface flex h-5 items-center gap-1.5 rounded-full border px-2.5 py-0.5">
              <span className="bg-success h-1.5 w-1.5 animate-pulse rounded-full shadow-[0_0_8px_var(--success-muted)]" />
              <span className="text-label text-success-flare">{t('online')}</span>
            </div>
            <p className="text-label text-muted-foreground">
              {t('characterCount', { count: characters.length })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-2">
        {/* Create Character Action Card - Premium Design */}
        <Link
          href="/characters/new"
          className="group border-muted/30 bg-card/30 hover:border-primary/50 hover:bg-primary/5 relative flex h-full min-h-[180px] flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-500 hover:shadow-2xl sm:min-h-[220px]"
        >
          {/* Animated Background Gradients */}
          <div className="from-primary/10 absolute inset-0 bg-gradient-to-br via-transparent to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
          <div className="to-primary/5 absolute inset-0 bg-gradient-to-tl from-transparent via-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />

          {/* Icon Container */}
          <div className="bg-muted border-muted/10 group-hover:bg-primary group-hover:shadow-primary/40 relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border transition-all duration-700 group-hover:scale-110 group-hover:-rotate-12 group-hover:rounded-[2rem] group-hover:shadow-2xl">
            <AppIcon
              name="Plus"
              size={32}
              className="text-muted-foreground group-hover:text-primary-foreground transition-all duration-500 group-hover:rotate-12"
            />
          </div>

          <div className="relative text-center">
            <span className="text-muted-foreground group-hover:text-primary-flare text-xl font-black tracking-tighter transition-colors duration-500 sm:text-2xl">
              {t('createNew')}
            </span>
            <p className="text-label opacity-0 transition-all duration-500 group-hover:translate-y-1 group-hover:opacity-40">
              {t('createNewTagline')}
            </p>
          </div>

          {/* Decorative Corner */}
          <div className="bg-primary/20 absolute -right-4 -bottom-4 h-12 w-12 rotate-45 opacity-0 transition-all duration-500 group-hover:opacity-100" />
        </Link>

        {/* Existing Character Cards */}
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
