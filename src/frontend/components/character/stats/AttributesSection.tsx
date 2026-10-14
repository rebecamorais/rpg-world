'use client';

import React from 'react';

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
import { Input } from '@frontend/components/ui/input';
import { Label } from '@frontend/components/ui/label';
import { SectionCard } from '@frontend/components/ui/section-card';

import type { AttributeKey } from '@shared/systems/dnd5e';
import { ATTRIBUTE_KEYS } from '@shared/systems/dnd5e/constants';

import AttributeCard from './AttributeCard';

interface Props {
  attributes: Record<AttributeKey, number>;
  onAttributeChange: (key: AttributeKey, value: number) => void;
}

function AttributesSection({ attributes, onAttributeChange }: Props) {
  const t = useTranslations('attributes');
  const [isOpen, setIsOpen] = React.useState(false);
  const [tempValues, setTempValues] = React.useState<Record<AttributeKey, number>>(attributes);

  const handleSave = () => {
    Object.entries(tempValues).forEach(([key, value]) => {
      onAttributeChange(key as AttributeKey, value);
    });
    setIsOpen(false);
  };

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
      onChange={(value) => onAttributeChange(key, value)}
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
                    <Input
                      id={key}
                      type="number"
                      value={tempValues[key] ?? 10}
                      onChange={(e) =>
                        setTempValues((prev) => ({
                          ...prev,
                          [key]: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="h-10 font-mono text-lg font-bold"
                    />
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  {t('cancel')}
                </Button>
                <Button onClick={handleSave}>{t('save')}</Button>
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

export default React.memo(AttributesSection);
