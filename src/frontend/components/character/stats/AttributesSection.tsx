'use client';

import { useState } from 'react';

import { useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@frontend/components/ui/dialog';
import { AppIcon } from '@frontend/components/ui/icon';
import { Label } from '@frontend/components/ui/label';
import { NumberInput } from '@frontend/components/ui/number-input';
import { SectionCard } from '@frontend/components/ui/section-card';
import { useCharacterActions, useLoadedCharacter } from '@frontend/context/CharacterContext';
import { setAttribute, setAttributes } from '@frontend/lib/character-sheet-updates';

import type { AttributeKey } from '@shared/systems/dnd5e';
import { ATTRIBUTE_KEYS, MAX_ATTRIBUTE, MIN_ATTRIBUTE } from '@shared/systems/dnd5e/constants';

import AttributeCard from './AttributeCard';

export default function AttributesSection() {
  const { attributes } = useLoadedCharacter();
  const { update } = useCharacterActions();
  const t = useTranslations('attributes');
  const [isOpen, setIsOpen] = useState(false);
  const [tempValues, setTempValues] = useState<Record<AttributeKey, number>>(attributes);
  // Fields whose text isn't a valid score yet; saving waits for them
  const [invalid, setInvalid] = useState<Set<AttributeKey>>(new Set());

  const handleSave = () => {
    if (invalid.size > 0) return;
    update(setAttributes(tempValues));
    setIsOpen(false);
  };

  const setValidity = (key: AttributeKey, valid: boolean) =>
    setInvalid((prev) => {
      const next = new Set(prev);
      if (valid) next.delete(key);
      else next.add(key);
      return next;
    });

  const half = Math.ceil(ATTRIBUTE_KEYS.length / 2);
  const firstCol = ATTRIBUTE_KEYS.slice(0, half);
  const secondCol = ATTRIBUTE_KEYS.slice(half);

  const attributeIcons: Record<AttributeKey, string> = {
    STR: 'biceps',
    DEX: 'lightning-bow',
    CON: 'heart-plus',
    INT: 'brain',
    WIS: 'meditation',
    CHA: 'drama-masks',
  };

  const renderAttribute = (key: AttributeKey) => (
    <AttributeCard
      key={key}
      label={t(`abbreviations.${key}`)}
      value={attributes[key] ?? 10}
      onChange={(value) => update(setAttribute(key, value))}
      icon={attributeIcons[key]}
    />
  );

  return (
    <SectionCard>
      <SectionCard.Header>
        <SectionCard.Title icon="Shield">{t('title')}</SectionCard.Title>

        <SectionCard.Actions>
          <Dialog
            open={isOpen}
            onOpenChange={(open) => {
              if (open) {
                setTempValues(attributes);
                setInvalid(new Set());
              }
              setIsOpen(open);
            }}
          >
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label={t('bulkEditTitle')}
                className="text-muted-foreground hover:text-foreground h-8 w-8"
              >
                <AppIcon name="Settings2" size="sm" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{t('bulkEditTitle')}</DialogTitle>
                <DialogDescription className="sr-only">
                  {t('bulkEditDescription')}
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                {ATTRIBUTE_KEYS.map((key) => (
                  <div key={key} className="flex flex-col gap-2">
                    <Label htmlFor={key} className="text-label">
                      {t(key)}
                    </Label>
                    <NumberInput
                      id={key}
                      min={MIN_ATTRIBUTE}
                      max={MAX_ATTRIBUTE}
                      value={tempValues[key] ?? 10}
                      onValueChange={(value) =>
                        setTempValues((prev) => ({ ...prev, [key]: value }))
                      }
                      onValidityChange={(valid) => setValidity(key, valid)}
                      className="h-10 font-mono text-lg font-bold"
                    />
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  {t('cancel')}
                </Button>
                <Button onClick={handleSave} disabled={invalid.size > 0}>
                  {t('save')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </SectionCard.Actions>
      </SectionCard.Header>
      <SectionCard.Body className="grid grid-cols-2 gap-4">
        <div className="flex flex-col items-center gap-4">{firstCol.map(renderAttribute)}</div>
        <div className="flex flex-col items-center gap-4">{secondCol.map(renderAttribute)}</div>
      </SectionCard.Body>
    </SectionCard>
  );
}
