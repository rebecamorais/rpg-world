'use client';

import { type FormEvent, useState } from 'react';

import { useTranslations } from 'next-intl';

import { type ChoiceOption, ChoiceSelect } from '@frontend/components/character/ChoiceSelect';
import { Badge } from '@frontend/components/ui/badge';
import { Button } from '@frontend/components/ui/button';
import { AppIcon } from '@frontend/components/ui/icon';
import { SectionCard } from '@frontend/components/ui/section-card';
import {
  useCharacterActions,
  useCharacterMeta,
  useLoadedCharacter,
} from '@frontend/context/CharacterContext';
import { useCharacterChoices } from '@frontend/hooks/useCharacterChoices';
import { useClassResources } from '@frontend/hooks/useClassResources';
import { useItems } from '@frontend/hooks/useItems';
import { useSheetSource } from '@frontend/hooks/useSheetSource';
import { cn } from '@frontend/lib/utils';

import { classDefaults } from '@shared/systems/dnd5e/class-defaults';
import { matchSubclass } from '@shared/systems/dnd5e/class-resources';
import { LANGUAGE_IDS, isLanguageId } from '@shared/systems/dnd5e/languages';
import {
  ARMOR_IDS,
  type EffectiveProficiency,
  PROFICIENCY_KINDS,
  type ProficiencyKind,
  WEAPON_CATEGORY_IDS,
  addOwnProficiency,
  addProficiency,
  effectiveProficiencies,
  removeProficiency,
  restoreProficiency,
} from '@shared/systems/dnd5e/proficiencies';

const KIND_ICONS: Record<ProficiencyKind, string> = {
  armor: 'breastplate',
  weapons: 'crossed-swords',
  tools: 'toolbox',
  languages: 'talk',
};

/** Same limit as the other free-text fields of the sheet (and the server's). */
const OWN_MAX = 100;

const GRANTED = new Set(['class', 'subclass', 'feature']);

/**
 * Armor, weapons, tools and languages, as tags. What the class, its SRD subclass and its features
 * give shows on its own and can be turned off (and back on); the player adds from the lists or
 * writes their own after "Other…". Only the player's changes are saved (`effectiveProficiencies`).
 */
export default function ProficienciesSection() {
  const character = useLoadedCharacter();
  const {
    edition,
    class: className,
    subclass,
    level,
    attributes,
    proficiencies: saved,
    system,
  } = character;
  const { id } = useCharacterMeta();
  const { readOnly } = useSheetSource(id, system);
  const { update } = useCharacterActions();
  const t = useTranslations('proficiencies');
  const { classOf } = useCharacterChoices();
  const { content } = useClassResources(edition, classOf(className));
  // Proficiencies still follow the class only on 2014 (`CLASS_AUTOMATION`)
  const defaults = classDefaults(edition, content, attributes);
  const { list: items } = useItems();

  const shown = effectiveProficiencies(saved, {
    defaults,
    content,
    level,
    subclassId: content && matchSubclass(content, subclass),
  });

  // Weapons and tools are items of the SRD 5.1, by id: the class data uses those ids
  const items2014 = items.filter((item) => item.edition === '2014');
  const itemName = (itemId: string) =>
    (items2014.find((item) => item.id === itemId) ?? items.find((item) => item.id === itemId))
      ?.name ?? itemId;

  const labelOf = (kind: ProficiencyKind, value: string) => {
    if (kind === 'armor' && (ARMOR_IDS as readonly string[]).includes(value)) {
      return t(`armor.${value}` as Parameters<typeof t>[0]);
    }
    if (kind === 'weapons' && (WEAPON_CATEGORY_IDS as readonly string[]).includes(value)) {
      return t(`weapons.${value}` as Parameters<typeof t>[0]);
    }
    if (kind === 'languages') {
      return isLanguageId(value) ? t(`languages.${value}` as Parameters<typeof t>[0]) : value;
    }
    return itemName(value);
  };

  const optionsOf = (kind: ProficiencyKind): string[] => {
    switch (kind) {
      case 'armor':
        return [...ARMOR_IDS];
      case 'weapons':
        return [
          ...WEAPON_CATEGORY_IDS,
          ...items2014.filter((item) => item.category === 'weapon').map((item) => item.id),
        ];
      case 'tools':
        return items2014
          .filter((item) => item.category === 'tool' || item.category === 'instrument')
          .map((item) => item.id);
      case 'languages':
        return [...LANGUAGE_IDS];
    }
  };

  const featureName = (feature: string) =>
    [...(content?.features ?? []), ...(content?.subclassFeatures ?? [])].find(
      (f) => f.id === feature,
    )?.name ?? feature;

  const originLabel = ({ origin }: EffectiveProficiency) => {
    switch (origin.type) {
      case 'subclass':
        return t('origin.subclass', { feature: featureName(origin.feature) });
      case 'feature':
        return t('origin.feature', { feature: featureName(origin.feature) });
      default:
        return t(`origin.${origin.type}`);
    }
  };

  return (
    <SectionCard>
      <SectionCard.Header>
        <SectionCard.Title icon="tied-scroll" iconVariant="game" hint={t('hint')}>
          {t('title')}
        </SectionCard.Title>
      </SectionCard.Header>
      <SectionCard.Body className="flex flex-col gap-4">
        {PROFICIENCY_KINDS.map((kind) => {
          const entries = shown[kind];
          const active = new Set(entries.filter((e) => e.active && e.id).map((e) => e.id));
          return (
            <ProficiencyGroup
              key={kind}
              kind={kind}
              entries={entries}
              readOnly={readOnly}
              labelOf={(entry) => entry.text ?? labelOf(kind, entry.id ?? '')}
              originLabel={originLabel}
              options={optionsOf(kind)
                .filter((value) => !active.has(value))
                .map((value) => ({ value, label: labelOf(kind, value) }))}
              onAdd={(value, listed) =>
                update((c) => ({
                  proficiencies: listed
                    ? addProficiency(c.proficiencies, kind, value)
                    : addOwnProficiency(c.proficiencies, kind, value),
                }))
              }
              onRemove={(entry) =>
                update((c) => ({ proficiencies: removeProficiency(c.proficiencies, entry) }))
              }
              onRestore={(entry) =>
                update((c) => ({
                  proficiencies: restoreProficiency(c.proficiencies, kind, entry.id ?? ''),
                }))
              }
            />
          );
        })}
      </SectionCard.Body>
    </SectionCard>
  );
}

function ProficiencyGroup({
  kind,
  entries,
  readOnly,
  labelOf,
  originLabel,
  options,
  onAdd,
  onRemove,
  onRestore,
}: {
  kind: ProficiencyKind;
  entries: EffectiveProficiency[];
  readOnly: boolean;
  labelOf: (entry: EffectiveProficiency) => string;
  originLabel: (entry: EffectiveProficiency) => string;
  options: ChoiceOption[];
  /** `listed`: `value` is an id from the list; otherwise the player's own text. */
  onAdd: (value: string, listed: boolean) => void;
  onRemove: (entry: EffectiveProficiency) => void;
  onRestore: (entry: EffectiveProficiency) => void;
}) {
  const t = useTranslations('proficiencies');
  const [adding, setAdding] = useState(false);
  const [value, setValue] = useState('');
  const kindLabel = t(`kinds.${kind}`);
  const headingId = `proficiencies-${kind}`;
  const matched = options.some((option) => option.value === value) ? value : null;

  const close = () => {
    setAdding(false);
    setValue('');
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!value.trim()) return;
    onAdd(matched ?? value, matched !== null);
    close();
  };

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h3
          id={headingId}
          className="text-muted-foreground flex items-center gap-2 text-xs font-semibold"
        >
          <AppIcon
            name={KIND_ICONS[kind]}
            variant="game"
            size={16}
            className="text-character-flare shrink-0"
            aria-hidden="true"
          />
          {kindLabel}
        </h3>
        {!readOnly && !adding && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label={t('add', { kind: kindLabel })}
            title={t('add', { kind: kindLabel })}
            onClick={() => setAdding(true)}
          >
            <AppIcon name="Plus" aria-hidden="true" />
          </Button>
        )}
      </div>

      {entries.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t('none')}</p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {entries.map((entry) => {
            const label = labelOf(entry);
            const granted = GRANTED.has(entry.origin.type);
            const origin = originLabel(entry);
            return (
              <li key={entry.id ?? `own:${entry.text}`}>
                <Badge
                  variant={granted ? 'secondary' : 'outline'}
                  title={entry.active ? origin : `${origin} · ${t('off')}`}
                  className={cn(
                    'gap-1 py-1 font-medium',
                    !entry.active && 'text-muted-foreground border-dashed line-through',
                  )}
                >
                  <span>{label}</span>
                  <span className="sr-only">
                    {entry.active ? `(${origin})` : `(${origin}, ${t('off')})`}
                  </span>
                  {!readOnly && (
                    <ProficiencyAction
                      entry={entry}
                      label={label}
                      granted={granted}
                      onRemove={onRemove}
                      onRestore={onRestore}
                    />
                  )}
                </Badge>
              </li>
            );
          })}
        </ul>
      )}

      {adding && (
        <form onSubmit={submit} className="flex flex-col gap-2">
          <ChoiceSelect
            id={`proficiency-add-${kind}`}
            label={t('addLabel', { kind: kindLabel })}
            value={value}
            matched={matched}
            options={options}
            placeholder={t('placeholder')}
            otherLabel={t('other')}
            otherPlaceholder={t('otherPlaceholder')}
            maxLength={OWN_MAX}
            onChange={setValue}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={close}>
              {t('cancel')}
            </Button>
            <Button type="submit" variant="character" size="sm" disabled={!value.trim()}>
              {t('confirmAdd')}
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}

/** Off for what is given (it stays, crossed out), back on for one turned off, out for the player's. */
function ProficiencyAction({
  entry,
  label,
  granted,
  onRemove,
  onRestore,
}: {
  entry: EffectiveProficiency;
  label: string;
  granted: boolean;
  onRemove: (entry: EffectiveProficiency) => void;
  onRestore: (entry: EffectiveProficiency) => void;
}) {
  const t = useTranslations('proficiencies');
  const restore = granted && !entry.active;
  const name = restore
    ? t('turnOn', { label })
    : granted
      ? t('turnOff', { label })
      : t('remove', { label });

  return (
    <button
      type="button"
      aria-label={name}
      title={name}
      onClick={() => (restore ? onRestore(entry) : onRemove(entry))}
      className="focus-ring text-muted-foreground hover:text-foreground -mr-1 rounded-sm p-0.5 no-underline"
    >
      <AppIcon name={restore ? 'RotateCcw' : 'X'} size={12} aria-hidden="true" />
    </button>
  );
}
