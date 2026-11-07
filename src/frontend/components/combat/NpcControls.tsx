'use client';

import { useState } from 'react';

import { useTranslations } from 'next-intl';

import { AppIcon } from '@frontend/components/ui/icon';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@frontend/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@frontend/components/ui/tooltip';
import { cn } from '@frontend/lib/utils';

import type { NpcSide, Visibility } from '@backend/contexts/combat/domain/Encounter';

const ACTIONS = [
  { value: 'visible', icon: 'Eye', label: 'show', state: 'visibilityVisible' },
  { value: 'anonymous', icon: 'VenetianMask', label: 'anonymize', state: 'visibilityAnonymous' },
  { value: 'hidden', icon: 'EyeOff', label: 'hide', state: 'visibilityHidden' },
] as const satisfies readonly { value: Visibility; icon: string; label: string; state: string }[];

const SIDES: NpcSide[] = ['ally', 'neutral', 'enemy'];

/** An icon button whose name is also its tooltip: on hover, focus and, as there's no hover, tap. */
function ActionButton({
  label,
  icon,
  pressed,
  onPress,
}: {
  label: string;
  icon: string;
  pressed: boolean;
  onPress: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          aria-pressed={pressed}
          // Radix closes a tooltip when its trigger is pressed or clicked; here a tap also opens it
          onPointerDown={(event) => event.preventDefault()}
          onClick={(event) => {
            event.preventDefault();
            setOpen(true);
            onPress();
          }}
          className={cn(
            'focus-ring touch-target inline-flex h-9 w-9 items-center justify-center rounded-md transition-colors pointer-coarse:h-11 pointer-coarse:w-11',
            pressed
              ? 'bg-character-surface text-character-flare'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
          )}
        >
          <AppIcon name={icon} size={16} aria-hidden="true" />
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * What only the GM may change about an NPC: whether the players see it (shown, anonymous or
 * hidden) and which side it fights on. Players are never offered either.
 */
export function NpcControls({
  name,
  visibility,
  side,
  onVisibility,
  onSide,
}: {
  name: string;
  visibility: Visibility;
  side: NpcSide;
  onVisibility: (visibility: Visibility) => void;
  onSide: (side: NpcSide) => void;
}) {
  const t = useTranslations('combat');
  const current = ACTIONS.find((action) => action.value === visibility) ?? ACTIONS[0];

  return (
    // Above the card's stretched link, so a click here neither navigates nor opens the card
    <div className="relative z-10 flex flex-wrap items-center gap-x-4 gap-y-2">
      <div className="flex items-center gap-2">
        <div role="group" aria-label={name} className="flex items-center gap-1">
          {ACTIONS.map((action) => (
            <ActionButton
              key={action.value}
              label={t(action.label)}
              icon={action.icon}
              pressed={visibility === action.value}
              onPress={() => onVisibility(action.value)}
            />
          ))}
        </div>
        <span className="text-label text-muted-foreground">{t(current.state)}</span>
      </div>

      <Select value={side} onValueChange={(next) => onSide(next as NpcSide)}>
        <SelectTrigger className="h-9 w-36" aria-label={t('changeSideOf', { name })}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SIDES.map((option) => (
            <SelectItem key={option} value={option}>
              {t(option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
