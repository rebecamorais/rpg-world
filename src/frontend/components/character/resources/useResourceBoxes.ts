import { useLoadedCharacter } from '@frontend/context/CharacterContext';
import { useCharacterChoices } from '@frontend/hooks/useCharacterChoices';
import { useClassResources } from '@frontend/hooks/useClassResources';

import {
  buildResourceBoxes,
  listResourceBoxes,
  matchSubclass,
} from '@shared/systems/dnd5e/class-resources';

/**
 * The resource boxes of the loaded sheet. The class's come once it has an edition and a listed
 * class; the player's own are always there. `all` also has the hidden ones, for the settings.
 */
export function useResourceBoxes() {
  const character = useLoadedCharacter();
  const { classOf } = useCharacterChoices();
  const classId = classOf(character.class);
  const { content } = useClassResources(character.edition, classId);

  const input = {
    content,
    subclassId: content && matchSubclass(content, character.subclass),
    level: character.level,
    attributes: character.attributes,
    state: character.resources,
  };

  return { boxes: buildResourceBoxes(input), all: listResourceBoxes(input), content, classId };
}
