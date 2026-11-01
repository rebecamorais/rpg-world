import { Avatar, AvatarFallback, AvatarImage } from '@frontend/components/ui/avatar';
import { AppIcon } from '@frontend/components/ui/icon';
import { CLASS_ICONS, UNKNOWN_CLASS_ICON } from '@frontend/constants/character-choices';
import { useCharacterChoices } from '@frontend/hooks/useCharacterChoices';
import { cn } from '@frontend/lib/utils';

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
  /** The sheet's class field: an id ("wizard") or the player's own text. */
  characterClass?: string | null;
  className?: string;
}) {
  const cls = useCharacterChoices().classOf(characterClass);

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
