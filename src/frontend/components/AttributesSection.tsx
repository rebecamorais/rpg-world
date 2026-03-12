'use client';

import { useTranslations } from 'next-intl';

import { Card, CardContent, CardHeader, CardTitle } from '@frontend/components/ui/card';

import type { AttributeKey } from '@shared/systems/dnd5e';
import { ATTRIBUTE_KEYS } from '@shared/systems/dnd5e/constants';

import AttributeCard from './AttributeCard';

interface Props {
  attributes: Record<AttributeKey, number>;
  onAttributeChange: (key: AttributeKey, value: number) => void;
}

export default function AttributesSection({ attributes, onAttributeChange }: Props) {
  const t = useTranslations('attributes');

  const half = Math.ceil(ATTRIBUTE_KEYS.length / 2);
  const firstCol = ATTRIBUTE_KEYS.slice(0, half);
  const secondCol = ATTRIBUTE_KEYS.slice(half);

  const renderAttribute = (key: AttributeKey) => (
    <AttributeCard
      key={key}
      label={t(key)}
      value={attributes[key] ?? 10}
      onChange={(value) => onAttributeChange(key, value)}
    />
  );

  return (
    <Card className="border-border bg-card h-full">
      <CardHeader className="border-border bg-muted/50 border-b px-4 py-3">
        <CardTitle className="text-muted-foreground text-sm tracking-wider uppercase">
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4 p-4">
        <div className="flex flex-col items-center gap-4">{firstCol.map(renderAttribute)}</div>
        <div className="flex flex-col items-center gap-4">{secondCol.map(renderAttribute)}</div>
      </CardContent>
    </Card>
  );
}
