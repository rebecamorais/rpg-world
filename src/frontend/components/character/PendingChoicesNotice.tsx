'use client';

import { useId, useRef, useState } from 'react';

import { useTranslations } from 'next-intl';

import { ClassChoicesStep } from '@frontend/components/character/ClassChoicesStep';
import { Button } from '@frontend/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@frontend/components/ui/dialog';
import { AppIcon } from '@frontend/components/ui/icon';
import {
  useCharacterActions,
  useCharacterMeta,
  useLoadedCharacter,
} from '@frontend/context/CharacterContext';
import { useCharacterChoices } from '@frontend/hooks/useCharacterChoices';
import { useClassResources } from '@frontend/hooks/useClassResources';
import { useSheetSource } from '@frontend/hooks/useSheetSource';
import { dismissClassChoice, setClassChoice } from '@frontend/lib/character-sheet-updates';
import { characterTheme } from '@frontend/lib/color-utils';
import { CharacterClass } from '@frontend/types/spells';

import {
  type ClassChoice,
  type ClassChoiceSelections,
  pendingChoices,
} from '@shared/systems/dnd5e/class-choices';
import { classDefaults } from '@shared/systems/dnd5e/class-defaults';

// As on the creation form: only a class picked from the list has SRD picks, and it is what the
// server checks them against. The player's own text keeps today's sheet
const LISTED_CLASSES = new Set<string>(Object.values(CharacterClass));

/**
 * The class's picks still open on the sheet (skills, tools), each with "resolve" and "dismiss".
 * It never goes on its own: only when every pick is made or the player dismisses it. A dismissal
 * is kept by the choice's identity, so it holds for that class only. Both go into the sheet's
 * draft, like any other edit; the sheet's save bar saves them. Not shown on a read-only sheet.
 */
export function PendingChoicesNotice() {
  const character = useLoadedCharacter();
  const { edition, class: className, attributes, classChoices, dismissedChoices } = character;
  const { id } = useCharacterMeta();
  const { readOnly } = useSheetSource(id, character.system);
  const { update } = useCharacterActions();
  const t = useTranslations('pendingChoices');
  const tCreation = useTranslations('characterCreation');
  const { classLabelOf } = useCharacterChoices();
  const titleId = useId();

  const classId = LISTED_CLASSES.has(className) ? (className as CharacterClass) : null;
  const { content } = useClassResources(edition, classId);
  // The picks follow the class only on 2014 (`CLASS_AUTOMATION`)
  const defaults = classId ? classDefaults(edition, content, attributes) : null;
  const [resolving, setResolving] = useState<ClassChoice | null>(null);
  const opener = useRef<HTMLElement | null>(null);

  // Only sheets born with class picks (the key, even empty): a sheet from before them keeps what
  // the player filled in by hand and never shows the notice
  if (readOnly || !defaults || !classId || !classChoices) return null;
  const pending = pendingChoices(defaults.choices, classChoices, dismissedChoices);
  const classLabel = classLabelOf(classId);
  const choiceLabel = (choice: ClassChoice) =>
    tCreation(choice.kind === 'skills' ? 'choiceSkills' : 'choiceTools');

  return (
    <>
      {pending.length > 0 && (
        <section
          aria-labelledby={titleId}
          className="border-warning-muted bg-warning-surface flex flex-col gap-3 rounded-md border px-4 py-3"
        >
          <div className="flex flex-col gap-1">
            <h2 id={titleId} className="text-warning-flare flex items-center gap-2 text-sm">
              <AppIcon name="Scroll" size="sm" aria-hidden="true" className="shrink-0" />
              <span className="font-medium">{t('title')}</span>
            </h2>
            <p className="text-caption text-muted-foreground">
              {t('description', { className: classLabel })}
            </p>
          </div>
          <ul className="flex flex-col gap-2">
            {pending.map(({ choice, picked }) => {
              const label = choiceLabel(choice);
              return (
                <li key={choice.key} className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm">
                    <span className="text-foreground font-medium">{label}</span>{' '}
                    <span className="text-muted-foreground">
                      {t('progress', { picked: picked.length, count: choice.count })}
                    </span>
                  </span>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="character"
                      aria-label={t('resolveLabel', { choice: label })}
                      onClick={(event) => {
                        opener.current = event.currentTarget;
                        setResolving(choice);
                      }}
                    >
                      {t('resolve')}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      aria-label={t('dismissLabel', { choice: label })}
                      onClick={() => update(dismissClassChoice(choice.key))}
                    >
                      {t('dismiss')}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <Dialog open={resolving !== null} onOpenChange={(open) => !open && setResolving(null)}>
        {resolving && (
          <ResolveChoiceDialog
            choice={resolving}
            title={t('dialogTitle', { className: classLabel, choice: choiceLabel(resolving) })}
            picks={classChoices ?? {}}
            accentColor={character.accentColor}
            onCloseAutoFocus={(event) => {
              const gone = opener.current && !opener.current.isConnected;
              opener.current = null;
              if (!gone) return;
              // "Done" on the last open pick took the notice away, "Resolve" with it: the page's
              // title takes the focus instead of its top (the main area, when there is no h1)
              const target =
                document.querySelector<HTMLElement>('main h1') ??
                document.getElementById('main-content');
              if (!target) return;
              event.preventDefault();
              // A title isn't focusable by itself; -1 lets the script focus it without a Tab stop
              if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
              target.focus();
            }}
            onDone={(picked) => {
              update(setClassChoice(resolving.key, picked));
              setResolving(null);
            }}
          />
        )}
      </Dialog>
    </>
  );
}

/**
 * The creation form's picker for one choice, opened with the picks that count so far. What is
 * picked goes into the draft only on "Done"; closing leaves the sheet as it was.
 */
function ResolveChoiceDialog({
  choice,
  title,
  picks,
  accentColor,
  onCloseAutoFocus,
  onDone,
}: {
  choice: ClassChoice;
  title: string;
  picks: ClassChoiceSelections;
  accentColor?: string;
  onCloseAutoFocus: (event: Event) => void;
  onDone: (picked: string[]) => void;
}) {
  const t = useTranslations('pendingChoices');
  const tCommon = useTranslations('common');
  const [draft, setDraft] = useState<ClassChoiceSelections>(() => ({
    [choice.key]: picks[choice.key] ?? [],
  }));

  return (
    <DialogContent
      className="character-context border-border bg-background p-0 shadow-2xl sm:max-w-[480px]"
      style={characterTheme(accentColor).style}
      onCloseAutoFocus={onCloseAutoFocus}
    >
      <DialogHeader className="border-border border-b p-6 pb-4">
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{t('dialogHint')}</DialogDescription>
      </DialogHeader>
      <div className="max-h-[60vh] overflow-y-auto p-6">
        <ClassChoicesStep choices={[choice]} picks={draft} hint={null} onChange={setDraft} />
      </div>
      <DialogFooter className="border-border bg-muted/50 items-center gap-3 border-t p-6 sm:justify-between">
        <p className="text-caption text-muted-foreground">{tCommon('draftNote')}</p>
        <div className="flex gap-2">
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              {tCommon('cancel')}
            </Button>
          </DialogClose>
          <Button type="button" variant="character" onClick={() => onDone(draft[choice.key] ?? [])}>
            {tCommon('done')}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  );
}
