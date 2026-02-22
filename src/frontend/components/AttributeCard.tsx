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
    <div className="group relative flex w-24 flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-zinc-700 bg-[#1a1a1a] p-3 shadow-sm">
      <div className="bg-primary/50 group-hover:bg-primary absolute top-0 h-1 w-full transition-colors" />
      <span className="mb-1 text-[10px] font-bold tracking-wider text-zinc-400 uppercase">
        {label}
      </span>

      {/* Modificador principal */}
      <span className="mb-2 font-mono text-3xl font-bold text-zinc-100">
        {modifier >= 0 ? `+${modifier}` : modifier}
      </span>

      {/* Valor Editável (Pequeno, na base oval) */}
      <div className="z-10 mt-[-10px] flex w-14 items-center justify-center rounded-full border border-zinc-700 bg-[#121212] px-2">
        <input
          type="number"
          min={MIN_ATTR}
          max={MAX_ATTR}
          value={clamped}
          onChange={handleChange}
          className="focus:ring-primary w-full rounded-full bg-transparent py-0.5 text-center text-sm font-bold text-zinc-300 outline-none focus:ring-2"
        />
      </div>
    </div>
  );
}
