'use client';

import { useState } from 'react';

import Link from 'next/link';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { z } from 'zod/mini';

import { ChoiceSelect } from '@frontend/components/character/ChoiceSelect';
import { ClassChoicesStep } from '@frontend/components/character/ClassChoicesStep';
import { Button } from '@frontend/components/ui/button';
import { Card, CardContent } from '@frontend/components/ui/card';
import { FieldLabel } from '@frontend/components/ui/field';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormRootError,
} from '@frontend/components/ui/form';
import { Input } from '@frontend/components/ui/input';
import { CLASS_ICONS } from '@frontend/constants/character-choices';
import { useCurrentUser } from '@frontend/context/UserContext';
import { useCharacterChoices } from '@frontend/hooks/useCharacterChoices';
import { useClassResources } from '@frontend/hooks/useClassResources';
import { useCreateCharacter } from '@frontend/hooks/useCreateCharacter';
import { useErrorMessage } from '@frontend/hooks/useErrorMessage';
import { cn } from '@frontend/lib/utils';
import { CharacterClass } from '@frontend/types/spells';

import {
  type ClassChoiceSelections,
  acceptedSelections,
} from '@shared/systems/dnd5e/class-choices';
import { classDefaults } from '@shared/systems/dnd5e/class-defaults';
import { EDITIONS, type Edition } from '@shared/systems/dnd5e/content/editions';
import type { AttributeKey } from '@shared/systems/dnd5e/types';

/** Same limit as the API's character schema. */
const TEXT_MAX = 100;
/** The only system there is: shown as text until there is a second one to pick. */
const SYSTEM = 'DnD_5e';
const LISTED_CLASSES = new Set<string>(Object.values(CharacterClass));
// A new sheet's: the class's picks don't depend on them, only its hit points do (on the server)
const NEW_SHEET_ATTRIBUTES: Record<AttributeKey, number> = {
  STR: 10,
  DEX: 10,
  CON: 10,
  INT: 10,
  WIS: 10,
  CHA: 10,
};

/** Creates a playable character, or one of the GM's enemy sheets with `kind="npc"`. */
export default function NewCharacterForm({ kind = 'pc' }: { kind?: 'pc' | 'npc' }) {
  const { currentUser } = useCurrentUser();
  const t = useTranslations('characterCreation');
  const tCommon = useTranslations('common');
  const tHeader = useTranslations('characterHeader');
  const tEditions = useTranslations('sheetSettings');
  const { getErrorMessage } = useErrorMessage();
  const createMutation = useCreateCharacter(t('success'));
  const choices = useCharacterChoices();

  // Edition, class and the class's picks never stop the creation, so they live outside the form.
  // 2014 comes picked: it's the edition that fills the sheet from the class
  const [edition, setEdition] = useState<Edition>('2014');
  const [characterClass, setCharacterClass] = useState('');
  const [picks, setPicks] = useState<ClassChoiceSelections>({});
  // Only a class picked from the list has SRD picks; the player's own text gets today's sheet
  const classId = LISTED_CLASSES.has(characterClass) ? characterClass : null;
  const { content } = useClassResources(edition === '2014' ? edition : undefined, classId);
  const defaults = classDefaults(edition, content, NEW_SHEET_ATTRIBUTES);

  const newCharacterSchema = z.object({
    name: z.string().check(z.trim(), z.minLength(1, t('nameRequired')), z.maxLength(100)),
  });

  type NewCharacterFormValues = z.infer<typeof newCharacterSchema>;

  const form = useForm<NewCharacterFormValues>({
    resolver: zodResolver(newCharacterSchema),
    defaultValues: {
      name: '',
    },
  });

  if (!currentUser) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-muted-foreground">{t('requireLogin')}</p>
      </div>
    );
  }

  const onSubmit = (data: NewCharacterFormValues) => {
    const className = characterClass.trim();
    // Only the current class's picks: the ones made for another class stay on this screen
    const classChoices = defaults ? acceptedSelections(defaults.choices, picks) : {};
    createMutation.mutate(
      {
        name: data.name.trim(),
        system: SYSTEM,
        edition,
        ...(className && { class: className }),
        ...(Object.keys(classChoices).length > 0 && { classChoices }),
        ...(kind === 'npc' && { kind }),
      },
      {
        // Not the raw message: offline says so instead of "unknown error"
        onError: (err: Error) => form.setError('root', { message: getErrorMessage(err) }),
      },
    );
  };

  return (
    <div className="max-w-2xl">
      <Card>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <FormItem>
                    {/* The same label and field as the class below */}
                    <FormLabel
                      className={cn('text-label', !fieldState.error && 'text-muted-foreground')}
                    >
                      {t('nameLabel')}
                    </FormLabel>
                    <FormControl>
                      <Input
                        className="bg-muted h-10 font-medium"
                        maxLength={100}
                        // A character's name, not the user's: no personal autofill
                        autoComplete="off"
                        disabled={createMutation.isPending}
                        placeholder={t('namePlaceholder')}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col gap-1">
                <span className="text-label text-muted-foreground">{t('systemLabel')}</span>
                <p className="text-sm font-medium">{t('systems.dnd5e')}</p>
              </div>

              <fieldset disabled={createMutation.isPending} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <FieldLabel id="new-character-edition">{t('editionLabel')}</FieldLabel>
                  {/* Native radios, as on the sheet's settings: there is no radio primitive in ui */}
                  <div
                    role="radiogroup"
                    aria-labelledby="new-character-edition"
                    className="flex flex-wrap gap-2"
                  >
                    {EDITIONS.map((value) => (
                      <label
                        key={value}
                        className="border-border has-checked:border-primary has-checked:bg-muted has-focus-visible:ring-ring flex min-h-8 cursor-pointer items-center gap-2 rounded-md border px-3 py-1 text-sm has-focus-visible:ring-2 pointer-coarse:min-h-11"
                      >
                        <input
                          type="radio"
                          name="edition"
                          value={value}
                          checked={edition === value}
                          onChange={() => setEdition(value)}
                          className="accent-primary"
                        />
                        {tEditions(`edition${value}`)}
                      </label>
                    ))}
                  </div>
                </div>

                <ChoiceSelect
                  id="new-character-class"
                  maxLength={TEXT_MAX}
                  label={tHeader('class')}
                  value={characterClass}
                  matched={classId}
                  options={Object.values(CharacterClass).map((value) => ({
                    value,
                    label: choices.classLabelOf(value),
                    icon: CLASS_ICONS[value],
                  }))}
                  onChange={setCharacterClass}
                  placeholder={tHeader('classPlaceholder')}
                  otherLabel={tHeader('otherOption')}
                  otherPlaceholder={tHeader('classOtherPlaceholder')}
                />

                {classId && edition === '2024' && (
                  <p className="text-caption text-muted-foreground">{t('classHint2024')}</p>
                )}

                {defaults && (
                  <ClassChoicesStep
                    choices={defaults.choices}
                    picks={picks}
                    disabled={createMutation.isPending}
                    onChange={setPicks}
                  />
                )}
              </fieldset>

              <FormRootError />

              <div className="flex gap-2">
                <Button type="submit" loading={createMutation.isPending}>
                  {createMutation.isPending ? t('submitting') : t('submit')}
                </Button>
                <Button variant="outline" asChild>
                  <Link href={kind === 'npc' ? '/characters/npcs' : '/characters'}>
                    {tCommon('cancel')}
                  </Link>
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
