import { useLoadedCharacter } from '@frontend/context/CharacterContext';
import { useCharacterChoices } from '@frontend/hooks/useCharacterChoices';
import { useClassResources } from '@frontend/hooks/useClassResources';

import { classBasics } from '@shared/systems/dnd5e/class-defaults';

/**
 * The hit die and saving throws the loaded sheet's class gives it, from the SRD of the sheet's own
 * edition. Null when the sheet follows no class: no edition, a class the player wrote, or the
 * class content still loading.
 */
export function useClassBasics() {
  const { edition, class: className } = useLoadedCharacter();
  const { classOf } = useCharacterChoices();
  const { content } = useClassResources(edition, classOf(className));
  return classBasics(edition, content);
}
