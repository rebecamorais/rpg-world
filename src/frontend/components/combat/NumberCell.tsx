'use client';

import { Input } from '@frontend/components/ui/input';

/** A number field saved when it loses focus; empty means "none" where `nullable`. */
export function NumberCell({
  label,
  value,
  min,
  max,
  nullable = false,
  placeholder,
  onCommit,
}: {
  label: string;
  value: number | null;
  min: number;
  max: number;
  nullable?: boolean;
  placeholder?: string;
  onCommit: (value: number | null) => void;
}) {
  return (
    <Input
      // A new value from the server (another device, a clamp) resets the field
      key={value ?? ''}
      type="number"
      inputMode="numeric"
      aria-label={label}
      min={min}
      max={max}
      defaultValue={value ?? ''}
      placeholder={placeholder}
      onBlur={(event) => {
        const text = event.currentTarget.value.trim();
        const next = text === '' ? null : Math.round(Number(text));
        if (next === value || (next === null && !nullable) || Number.isNaN(next)) return;
        onCommit(next === null ? null : Math.min(max, Math.max(min, next)));
      }}
      // 44px tall where it's tapped, like the buttons' touch area
      className="h-9 w-16 px-2 text-center font-mono tabular-nums pointer-coarse:h-11"
    />
  );
}
