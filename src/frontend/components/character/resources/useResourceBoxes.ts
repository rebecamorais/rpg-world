import { useLoadedCharacter } from '@frontend/context/CharacterContext';
import { useCharacterChoices } from '@frontend/hooks/useCharacterChoices';
import { useClassResources } from '@frontend/hooks/useClassResources';

import { buildResourceBoxes, matchSubclass } from '@shared/systems/dnd5e/class-resources';
import type { ResourceBox } from '@shared/systems/dnd5e/class-resources';

/** The class resource boxes of the loaded sheet: none until it has an edition and a listed class. */
export function useResourceBoxes() {
  const character = useLoadedCharacter();
  const { classOf } = useCharacterChoices();
  const { content, isLoading } = useClassResources(character.edition, classOf(character.class));

  const boxes: ResourceBox[] = content
    ? buildResourceBoxes({
        content,
        subclassId: matchSubclass(content, character.subclass),
        level: character.level,
        attributes: character.attributes,
        state: character.resources,
      })
    : [];

  return { boxes, content, isLoading };
}
