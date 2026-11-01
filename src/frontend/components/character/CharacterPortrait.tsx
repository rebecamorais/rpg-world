import { useTranslations } from 'next-intl';

import { Avatar, AvatarFallback, AvatarImage } from '@frontend/components/ui/avatar';
import { AppIcon } from '@frontend/components/ui/icon';
import { matchCharacterClass } from '@frontend/lib/character-class';
import { cn } from '@frontend/lib/utils';
import { CharacterClass } from '@frontend/types/spells';

/** The emblem of each class (game-icons.net), drawn when the character has no picture. */
const CLASS_ICONS: Record<CharacterClass, string> = {
  [CharacterClass.BARBARIAN]: 'barbarian',
  [CharacterClass.BARD]: 'lyre',
  [CharacterClass.CLERIC]: 'holy-symbol',
  [CharacterClass.DRUID]: 'oak-leaf',
  [CharacterClass.FIGHTER]: 'crossed-swords',
  [CharacterClass.MONK]: 'meditation',
  [CharacterClass.PALADIN]: 'templar-shield',
  [CharacterClass.RANGER]: 'high-shot',
  [CharacterClass.ROGUE]: 'plain-dagger',
  [CharacterClass.SORCERER]: 'fire-spell-cast',
  [CharacterClass.WARLOCK]: 'warlock-eye',
  [CharacterClass.WIZARD]: 'wizard-staff',
};
// A class the system doesn't know ("Artificer", "Pirate") or an NPC without one
const UNKNOWN_CLASS_ICON = 'hooded-figure';

/**
 * A character's picture; without one, their class's emblem on their color instead of initials.
 * Decorative (the name is always next to it), and drawn in the surrounding character-context's
 * color. Size and shape come from `className`.
 */
export function CharacterPortrait({
  avatarUrl,
  characterClass,
  className,
}: {
  avatarUrl?: string | null;
  /** The sheet's free-text class ("Mago", "Wizard 5"). */
  characterClass?: string | null;
  className?: string;
}) {
  const tData = useTranslations('spellsData');
  const cls = matchCharacterClass(characterClass, (c) =>
    tData(`classes.${c}` as Parameters<typeof tData>[0]),
  );

  return (
    <Avatar aria-hidden="true" className={cn('bg-character-surface', className)}>
      {avatarUrl && <AvatarImage src={avatarUrl} alt="" className="object-cover object-top" />}
      <AvatarFallback
        data-class={cls ?? 'unknown'}
        className="rounded-[inherit] bg-[radial-gradient(circle_at_30%_25%,var(--character-muted),var(--character-surface)_75%)]"
      >
        <AppIcon
          name={cls ? CLASS_ICONS[cls] : UNKNOWN_CLASS_ICON}
          variant="game"
          className="text-character-flare size-3/5 drop-shadow-[0_0_8px_var(--character-glow)]"
        />
      </AvatarFallback>
    </Avatar>
  );
}
