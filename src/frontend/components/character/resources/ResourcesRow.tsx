'use client';

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

/** Whether the sheet has class resources (or the edition card) to show. */
export function useResourcesRowVisible(): boolean {
  return useRowKind().kind !== null;
}

/** The class resources, or the edition card that brings them. StatusView places it. */
export function ResourcesRow() {
  const { kind, boxes, classId } = useRowKind();
  if (!kind) return null;

  return kind === 'edition' && classId ? (
    <EditionCard classId={classId} />
  ) : (
    <ResourcesCard boxes={boxes} />
  );
}
