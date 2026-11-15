'use client';

import React from 'react';

import { AppIcon } from '@frontend/components/ui/icon';
import { Spinner } from '@frontend/components/ui/spinner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@frontend/components/ui/tooltip';
import { cn } from '@frontend/lib/utils';

const BUTTON =
  'focus-ring touch-target flex size-10 items-center justify-center rounded-lg border transition-colors disabled:cursor-wait disabled:opacity-70';

/**
 * While its spell saves the button is disabled: the same spot turns into the opposite action once
 * the answer comes, and a second tap there would undo the first.
 */
function QuickActionButton({
  label,
  className,
  pending = false,
  onClick,
  children,
}: {
  label: string;
  className: string;
  pending?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          disabled={pending}
          aria-busy={pending || undefined}
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className={cn(BUTTON, className)}
        >
          {pending ? <Spinner aria-hidden="true" /> : children}
        </button>
      </TooltipTrigger>
      <TooltipContent className="text-xs font-medium">{label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * Learn/forget straight from the collapsed card in the spell search, so building a spellbook
 * doesn't take expand → scroll → click for every spell. A learned spell shows a check that
 * turns into an X on hover, since clicking it forgets the spell (after a confirmation).
 */
export function LearnSpellAction({
  isLearned,
  learnLabel,
  forgetLabel,
  pending,
  onLearn,
  onForget,
}: {
  isLearned: boolean;
  learnLabel: string;
  forgetLabel: string;
  pending?: boolean;
  onLearn: () => void;
  onForget: () => void;
}) {
  if (!isLearned) {
    return (
      <QuickActionButton
        label={learnLabel}
        pending={pending}
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
      pending={pending}
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

/** Prepared marker on the collapsed card: the most common action while playing a prepared caster. */
export function PrepareSpellAction({
  isPrepared,
  prepareLabel,
  unprepareLabel,
  pending,
  onToggle,
}: {
  isPrepared: boolean;
  prepareLabel: string;
  unprepareLabel: string;
  pending?: boolean;
  onToggle: () => void;
}) {
  return (
    <QuickActionButton
      label={isPrepared ? unprepareLabel : prepareLabel}
      pending={pending}
      onClick={onToggle}
      className={
        isPrepared
          ? 'border-warning-muted bg-warning-surface text-warning-flare hover:border-warning'
          : 'border-border text-muted-foreground hover:border-warning-muted hover:text-warning-flare'
      }
    >
      <AppIcon
        name="Bookmark"
        size={18}
        aria-hidden="true"
        className={cn(isPrepared && 'fill-current')}
      />
    </QuickActionButton>
  );
}
