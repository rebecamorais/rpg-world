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
    <div className="flex flex-col items-center justify-center p-3 border-2 border-zinc-700 bg-[#1a1a1a] rounded-lg shadow-sm w-24 relative overflow-hidden group">
      <div className="absolute top-0 w-full h-1 bg-[#663399]/50 group-hover:bg-[#663399] transition-colors" />
      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">{label}</span>

      {/* Modificador principal */}
      <span className="text-3xl font-bold font-mono text-zinc-100 mb-2">
        {modifier >= 0 ? `+${modifier}` : modifier}
      </span>

      {/* Valor Editável (Pequeno, na base oval) */}
      <div className="bg-[#121212] border border-zinc-700 rounded-full px-2 w-14 flex items-center justify-center mt-[-10px] z-10">
        <input
          type="number"
          min={MIN_ATTR}
          max={MAX_ATTR}
          value={clamped}
          onChange={handleChange}
          className="w-full text-center text-sm font-bold bg-transparent text-zinc-300 outline-none focus:ring-2 focus:ring-[#663399] rounded-full py-0.5"
        />
      </div>
    </div>
  );
}
