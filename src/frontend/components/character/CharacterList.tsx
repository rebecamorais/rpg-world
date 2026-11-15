'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';
import { EmptyState, ErrorState } from '@frontend/components/ui/empty-state';
import { AppIcon } from '@frontend/components/ui/icon';
import { useCharactersContext } from '@frontend/context/CharactersContext';
import { useCurrentUser } from '@frontend/context/UserContext';
import AppLink from '@frontend/demo/AppLink';
import { useErrorMessage } from '@frontend/hooks/useErrorMessage';

import { CharacterCard, CharacterCardSkeleton } from './CharacterCard';
import { DeleteCharacterDialog } from './DeleteCharacterDialog';

/*
 * Columns by the list's own width, not the screen's: with the sidebar open at 768px, two
 * columns left each card about 220px and every name read "R.". 2xl (42rem) gives each card
 * room for its name.
 */
const GRID = 'grid auto-rows-fr grid-cols-1 gap-5 sm:gap-6 @2xl:grid-cols-2';

/** The page's h1, focusable from code only, for when the list it introduced is gone. */
function pageHeading(): HTMLElement | null {
  const heading = document.querySelector<HTMLElement>('main h1') ?? document.querySelector('h1');
  if (heading && !heading.hasAttribute('tabindex')) heading.tabIndex = -1;
  return heading;
}

/**
 * Main dashboard component showing the list of adventure characters.
 * Integrates with CharactersContext for shared state and operations.
 */
export default function CharacterList() {
  const { currentUser } = useCurrentUser();
  const t = useTranslations('characters');
  const tEnemies = useTranslations('enemies');
  const { getErrorMessage } = useErrorMessage();
  const {
    kind,
    characters,
    isLoading,
    error,
    characterToDelete,
    setCharacterToDelete,
    confirmName,
    setConfirmName,
    handleDelete,
    isDeleting,
    takeFocusAfterDelete,
  } = useCharactersContext();

  // The deleted card took the dialog's opener with it: the focus would fall to <body>, and the
  // next Tab would start over from the top of the page. It goes to the next card instead (the
  // one before at the end of the list), or to the page's title once the list is empty.
  const focusAfterDelete = (event: Event) => {
    const deleted = takeFocusAfterDelete();
    if (!deleted) return;
    const target = deleted.next
      ? document.querySelector<HTMLElement>(
          `[data-character-id="${CSS.escape(deleted.next)}"] h2 a`,
        )
      : pageHeading();
    if (!target) return;
    event.preventDefault();
    target.focus();
  };

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
      <div className="@container space-y-6" aria-busy="true">
        <span role="status" className="sr-only">
          {t('loadingList')}
        </span>
        <div className={GRID}>
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
          title={kind === 'npc' ? tEnemies('emptyState') : t('emptyState')}
          description={
            kind === 'npc' ? tEnemies('createFirstDescription') : t('createFirstDescription')
          }
          className="min-h-[450px]"
          action={
            <Button asChild size="lg">
              <AppLink href={kind === 'npc' ? '/characters/new?kind=npc' : '/characters/new'}>
                <AppIcon name="Plus" size={20} aria-hidden="true" />
                {kind === 'npc' ? tEnemies('createFirst') : t('createFirst')}
              </AppLink>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="@container space-y-6">
      <div className={GRID}>
        {characters.map((character) => (
          <CharacterCard key={character.id} character={character} />
        ))}
      </div>

      <DeleteCharacterDialog
        character={characterToDelete}
        kind={kind}
        confirmName={confirmName}
        onConfirmNameChange={setConfirmName}
        onConfirm={handleDelete}
        onCancel={() => {
          setCharacterToDelete(null);
          setConfirmName('');
        }}
        isPending={isDeleting}
        onCloseAutoFocus={focusAfterDelete}
      />
    </div>
  );
}
