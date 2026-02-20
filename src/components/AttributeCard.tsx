'use client';

import { getModifier } from '@/systems/dnd5e/calculations';

const MIN_ATTR = 1;
const MAX_ATTR = 30;

interface Props {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

export default function AttributeCard({ label, value, onChange }: Props) {
  const clamped = Math.min(MAX_ATTR, Math.max(MIN_ATTR, value));
  const modifier = getModifier(clamped);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value === '' ? MIN_ATTR : Number(e.target.value);
    const next = Math.min(MAX_ATTR, Math.max(MIN_ATTR, Math.floor(raw)));
    onChange(next);
  };

  return (
    <div className="flex flex-col items-center p-4 border rounded-lg bg-slate-900 text-white w-32">
      <span className="text-xs font-bold uppercase">{label}</span>
      <input
        type="number"
        min={MIN_ATTR}
        max={MAX_ATTR}
        value={clamped}
        onChange={handleChange}
        className="w-full text-center text-3xl font-bold bg-transparent border-b border-slate-700 outline-none"
      />
      <span className="text-xl mt-2 font-mono">
        {modifier >= 0 ? `+${modifier}` : modifier}
      </span>
    </div>
  );
}
