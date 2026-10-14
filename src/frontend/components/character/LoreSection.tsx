'use client';

import { useTranslations } from 'next-intl';

import { Card, CardContent, CardHeader, CardTitle } from '@frontend/components/ui/card';
import { InlineField } from '@frontend/components/ui/field';
import { AppIcon } from '@frontend/components/ui/icon';
import { SectionCard } from '@frontend/components/ui/section-card';
import { cn } from '@frontend/lib/utils';

import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import { Textarea } from '../ui/textarea';

interface LoreData extends Partial<DnD5eCharacter> {
  age?: string;
  height?: string;
  weight?: string;
  eyes?: string;
  skin?: string;
  hair?: string;
  backstory?: string;
  personalityTraits?: string;
  ideals?: string;
  bonds?: string;
  flaws?: string;
  alliesAndEnemies?: string;
  organizations?: string;
  treasure?: string;
}

interface Props {
  data: LoreData;
  onBasicInfoChange: (field: keyof DnD5eCharacter, value: string) => void;
}

interface AppearanceFieldProps {
  label: string;
  field: keyof DnD5eCharacter;
  value?: string;
  onBasicInfoChange: (field: keyof DnD5eCharacter, value: string) => void;
}

const AppearanceField = ({ label, field, value, onBasicInfoChange }: AppearanceFieldProps) => (
  <InlineField
    id={`lore-${field}`}
    label={label}
    value={value || ''}
    placeholder="—"
    onChange={(e) => onBasicInfoChange(field, e.target.value)}
  />
);

interface TextAreaFieldProps {
  label: string;
  field: keyof DnD5eCharacter;
  value?: string;
  icon: string;
  onBasicInfoChange: (field: keyof DnD5eCharacter, value: string) => void;
  placeholder?: string;
}

const TextAreaField = ({
  label,
  field,
  value,
  icon,
  onBasicInfoChange,
  placeholder,
}: TextAreaFieldProps) => (
  <SectionCard className="bg-card/50 hover:border-character-muted shadow-none transition-colors">
    <SectionCard.Header>
      <SectionCard.Title icon={icon}>{label}</SectionCard.Title>
    </SectionCard.Header>
    <Textarea
      aria-label={label}
      value={value || ''}
      placeholder={placeholder}
      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
        onBasicInfoChange(field, e.target.value)
      }
      className={cn(
        'text-foreground min-h-[120px] w-full resize-none rounded-none border-none bg-transparent px-4 py-3 text-sm leading-relaxed shadow-none focus-visible:-outline-offset-2',
        !value && 'italic',
      )}
    />
  </SectionCard>
);

export default function LoreSection({ data, onBasicInfoChange }: Props) {
  const t = useTranslations('characters.loreFields');

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {/* Top Row: Appearance and Personality */}
        <div className="md:col-span-4">
          {/* Appearance Grid */}
          <Card className="border-none bg-transparent shadow-none">
            <CardHeader className="flex flex-row items-center gap-2 px-0 py-2">
              <AppIcon name="User" size={16} className="text-character-flare" />
              <CardTitle className="text-label text-muted-foreground">{t('appearance')}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 p-0 pt-2">
              <AppearanceField
                label={t('age')}
                field="age"
                value={data.age}
                onBasicInfoChange={onBasicInfoChange}
              />
              <AppearanceField
                label={t('height')}
                field="height"
                value={data.height}
                onBasicInfoChange={onBasicInfoChange}
              />
              <AppearanceField
                label={t('weight')}
                field="weight"
                value={data.weight}
                onBasicInfoChange={onBasicInfoChange}
              />
              <AppearanceField
                label={t('eyes')}
                field="eyes"
                value={data.eyes}
                onBasicInfoChange={onBasicInfoChange}
              />
              <AppearanceField
                label={t('skin')}
                field="skin"
                value={data.skin}
                onBasicInfoChange={onBasicInfoChange}
              />
              <AppearanceField
                label={t('hair')}
                field="hair"
                value={data.hair}
                onBasicInfoChange={onBasicInfoChange}
              />
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-8">
          {/* Personality Sections */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 py-2">
              <AppIcon name="Heart" size={16} className="text-character-flare" />
              <h3 className="text-label">{t('personality')}</h3>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <TextAreaField
                label={t('personalityTraits')}
                field="personalityTraits"
                value={data.personalityTraits}
                icon="Fingerprint"
                onBasicInfoChange={onBasicInfoChange}
                placeholder={t('personalityTraits') + '...'}
              />
              <TextAreaField
                label={t('ideals')}
                field="ideals"
                value={data.ideals}
                icon="Heart"
                onBasicInfoChange={onBasicInfoChange}
                placeholder={t('ideals') + '...'}
              />
              <TextAreaField
                label={t('bonds')}
                field="bonds"
                value={data.bonds}
                icon="Heart"
                onBasicInfoChange={onBasicInfoChange}
                placeholder={t('bonds') + '...'}
              />
              <TextAreaField
                label={t('flaws')}
                field="flaws"
                value={data.flaws}
                icon="Heart"
                onBasicInfoChange={onBasicInfoChange}
                placeholder={t('flaws') + '...'}
              />
            </div>
          </div>
        </div>

        {/* Bottom Row: Narrative and Details - Full Width */}
        <div className="flex flex-col gap-6 md:col-span-12">
          <div className="flex items-center gap-2 py-2">
            <AppIcon name="History" size={16} className="text-character-flare" />
            <h3 className="text-label">{t('narrative')}</h3>
          </div>

          <TextAreaField
            label={t('backstory')}
            field="backstory"
            value={data.backstory}
            icon="BookOpen"
            onBasicInfoChange={onBasicInfoChange}
            placeholder={t('backstory') + '...'}
          />

          <TextAreaField
            label={t('alliesAndEnemies')}
            field="alliesAndEnemies"
            value={data.alliesAndEnemies}
            icon="User"
            onBasicInfoChange={onBasicInfoChange}
            placeholder={t('alliesAndEnemies') + '...'}
          />

          <TextAreaField
            label={t('organizations')}
            field="organizations"
            value={data.organizations}
            icon="User"
            onBasicInfoChange={onBasicInfoChange}
            placeholder={t('organizations') + '...'}
          />

          <TextAreaField
            label={t('treasure')}
            field="treasure"
            value={data.treasure}
            icon="BookOpen"
            onBasicInfoChange={onBasicInfoChange}
            placeholder={t('treasure') + '...'}
          />
        </div>
      </div>
    </div>
  );
}
