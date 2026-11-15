'use client';

import { DeathSavesCard } from '@frontend/components/character/stats/DeathSavesCard';
import { useCharacterMeta, useLoadedCharacter } from '@frontend/context/CharacterContext';
import { useSheetSource } from '@frontend/hooks/useSheetSource';

import { EditionCard } from './EditionCard';
import { ResourcesCard } from './ResourcesCard';
import { useResourceBoxes } from './useResourceBoxes';

/** What the row shows, or null when there is nothing for this sheet. */
function useRowKind() {
  const character = useLoadedCharacter();
  const { id } = useCharacterMeta();
  const { readOnly } = useSheetSource(id);
  const { boxes, classId } = useResourceBoxes();

  // A sheet with no edition can still have boxes of the player's own, and those come first. The
  // edition card only for one of the 12 classes: choosing would show nothing for another
  const kind =
    boxes.length > 0 ? 'resources' : !readOnly && !character.edition && classId ? 'edition' : null;
  return { kind, boxes, classId };
}

/** Whether the row is on screen: the death saves leave the side column when it is. */
export function useResourcesRowVisible(): boolean {
  return useRowKind().kind !== null;
}

/**
 * Under the header: the death saves on the left, as wide as the saving throws' column below them
 * on desktop, and the class resources (or the edition card) taking the rest. On phones the
 * resources come first: they are what changes during play.
 */
export function ResourcesRow() {
  const { kind, boxes, classId } = useRowKind();
  if (!kind) return null;

  return (
    // Same columns and gap as the grid under it (StatusView), so the two line up
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-[280px_minmax(0,1fr)]">
      {kind === 'edition' && classId ? (
        <EditionCard classId={classId} />
      ) : (
        <ResourcesCard boxes={boxes} />
      )}
      <div className="md:order-first">
        <DeathSavesCard />
      </div>
    </div>
  );
}
