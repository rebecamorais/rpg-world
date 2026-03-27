'use client';

import React from 'react';

import { Settings2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@frontend/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@frontend/components/ui/dialog';
import { Input } from '@frontend/components/ui/input';
import { Label } from '@frontend/components/ui/label';

import type { AttributeKey } from '@shared/systems/dnd5e';
import { ATTRIBUTE_KEYS } from '@shared/systems/dnd5e/constants';

import AttributeCard from './AttributeCard';

interface Props {
  attributes: Record<AttributeKey, number>;
  onAttributeChange: (key: AttributeKey, value: number) => void;
}

export default function AttributesSection({ attributes, onAttributeChange }: Props) {
  const t = useTranslations('attributes');
  const [isOpen, setIsOpen] = React.useState(false);
  const [tempValues, setTempValues] = React.useState<Record<AttributeKey, number>>(attributes);

  // Sync temp values when attributes change
  React.useEffect(() => {
    setTempValues(attributes);
  }, [attributes]);

  const handleSave = () => {
    Object.entries(tempValues).forEach(([key, value]) => {
      onAttributeChange(key as AttributeKey, value);
    });
    setIsOpen(false);
  };

  const half = Math.ceil(ATTRIBUTE_KEYS.length / 2);
  const firstCol = ATTRIBUTE_KEYS.slice(0, half);
  const secondCol = ATTRIBUTE_KEYS.slice(half);

  const renderAttribute = (key: AttributeKey) => (
    <AttributeCard
      key={key}
      label={t(`abbreviations.${key}`)}
      value={attributes[key] ?? 10}
      onChange={(value) => onAttributeChange(key, value)}
    />
  );

  return (
    <Card className="border-border bg-card h-full">
      <CardHeader className="border-border bg-muted/50 flex flex-row items-center justify-between border-b px-4 py-3">
        <CardTitle className="text-muted-foreground text-sm tracking-wider uppercase">
          {t('title')}
        </CardTitle>

        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-60 hover:opacity-100">
              <Settings2 className="h-4.4 w-4.4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t('bulkEditTitle') || 'Editar Atributos'}</DialogTitle>
              <DialogDescription className="sr-only">
                {t('bulkEditDescription') || 'Alterar valores de todos os atributos'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              {ATTRIBUTE_KEYS.map((key) => (
                <div key={key} className="flex flex-col gap-2">
                  <Label htmlFor={key} className="font-bold tracking-wider uppercase">
                    {t(key)}
                  </Label>
                  <Input
                    id={key}
                    type="number"
                    value={tempValues[key]}
                    onChange={(e) =>
                      setTempValues((prev) => ({
                        ...prev,
                        [key]: parseInt(e.target.value) || 0,
                      }))
                    }
                    className="h-10 text-lg font-bold"
                  />
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                {t('cancel') || 'Cancelar'}
              </Button>
              <Button onClick={handleSave}>{t('save') || 'Salvar'}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 p-4">
        <div className="flex flex-col items-center gap-4">{firstCol.map(renderAttribute)}</div>
        <div className="flex flex-col items-center gap-4">{secondCol.map(renderAttribute)}</div>
      </CardContent>
    </Card>
  );
}
