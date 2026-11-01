'use client';

import { useRef, useState } from 'react';

import { FieldLabel } from '@frontend/components/ui/field';
import { GhostInput } from '@frontend/components/ui/ghost-input';
import { AppIcon } from '@frontend/components/ui/icon';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@frontend/components/ui/select';

// Can't clash with an id: ids have no underscores
const OTHER = '__other__';

export interface ChoiceOption {
  value: string;
  label: string;
  /** Game icon name (game-icons.net). */
  icon?: string;
}

/**
 * A sheet field picked from the system's list (saved as its id), or the player's own, typed after
 * "Other…": class, race, background, alignment. `matched` is the listed option the saved text
 * stands for, if any (an id, or free text from before the list, like "Mago").
 */
export function ChoiceSelect({
  id,
  label,
  value,
  matched,
  options,
  placeholder,
  otherLabel,
  otherPlaceholder,
  maxLength,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  matched: string | null;
  options: ChoiceOption[];
  placeholder: string;
  otherLabel: string;
  otherPlaceholder: string;
  maxLength: number;
  onChange: (value: string) => void;
}) {
  // "Other…" stays picked while its field is still empty
  const [choseOther, setChoseOther] = useState(false);
  const isOther = choseOther || (value !== '' && !matched);
  const input = useRef<HTMLInputElement>(null);
  // Set on picking "Other…": when the list closes, focus goes to the name field, not back to it
  const focusOwnName = useRef(false);

  return (
    <div className="flex flex-col gap-1">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select
        value={isOther ? OTHER : (matched ?? '')}
        onValueChange={(next) => {
          if (next === OTHER) {
            setChoseOther(true);
            // A listed name is no one's own: start the field empty
            if (matched) onChange('');
            focusOwnName.current = true;
          } else {
            setChoseOther(false);
            onChange(next);
          }
        }}
      >
        <SelectTrigger
          id={id}
          className="bg-muted/40 hover:bg-muted h-10 border-none px-3 font-medium"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent
          onCloseAutoFocus={(event) => {
            if (!focusOwnName.current) return;
            focusOwnName.current = false;
            event.preventDefault();
            input.current?.focus();
          }}
        >
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <span className="flex items-center gap-2">
                {option.icon && (
                  <AppIcon
                    name={option.icon}
                    variant="game"
                    size={16}
                    className="text-character-flare shrink-0"
                  />
                )}
                {option.label}
              </span>
            </SelectItem>
          ))}
          <SelectSeparator />
          <SelectItem value={OTHER}>
            <span className="flex items-center gap-2">
              <AppIcon name="Pencil" size={16} className="text-muted-foreground shrink-0" />
              {otherLabel}
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
      {isOther && (
        <GhostInput
          ref={input}
          aria-label={otherPlaceholder}
          value={value}
          maxLength={maxLength}
          placeholder={otherPlaceholder}
          onChange={(event) => onChange(event.target.value)}
          className="bg-muted/40 hover:bg-muted focus-visible:bg-background h-10 px-3 font-medium"
        />
      )}
    </div>
  );
}
