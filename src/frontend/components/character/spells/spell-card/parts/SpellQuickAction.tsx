'use client';

import React from 'react';

import { AppIcon } from '@frontend/components/ui/icon';
import { Tooltip, TooltipContent, TooltipTrigger } from '@frontend/components/ui/tooltip';
import { cn } from '@frontend/lib/utils';

const BUTTON =
  'focus-ring touch-target flex size-10 items-center justify-center rounded-lg border transition-colors';

function QuickActionButton({
  label,
  className,
  onClick,
  children,
}: {
  label: string;
  className: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className={cn(BUTTON, className)}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent className="text-xs font-medium">{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * Learn/forget straight from the collapsed card in the spell search, so building a spellbook
 * doesn't take expand → scroll → click for every spell. A learned spell shows a check that
 * turns into an X on hover, since clicking it forgets the spell.
 */
export function LearnSpellAction({
  isLearned,
  learnLabel,
  forgetLabel,
  onLearn,
  onForget,
}: {
  isLearned: boolean;
  learnLabel: string;
  forgetLabel: string;
  onLearn: () => void;
  onForget: () => void;
}) {
  if (!isLearned) {
    return (
      <QuickActionButton
        label={learnLabel}
        onClick={onLearn}
        className="border-border text-muted-foreground hover:border-character hover:bg-character-surface hover:text-character-flare"
      >
        <AppIcon name="Plus" size={18} aria-hidden="true" />
      </QuickActionButton>
    );
  }

  return (
    <QuickActionButton
      label={forgetLabel}
      onClick={onForget}
      className="group/learned border-character-muted bg-character-surface text-character-flare hover:border-danger-muted hover:bg-danger-surface hover:text-danger-flare focus-visible:text-danger-flare"
    >
      <AppIcon
        name="Check"
        size={18}
        aria-hidden="true"
        className="group-hover/learned:hidden group-focus-visible/learned:hidden"
      />
      <AppIcon
        name="X"
        size={18}
        aria-hidden="true"
        className="hidden group-hover/learned:block group-focus-visible/learned:block"
      />
    </QuickActionButton>
  );
}
