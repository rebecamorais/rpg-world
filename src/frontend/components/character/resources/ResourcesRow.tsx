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

  // The edition card only for one of the 12 classes: choosing would show nothing for another
  const kind =
    !readOnly && !character.edition && classId ? 'edition' : boxes.length > 0 ? 'resources' : null;
  return { kind, boxes, classId };
}

/** Whether the row is on screen: the death saves leave the side column when it is. */
export function useResourcesRowVisible(): boolean {
  return useRowKind().kind !== null;
}

/** Under the header: the class resources (or the edition card) beside the death saves. */
export function ResourcesRow() {
  const { kind, boxes, classId } = useRowKind();
  if (!kind) return null;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      {kind === 'edition' && classId ? (
        <EditionCard classId={classId} />
      ) : (
        <ResourcesCard boxes={boxes} />
      )}
      <DeathSavesCard />
    </div>
  );
}
