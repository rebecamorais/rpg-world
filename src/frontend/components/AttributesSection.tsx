'use client';

import type { AttributeKey } from '@shared/systems/dnd5e';
import {
  ATTRIBUTE_KEYS,
  ATTRIBUTE_LABELS,
} from '@shared/systems/dnd5e/constants';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/frontend/components/ui/card';

import AttributeCard from './AttributeCard';

interface Props {
  attributes: Record<AttributeKey, number>;
  onAttributeChange: (key: AttributeKey, value: number) => void;
}

export default function AttributesSection({
  attributes,
  onAttributeChange,
}: Props) {
  return (
    <Card className="border-border bg-card h-full">
      <CardHeader className="border-border bg-muted/50 border-b px-4 py-3">
        <CardTitle className="text-muted-foreground text-sm tracking-wider uppercase">
          Atributos
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap justify-center gap-4 p-4">
        {ATTRIBUTE_KEYS.map((key) => (
          <AttributeCard
            key={key}
            label={ATTRIBUTE_LABELS[key]}
            value={attributes[key] ?? 10}
            onChange={(value) => onAttributeChange(key, value)}
          />
        ))}
      </CardContent>
    </Card>
  );
}
