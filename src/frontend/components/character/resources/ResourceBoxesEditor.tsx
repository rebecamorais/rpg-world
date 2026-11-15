'use client';

import { useEffect, useId, useRef, useState } from 'react';

import { useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';
import { FieldLabel } from '@frontend/components/ui/field';
import { AppIcon } from '@frontend/components/ui/icon';
import { Input } from '@frontend/components/ui/input';
import { SelectField } from '@frontend/components/ui/select-field';
import { Textarea } from '@frontend/components/ui/textarea';
import { ACCENT_COLORS, DEFAULT_ACCENT_HEX } from '@frontend/constants/accent-colors';
import { useCharacterActions, useLoadedCharacter } from '@frontend/context/CharacterContext';
import { useReportFieldValidity } from '@frontend/context/FieldValidityContext';
import { useCharacterChoices } from '@frontend/hooks/useCharacterChoices';
import { useClassResources } from '@frontend/hooks/useClassResources';
import {
  type ResourceEdit,
  addCustomResource,
  editResourceBox,
  newCustomKey,
  removeCustomResource,
  resetResourceBox,
  setResourceHidden,
} from '@frontend/lib/character-sheet-updates';
import { characterTheme, sixDigitHex } from '@frontend/lib/color-utils';
import { cn } from '@frontend/lib/utils';
import { CharacterClass } from '@frontend/types/spells';

import { stripTags } from '@shared/content/tags';
import {
  type CustomResource,
  type EditableResourceBox,
  MAX_RESOURCE_DESCRIPTION,
  RESOURCE_SOURCES,
  REST_CHOICES,
  type ResourceSource,
  type RestChoice,
  customFromClass,
  recoveryFor,
  recoveryOn,
  restChoiceOf,
} from '@shared/systems/dnd5e/class-resources';

import { useResourceBoxes } from './useResourceBoxes';

const MAX_USES = 1000;
const MAX_NAME = 100;
/** The recovery choice of a class box nobody changed: whatever the class says at this level. */
const AS_CLASS = 'class';
const WHOLE_NUMBER = /^\d+$/;

/** The uses typed in the field: a number, nothing (follow the class), or not valid yet. */
function parseUses(text: string, required: boolean): { value?: number; valid: boolean } {
  const trimmed = text.trim();
  if (trimmed === '') return { valid: !required };
  const value = Number(trimmed);
  return WHOLE_NUMBER.test(trimmed) && value <= MAX_USES
    ? { value, valid: true }
    : { valid: false };
}

/**
 * How many uses the box has. Typing can pass through invalid text, which never reaches the sheet
 * and holds the page's save. On a class box the field may stay empty: the class decides.
 */
function UsesInput({
  id,
  value,
  onChange,
  required,
  placeholder,
  describedBy,
}: {
  id: string;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  required: boolean;
  placeholder?: string;
  describedBy?: string;
}) {
  const t = useTranslations('common.numberField');
  const errorId = useId();
  // The text stands while `value` is still what it meant; a change from outside replaces it
  const [typed, setTyped] = useState<{ text: string; base: number | undefined } | null>(null);
  const typing = typed !== null && typed.base === value;
  const text = typing ? typed.text : value === undefined ? '' : String(value);
  const invalid = !parseUses(text, required).valid;
  useReportFieldValidity(invalid);

  return (
    <div className="flex flex-col gap-1">
      <Input
        id={id}
        inputMode="numeric"
        value={text}
        placeholder={placeholder}
        aria-invalid={invalid || undefined}
        aria-describedby={cn(invalid && errorId, describedBy) || undefined}
        onChange={(e) => {
          const next = parseUses(e.target.value, required);
          setTyped({ text: e.target.value, base: next.valid ? next.value : value });
          if (next.valid && next.value !== value) onChange(next.value);
        }}
        className="w-24"
      />
      {invalid && (
        <p id={errorId} className="text-caption text-danger-flare">
          {t('range', { min: 0, max: MAX_USES })}
        </p>
      )}
    </div>
  );
}

/** The sheet's color, the system's ones, or any other. */
function BoxColorPicker({
  color,
  onChange,
}: {
  color: string | undefined;
  onChange: (color: string | undefined) => void;
}) {
  const t = useTranslations('resourceEditor');
  const tAppearance = useTranslations('characterAppearance');
  const tColors = useTranslations('profileForm.colors');

  return (
    <fieldset className="flex flex-col gap-1">
      <legend className="text-label text-muted-foreground mb-1">{t('color')}</legend>
      <div className="flex flex-wrap items-center gap-1">
        {ACCENT_COLORS.map((option) => {
          const label = option.value ? tColors(option.name) : t('sheetColor');
          const isSelected = option.value === (color ?? '');
          return (
            <button
              key={option.name}
              type="button"
              title={label}
              aria-label={label}
              aria-pressed={isSelected}
              onClick={() => onChange(option.value || undefined)}
              className={cn(
                'focus-ring flex size-8 items-center justify-center rounded-full border-2 pointer-coarse:size-11',
                isSelected ? 'border-foreground' : 'border-transparent',
              )}
            >
              <span
                className="size-5 rounded-full"
                style={{ backgroundColor: option.value || 'var(--character-color)' }}
              />
            </button>
          );
        })}
        <label className="text-caption text-muted-foreground ml-2 flex items-center gap-2">
          <input
            type="color"
            value={sixDigitHex(color) ?? DEFAULT_ACCENT_HEX}
            onChange={(e) => onChange(e.target.value)}
            className="focus-ring border-border h-8 w-10 cursor-pointer rounded-md border bg-transparent p-1 pointer-coarse:h-11 pointer-coarse:w-12"
          />
          {tAppearance('anyColor')}
        </label>
      </div>
    </fieldset>
  );
}

/**
 * The box's description. On a class box it starts with the rule's text (tags as plain text), ready
 * to edit: only a text that differs from it is kept, and emptying it goes back to the rule.
 */
function DescriptionField({
  id,
  value,
  classText,
  onChange,
}: {
  id: string;
  value: string | undefined;
  classText: string | undefined;
  onChange: (value: string | undefined) => void;
}) {
  const t = useTranslations('resourceEditor');
  // While typing, the field keeps what is typed, even emptied; on leaving it shows what is kept
  const [typing, setTyping] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-1">
      <FieldLabel htmlFor={id}>{t('description')}</FieldLabel>
      <Textarea
        id={id}
        value={typing ?? value ?? classText ?? ''}
        maxLength={MAX_RESOURCE_DESCRIPTION}
        rows={classText ? 6 : 3}
        aria-describedby={`${id}-hint`}
        onChange={(e) => {
          const text = e.target.value;
          setTyping(text);
          onChange(text === '' || text === classText ? undefined : text);
        }}
        onBlur={() => setTyping(null)}
      />
      <p id={`${id}-hint`} className="text-caption text-muted-foreground">
        {t(classText ? 'descriptionHintClass' : 'descriptionHint')}
      </p>
    </div>
  );
}

/** The fields of one box. A class box shows what the class says wherever the player set nothing. */
function BoxFields({
  box,
  focusName,
  onRemoved,
}: {
  box: EditableResourceBox;
  focusName: boolean;
  onRemoved: () => void;
}) {
  const t = useTranslations('resourceEditor');
  const tPips = useTranslations('usePips');
  const { resources } = useLoadedCharacter();
  const { update } = useCharacterActions();
  const id = useId();
  const nameRef = useRef<HTMLInputElement>(null);
  const saved = resources?.[box.key];
  const own = saved?.custom;
  const edits = own ?? saved?.overrides ?? {};
  const change = (edit: ResourceEdit) => update(editResourceBox(box.key, edit));
  const nameMissing = own !== undefined && own.name.trim() === '';
  useReportFieldValidity(nameMissing);

  useEffect(() => {
    if (!focusName) return;
    nameRef.current?.focus();
    nameRef.current?.select();
  }, [focusName]);

  const rest = edits.recovery ? restChoiceOf(edits.recovery) : own ? 'none' : AS_CLASS;
  const restOptions = [
    ...(own ? [] : [{ value: AS_CLASS, label: t('recoveryAsClass') }]),
    ...REST_CHOICES.map((value) => ({ value, label: t(`recovery.${value}`) })),
  ];

  return (
    <div className="flex flex-col gap-4 px-3 pb-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex flex-col gap-1">
          <FieldLabel htmlFor={`${id}-name`}>{t('name')}</FieldLabel>
          <Input
            ref={nameRef}
            id={`${id}-name`}
            value={edits.name ?? ''}
            placeholder={box.base?.name}
            maxLength={MAX_NAME}
            aria-invalid={nameMissing || undefined}
            aria-describedby={nameMissing ? `${id}-name-error` : undefined}
            onChange={(e) => change({ name: e.target.value })}
          />
          {nameMissing && (
            <p id={`${id}-name-error`} className="text-caption text-danger-flare">
              {t('nameRequired')}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <FieldLabel htmlFor={`${id}-uses`}>{t('uses')}</FieldLabel>
          <UsesInput
            id={`${id}-uses`}
            value={edits.max}
            required={own !== undefined}
            placeholder={
              box.base && (box.base.max === null ? tPips('unlimited') : String(box.base.max))
            }
            describedBy={box.base ? `${id}-uses-hint` : undefined}
            onChange={(max) => change({ max })}
          />
        </div>
      </div>
      {box.base && (
        <p id={`${id}-uses-hint`} className="text-caption text-muted-foreground -mt-2">
          {t('asClassHint')}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <FieldLabel htmlFor={`${id}-rest`}>{t('recoveryLabel')}</FieldLabel>
          <SelectField
            id={`${id}-rest`}
            value={rest}
            options={restOptions}
            onValueChange={(value) =>
              change({
                recovery: value === AS_CLASS ? undefined : recoveryFor(value as RestChoice),
              })
            }
          />
        </div>
        {own && (
          <div className="flex flex-col gap-1">
            <FieldLabel htmlFor={`${id}-source`}>{t('source')}</FieldLabel>
            <SelectField
              id={`${id}-source`}
              value={own.source}
              options={RESOURCE_SOURCES.map((value) => ({ value, label: t(`sources.${value}`) }))}
              onValueChange={(value) => change({ source: value as ResourceSource })}
            />
          </div>
        )}
      </div>

      <BoxColorPicker color={edits.color} onChange={(color) => change({ color })} />

      <DescriptionField
        id={`${id}-description`}
        value={edits.description}
        classText={box.base && stripTags(box.base.description)}
        onChange={(description) => change({ description })}
      />

      <div className="flex justify-end">
        {own ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-danger-flare"
            onClick={() => {
              update(removeCustomResource(box.key));
              onRemoved();
            }}
          >
            <AppIcon name="Trash2" aria-hidden="true" />
            {t('remove')}
          </Button>
        ) : (
          saved?.overrides && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => update(resetResourceBox(box.key))}
            >
              <AppIcon name="RotateCcw" aria-hidden="true" />
              {t('reset')}
            </Button>
          )
        )}
      </div>
    </div>
  );
}

/** One box in the list: what it is at a glance, with its fields a tap away. */
function BoxRow({
  box,
  open,
  focusName,
  onToggle,
  onRemoved,
}: {
  box: EditableResourceBox;
  open: boolean;
  focusName: boolean;
  onToggle: () => void;
  onRemoved: () => void;
}) {
  const t = useTranslations('resourceEditor');
  const tRes = useTranslations('classResources');
  const tPips = useTranslations('usePips');
  const { update } = useCharacterActions();
  const panelId = useId();
  const theme = characterTheme(box.color);
  const name = box.name.trim() || t('unnamed');
  const rests = (['short', 'long'] as const).filter((rest) => recoveryOn(box, rest) !== null);

  return (
    <li>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 py-2">
        <div className={cn('flex min-w-0 items-center gap-2', box.hidden && 'opacity-60')}>
          <span
            aria-hidden="true"
            style={box.color ? theme.style : undefined}
            className={cn(
              'bg-character-flare size-3 shrink-0 rounded-[2px]',
              box.color && theme.className,
            )}
          />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold">{name}</span>
            <span className="text-caption text-muted-foreground">
              {[
                t(`sources.${box.source}`),
                box.max === null ? tPips('unlimited') : t('usesCount', { count: box.max }),
                ...rests.map((rest) => tRes(rest)),
                ...(box.hidden ? [t('hidden')] : []),
              ].join(' · ')}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={t(box.hidden ? 'showBox' : 'hideBox', { name })}
            onClick={() => update(setResourceHidden(box.key, !box.hidden))}
          >
            <AppIcon name={box.hidden ? 'EyeOff' : 'Eye'} aria-hidden="true" />
            {t(box.hidden ? 'show' : 'hide')}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-expanded={open}
            aria-controls={open ? panelId : undefined}
            aria-label={t(open ? 'closeBox' : 'editBox', { name })}
            onClick={onToggle}
          >
            <AppIcon name={open ? 'ChevronUp' : 'Pencil'} aria-hidden="true" />
            {t(open ? 'close' : 'edit')}
          </Button>
        </div>
      </div>
      {open && (
        <div id={panelId} role="group" aria-label={name}>
          <BoxFields box={box} focusName={focusName} onRemoved={onRemoved} />
        </div>
      )}
    </li>
  );
}

/** Picks a resource of one of the official classes and hands it over as a box of the player's own. */
function CopyFromClass({ onCopy }: { onCopy: (box: CustomResource) => void }) {
  const t = useTranslations('resourceEditor');
  const { edition, level, attributes } = useLoadedCharacter();
  const { classLabelOf } = useCharacterChoices();
  const id = useId();
  const [classId, setClassId] = useState('');
  const [picked, setPicked] = useState('');
  const { content } = useClassResources(edition, classId || null);

  // Spell slots are tracked with the sheet's magic, never in a box
  const choices = content
    ? [
        ...content.resources.map((resource) => ({ resource, source: 'class' as const })),
        ...content.subclass.resources.map((resource) => ({
          resource,
          source: 'subclass' as const,
        })),
      ].filter(({ resource }) => resource.unit !== 'spell-slots')
    : [];
  const options = choices.map(({ resource, source }) => ({
    value: `${source}:${resource.id}`,
    label: resource.name,
  }));
  const choice = choices.find(({ resource, source }) => `${source}:${resource.id}` === picked);

  if (!edition) {
    return <p className="text-caption text-muted-foreground">{t('copyNeedsEdition')}</p>;
  }

  return (
    <div className="border-border flex flex-col gap-3 rounded-md border p-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <FieldLabel htmlFor={`${id}-class`}>{t('copyClass')}</FieldLabel>
          <SelectField
            id={`${id}-class`}
            value={classId}
            placeholder={t('copyPick')}
            options={Object.values(CharacterClass).map((value) => ({
              value,
              label: classLabelOf(value),
            }))}
            onValueChange={(value) => {
              setClassId(value);
              setPicked('');
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <FieldLabel htmlFor={`${id}-resource`}>{t('copyResource')}</FieldLabel>
          <SelectField
            // The list belongs to the class: a new one starts with nothing picked
            key={classId}
            id={`${id}-resource`}
            value={picked}
            placeholder={t('copyPick')}
            options={options}
            onValueChange={setPicked}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-caption text-muted-foreground">{t('copyHint')}</p>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!choice}
          onClick={() => {
            if (!choice) return;
            onCopy(customFromClass(choice.resource, choice.source, level, attributes));
            setPicked('');
          }}
        >
          {t('copyAdd')}
        </Button>
      </div>
    </div>
  );
}

/**
 * The sheet's resource boxes, in its settings: change or hide what the class gives, and add boxes
 * of the player's own. Everything goes to the sheet's draft, like the rest of the page: only Save
 * keeps it. The Status tab stays for spending and giving back.
 */
export function ResourceBoxesEditor() {
  const t = useTranslations('resourceEditor');
  const { update } = useCharacterActions();
  const { all } = useResourceBoxes();
  const addRef = useRef<HTMLButtonElement>(null);
  const [openKey, setOpenKey] = useState<string | null>(null);
  // The box just made: its name gets the focus, ready to be typed over
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copying, setCopying] = useState(false);

  const add = (box: CustomResource) => {
    const key = newCustomKey();
    update(addCustomResource(key, box));
    setOpenKey(key);
    setNewKey(key);
  };

  return (
    <div className="border-border flex flex-col gap-3 border-t pt-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-label text-muted-foreground">{t('title')}</h3>
        <p className="text-caption text-muted-foreground">{t('hint')}</p>
      </div>

      {all.length === 0 ? (
        <p className="text-sm">{t('empty')}</p>
      ) : (
        <ul className="divide-border border-border divide-y rounded-md border">
          {all.map((box) => (
            <BoxRow
              key={box.key}
              box={box}
              open={openKey === box.key}
              focusName={newKey === box.key}
              onToggle={() => setOpenKey(openKey === box.key ? null : box.key)}
              onRemoved={() => {
                setOpenKey(null);
                // The row is gone: the focus goes to where the next box would come from
                addRef.current?.focus();
              }}
            />
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          ref={addRef}
          type="button"
          variant="secondary"
          size="sm"
          onClick={() =>
            add({ name: t('newName'), max: 1, recovery: recoveryFor('long'), source: 'manual' })
          }
        >
          <AppIcon name="Plus" aria-hidden="true" />
          {t('add')}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-expanded={copying}
          onClick={() => setCopying(!copying)}
        >
          <AppIcon name="Copy" aria-hidden="true" />
          {t('copy')}
        </Button>
      </div>
      {copying && <CopyFromClass onCopy={add} />}
    </div>
  );
}
