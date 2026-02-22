'use client';

import type { AttributeKey } from '@/systems/dnd5e';
import { ATTRIBUTE_KEYS, ATTRIBUTE_LABELS } from '@/systems/dnd5e/constants';

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
    <div>
      <h3 className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
        Atributos
      </h3>
      <div className="flex flex-wrap gap-4">
        {ATTRIBUTE_KEYS.map((key) => (
          <AttributeCard
            key={key}
            label={ATTRIBUTE_LABELS[key]}
            value={attributes[key] ?? 10}
            onChange={(value) => onAttributeChange(key, value)}
          />
        ))}
      </div>
    </div>
  );
}
