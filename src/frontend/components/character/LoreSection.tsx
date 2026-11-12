'use client';

import type { ReactNode } from 'react';

import { useTranslations } from 'next-intl';

import { FieldLabel, InlineField } from '@frontend/components/ui/field';
import { AppIcon, type IconName } from '@frontend/components/ui/icon';
import { SectionCard } from '@frontend/components/ui/section-card';
import type { LoreData } from '@frontend/hooks/useCharacterLore';
import { cn } from '@frontend/lib/utils';

import { Textarea } from '../ui/textarea';

// maxLength values match the API's lore schema, so a save never fails on length
const APPEARANCE_MAX_LENGTH = 200;
const TEXT_MAX_LENGTH = 20_000;

/** Grows with the text. Browsers without field-sizing keep a handle to resize it by hand. */
const AUTO_HEIGHT = 'field-sizing-content resize-y supports-[field-sizing:content]:resize-none';

type LoreField = keyof LoreData;
type ChangeLore = (field: LoreField, value: string) => void;

interface Props {
  data: LoreData;
  onChange: ChangeLore;
  /** Shows the lore as text, for whoever can only read this sheet. */
  readOnly?: boolean;
}

/** Skin and hair are short descriptions, so they take the whole row and can wrap. */
const APPEARANCE: { field: LoreField; wide?: boolean }[] = [
  { field: 'age' },
  { field: 'height' },
  { field: 'weight' },
  { field: 'eyes' },
  { field: 'skin', wide: true },
  { field: 'hair', wide: true },
];

const PERSONALITY: { field: LoreField; icon: IconName }[] = [
  { field: 'personalityTraits', icon: 'Fingerprint' },
  { field: 'ideals', icon: 'Sparkles' },
  { field: 'bonds', icon: 'Bookmark' },
  { field: 'flaws', icon: 'TriangleAlert' },
];

const DETAILS: { field: LoreField; icon: IconName }[] = [
  { field: 'alliesAndEnemies', icon: 'Swords' },
  { field: 'organizations', icon: 'Shield' },
  { field: 'treasure', icon: 'Backpack' },
];

function LoreHeading({ icon, children }: { icon: IconName; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 py-2">
      <AppIcon name={icon} size={16} className="text-character-flare" aria-hidden="true" />
      <h2 className="text-label text-muted-foreground">{children}</h2>
    </div>
  );
}

/** The saved text with its line breaks, or a note saying nothing was written. */
function LoreText({ value }: { value?: string }) {
  const t = useTranslations('characters.loreFields');

  return value ? (
    <span className="wrap-anywhere whitespace-pre-line">{value}</span>
  ) : (
    <span className="text-muted-foreground italic">{t('notFilled')}</span>
  );
}

interface AppearanceFieldProps {
  field: LoreField;
  wide?: boolean;
  value?: string;
  onChange: ChangeLore;
}

function AppearanceField({ field, wide, value, onChange }: AppearanceFieldProps) {
  const t = useTranslations('characters.loreFields');
  const id = `lore-${field}`;

  if (!wide) {
    return (
      <InlineField
        id={id}
        label={t(field)}
        value={value || ''}
        maxLength={APPEARANCE_MAX_LENGTH}
        placeholder="—"
        // The character's traits ("Age", "Height"…): the browser's personal autofill doesn't belong
        autoComplete="off"
        onChange={(e) => onChange(field, e.target.value)}
      />
    );
  }

  return (
    <div className="col-span-2 flex flex-col gap-1">
      <FieldLabel htmlFor={id}>{t(field)}</FieldLabel>
      <Textarea
        id={id}
        value={value || ''}
        maxLength={APPEARANCE_MAX_LENGTH}
        placeholder="—"
        onChange={(e) => onChange(field, e.target.value)}
        className={cn(
          AUTO_HEIGHT,
          'bg-muted/40 hover:bg-muted focus-visible:bg-background min-h-10 border-none font-medium shadow-none',
        )}
      />
    </div>
  );
}

interface TextFieldProps {
  field: LoreField;
  icon: IconName;
  value?: string;
  onChange: ChangeLore;
  readOnly?: boolean;
}

function TextField({ field, icon, value, onChange, readOnly }: TextFieldProps) {
  const t = useTranslations('characters.loreFields');

  return (
    <SectionCard
      className={cn(
        'bg-card/50 flex flex-col shadow-none transition-colors',
        !readOnly && 'hover:border-character-muted',
      )}
    >
      <SectionCard.Header>
        <SectionCard.Title as="h3" icon={icon}>
          {t(field)}
        </SectionCard.Title>
      </SectionCard.Header>
      {readOnly ? (
        <p className="text-foreground px-4 py-3 text-sm leading-relaxed">
          <LoreText value={value} />
        </p>
      ) : (
        <Textarea
          aria-label={t(field)}
          maxLength={TEXT_MAX_LENGTH}
          value={value || ''}
          placeholder="—"
          onChange={(e) => onChange(field, e.target.value)}
          className={cn(
            AUTO_HEIGHT,
            'text-foreground min-h-20 flex-1 rounded-none border-none bg-transparent px-4 py-3 leading-relaxed shadow-none focus-visible:-outline-offset-2',
          )}
        />
      )}
    </SectionCard>
  );
}

export default function LoreSection({ data, onChange, readOnly }: Props) {
  const t = useTranslations('characters.loreFields');

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
      <div className="md:col-span-4">
        <LoreHeading icon="User">{t('appearance')}</LoreHeading>
        {readOnly ? (
          <dl className="grid grid-cols-2 gap-x-3 gap-y-4 pt-2">
            {APPEARANCE.map(({ field, wide }) => (
              <div key={field} className={cn('flex flex-col gap-1', wide && 'col-span-2')}>
                <dt className="text-label text-muted-foreground">{t(field)}</dt>
                <dd className="text-sm font-medium">
                  <LoreText value={data[field]} />
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <div className="grid grid-cols-2 gap-3 pt-2">
            {APPEARANCE.map(({ field, wide }) => (
              <AppearanceField
                key={field}
                field={field}
                wide={wide}
                value={data[field]}
                onChange={onChange}
              />
            ))}
          </div>
        )}
      </div>

      <div className="md:col-span-8">
        <LoreHeading icon="Heart">{t('personality')}</LoreHeading>
        <div className="grid grid-cols-1 gap-4 pt-2 lg:grid-cols-2">
          {PERSONALITY.map(({ field, icon }) => (
            <TextField
              key={field}
              field={field}
              icon={icon}
              value={data[field]}
              onChange={onChange}
              readOnly={readOnly}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4 md:col-span-12">
        <LoreHeading icon="History">{t('narrative')}</LoreHeading>
        <TextField
          field="backstory"
          icon="BookOpen"
          value={data.backstory}
          onChange={onChange}
          readOnly={readOnly}
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {DETAILS.map(({ field, icon }) => (
            <TextField
              key={field}
              field={field}
              icon={icon}
              value={data[field]}
              onChange={onChange}
              readOnly={readOnly}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
