'use client';

import Link from 'next/link';

import { useTranslations } from 'next-intl';

import { LoadingState } from '@frontend/components/shared/LoadingState';
import { Button } from '@frontend/components/ui/button';
import { AppIcon } from '@frontend/components/ui/icon';
import { useCharactersContext } from '@frontend/context/CharactersContext';
import { useCurrentUser } from '@frontend/context/UserContext';

import { CharacterCard } from './CharacterCard';
import { DeleteCharacterDialog } from './DeleteCharacterDialog';

/**
 * Main dashboard component showing the list of adventure characters.
 * Integrates with CharactersContext for shared state and operations.
 */
export default function CharacterList() {
  const { currentUser } = useCurrentUser();
  const t = useTranslations('characters');
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
      <div className="border-destructive/20 bg-destructive/5 rounded-2xl border p-8 text-center">
        <AppIcon name="AlertTriangle" size={40} className="mx-auto mb-4 opacity-50" />
        <p className="mb-2 text-lg font-bold">Ocorreu um erro</p>
        <p className="text-sm opacity-80">{error.message}</p>
      </div>
    );
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
      <div className="border-muted/30 bg-card/20 flex min-h-[450px] flex-col items-center justify-center rounded-3xl border-2 border-dashed p-8 text-center backdrop-blur-md sm:p-12">
        <div className="relative mb-8">
          <div className="bg-primary/30 absolute -inset-4 animate-pulse rounded-full blur-2xl" />
          <div className="bg-muted relative flex h-28 w-28 items-center justify-center rounded-full shadow-2xl">
            <AppIcon name="UserPlus" size={56} className="text-muted-foreground opacity-40" />
          </div>
        </div>
        <h3 className="text-foreground mb-4 text-3xl font-black tracking-tighter">
          {t('emptyState')}
        </h3>
        <p className="text-muted-foreground mx-auto mb-10 max-w-sm text-base leading-relaxed font-medium opacity-70">
          {t('createFirstDescription')}
        </p>
        <Button
          asChild
          size="lg"
          className="shadow-primary/20 h-14 rounded-full px-12 text-lg font-black shadow-2xl transition-all hover:scale-105 active:scale-95"
        >
          <Link href="/characters/new">
            <AppIcon name="Plus" size={24} className="mr-3" />
            {t('createFirst')}
          </Link>
        </Button>
      </div>
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
            <div className="flex h-5 items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-0.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              <span className="text-[10px] font-black tracking-widest text-green-500/90 uppercase">
                Online
              </span>
            </div>
            <p className="text-muted-foreground text-xs font-bold tracking-widest uppercase opacity-60">
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
            <span className="text-muted-foreground group-hover:text-primary text-xl font-black tracking-tighter transition-colors duration-500 sm:text-2xl">
              {t('createNew')}
            </span>
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-0 transition-all duration-500 group-hover:translate-y-1 group-hover:opacity-40">
              Start your legend
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
