import { useLoadedCharacter } from '@frontend/context/CharacterContext';
import { useCharacterChoices } from '@frontend/hooks/useCharacterChoices';
import { useClassResources } from '@frontend/hooks/useClassResources';

import { classDefaults } from '@shared/systems/dnd5e/class-defaults';

/**
 * What the loaded sheet's class gives it, or null when the sheet does not follow a class: no
 * edition, the 2024 edition, a class the player wrote, or the class content still loading.
 */
export function useClassDefaults() {
  const { edition, class: className, attributes } = useLoadedCharacter();
  const { classOf } = useCharacterChoices();
  const { content } = useClassResources(edition, classOf(className));
  return classDefaults(edition, content, attributes);
}
