'use client';

import { BookOpen, Fingerprint, Heart, History, LucideIcon, User } from 'lucide-react';
import { useTranslations } from 'next-intl';

import CharacterActionBar from '@frontend/components/character/CharacterActionBar';
import { Card, CardContent, CardHeader, CardTitle } from '@frontend/components/ui/card';
import { Label } from '@frontend/components/ui/label';
import { useCharacterContext } from '@frontend/context/CharacterContext';
import { cn } from '@frontend/lib/utils';

import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import { GhostInput } from '../ui/ghost-input';
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
  <div className="flex flex-col gap-1">
    <Label className="text-muted-foreground text-[10px] tracking-wider uppercase">{label}</Label>
    <div className="group relative">
      <GhostInput
        value={value || ''}
        placeholder="—"
        onChange={(e) => onBasicInfoChange(field, e.target.value)}
        className="bg-muted/20 group-hover:bg-muted/40 focus:border-primary/30 focus:bg-background h-10 border-b border-transparent px-3 font-medium transition-all focus:ring-0"
        showIcon={true}
      />
    </div>
  </div>
);

interface TextAreaFieldProps {
  label: string;
  field: keyof DnD5eCharacter;
  value?: string;
  icon: LucideIcon;
  onBasicInfoChange: (field: keyof DnD5eCharacter, value: string) => void;
  placeholder?: string;
}

const TextAreaField = ({
  label,
  field,
  value,
  icon: Icon,
  onBasicInfoChange,
  placeholder,
}: TextAreaFieldProps) => (
  <Card className="border-border bg-card/50 group ring-border hover:ring-primary/30 active:ring-primary/50 relative overflow-hidden border-none shadow-none ring-1 transition-all">
    <CardHeader className="bg-muted/30 flex flex-row items-center justify-between px-4 py-2">
      <div className="flex items-center gap-2">
        <Icon className="text-primary h-3.5 w-3.5" />
        <CardTitle className="text-[10px] tracking-widest uppercase opacity-70">{label}</CardTitle>
      </div>
    </CardHeader>
    <CardContent className="p-0">
      <Textarea
        value={value || ''}
        placeholder={placeholder}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
          onBasicInfoChange(field, e.target.value)
        }
        className={cn(
          'text-muted-foreground min-h-[120px] w-full resize-none border-none bg-transparent px-4 py-3 text-sm leading-relaxed shadow-none ring-0 outline-none focus-visible:ring-0 focus-visible:ring-offset-0',
          !value && 'italic opacity-50',
        )}
      />
    </CardContent>
  </Card>
);

export default function LoreSection({ data, onBasicInfoChange }: Props) {
  const t = useTranslations('characters.loreFields');
  const { updateLore, isSaving, hasUnsavedChanges, setHasUnsavedChanges, deleteCharacter } =
    useCharacterContext();

  const handleSave = async () => {
    // CharacterContext's updateLore handles specific lore persistence
    await updateLore(data as unknown as Record<string, unknown>);
    setHasUnsavedChanges(false);
  };

  const handleDelete = () => {
    if (data.id) deleteCharacter(data as DnD5eCharacter);
  };

  return (
    <div className="flex flex-col gap-6">
      <CharacterActionBar
        characterName={data.name || ''}
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        onSave={handleSave}
        onDelete={handleDelete}
      />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {/* Top Row: Appearance and Personality */}
        <div className="md:col-span-4">
          {/* Appearance Grid */}
          <Card className="border-none bg-transparent shadow-none">
            <CardHeader className="flex flex-row items-center gap-2 px-0 py-2">
              <User className="text-primary h-4 w-4" />
              <CardTitle className="text-xs tracking-widest uppercase">{t('appearance')}</CardTitle>
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
              <Heart className="text-primary h-4 w-4" />
              <h3 className="text-xs font-bold tracking-widest uppercase">{t('personality')}</h3>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <TextAreaField
                label={t('personalityTraits')}
                field="personalityTraits"
                value={data.personalityTraits}
                icon={Fingerprint}
                onBasicInfoChange={onBasicInfoChange}
                placeholder={t('personalityTraits') + '...'}
              />
              <TextAreaField
                label={t('ideals')}
                field="ideals"
                value={data.ideals}
                icon={Heart}
                onBasicInfoChange={onBasicInfoChange}
                placeholder={t('ideals') + '...'}
              />
              <TextAreaField
                label={t('bonds')}
                field="bonds"
                value={data.bonds}
                icon={Heart}
                onBasicInfoChange={onBasicInfoChange}
                placeholder={t('bonds') + '...'}
              />
              <TextAreaField
                label={t('flaws')}
                field="flaws"
                value={data.flaws}
                icon={Heart}
                onBasicInfoChange={onBasicInfoChange}
                placeholder={t('flaws') + '...'}
              />
            </div>
          </div>
        </div>

        {/* Bottom Row: Narrative and Details - Full Width */}
        <div className="flex flex-col gap-6 md:col-span-12">
          <div className="flex items-center gap-2 py-2">
            <History className="text-primary h-4 w-4" />
            <h3 className="text-xs font-bold tracking-widest uppercase">{t('narrative')}</h3>
          </div>

          <TextAreaField
            label={t('backstory')}
            field="backstory"
            value={data.backstory}
            icon={BookOpen}
            onBasicInfoChange={onBasicInfoChange}
            placeholder={t('backstory') + '...'}
          />

          <TextAreaField
            label={t('alliesAndEnemies')}
            field="alliesAndEnemies"
            value={data.alliesAndEnemies}
            icon={User}
            onBasicInfoChange={onBasicInfoChange}
            placeholder={t('alliesAndEnemies') + '...'}
          />

          <TextAreaField
            label={t('organizations')}
            field="organizations"
            value={data.organizations}
            icon={User}
            onBasicInfoChange={onBasicInfoChange}
            placeholder={t('organizations') + '...'}
          />

          <TextAreaField
            label={t('treasure')}
            field="treasure"
            value={data.treasure}
            icon={BookOpen}
            onBasicInfoChange={onBasicInfoChange}
            placeholder={t('treasure') + '...'}
          />
        </div>
      </div>
    </div>
  );
}
