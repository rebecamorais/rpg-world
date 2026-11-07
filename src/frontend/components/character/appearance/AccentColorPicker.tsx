'use client';

import { useId, useState } from 'react';

import { useTranslations } from 'next-intl';

import { Input } from '@frontend/components/ui/input';
import { ACCENT_COLORS, DEFAULT_ACCENT_HEX } from '@frontend/constants/accent-colors';
import { useCharacterActions, useLoadedCharacter } from '@frontend/context/CharacterContext';
import { safeAccentColor, sixDigitHex } from '@frontend/lib/color-utils';
import { cn } from '@frontend/lib/utils';

/** The system's colors first, then any color, by the browser's picker or by its code. */
export function AccentColorPicker() {
  const t = useTranslations('characterAppearance');
  const tColors = useTranslations('profileForm.colors');
  const { accentColor } = useLoadedCharacter();
  const { update } = useCharacterActions();
  const codeId = useId();
  const errorId = useId();
  // What's being typed, which can be invalid halfway; otherwise the field follows the saved color
  const [typing, setTyping] = useState<string | null>(null);

  const code = typing ?? accentColor ?? '';
  const isInvalid = Boolean(typing) && !safeAccentColor(withHash(code));

  const onCodeChange = (value: string) => {
    setTyping(value);
    const color = safeAccentColor(withHash(value));
    if (color) update({ accentColor: color.toLowerCase() });
  };

  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-3">
        <legend className="text-label text-muted-foreground mb-3">{t('systemColors')}</legend>
        <div className="flex flex-wrap gap-2">
          {ACCENT_COLORS.map((color) => {
            const isSelected = color.value === (accentColor ?? '');

            return (
              <button
                key={color.name}
                type="button"
                onClick={() => {
                  setTyping(null);
                  update({ accentColor: color.value });
                }}
                title={tColors(color.name)}
                aria-label={tColors(color.name)}
                aria-pressed={isSelected}
                className={cn(
                  'focus-ring flex h-10 w-10 items-center justify-center rounded-full border-2 transition-transform hover:scale-110',
                  isSelected ? 'border-foreground' : 'border-transparent',
                )}
              >
                <span
                  className="h-7 w-7 rounded-full"
                  style={{ backgroundColor: color.value || 'var(--brand)' }}
                />
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="border-border flex flex-wrap items-center gap-3 border-t pt-4">
        <label className="text-body flex items-center gap-3">
          <input
            type="color"
            value={sixDigitHex(accentColor) ?? DEFAULT_ACCENT_HEX}
            onChange={(e) => {
              setTyping(null);
              update({ accentColor: e.target.value });
            }}
            className="focus-ring border-border h-10 w-12 cursor-pointer rounded-md border bg-transparent p-1"
          />
          {t('anyColor')}
        </label>
        <div className="flex items-center gap-2">
          <label htmlFor={codeId} className="text-label text-muted-foreground">
            {t('colorCode')}
          </label>
          <Input
            id={codeId}
            value={code}
            onChange={(e) => onCodeChange(e.target.value)}
            onBlur={() => !isInvalid && setTyping(null)}
            spellCheck={false}
            maxLength={7}
            placeholder={DEFAULT_ACCENT_HEX}
            aria-invalid={isInvalid}
            aria-describedby={isInvalid ? errorId : undefined}
            className="h-10 w-28 font-mono"
          />
        </div>
        {isInvalid && (
          <p id={errorId} role="alert" className="text-caption text-danger-flare w-full">
            {t('colorCodeInvalid')}
          </p>
        )}
      </div>
    </div>
  );
}

function withHash(value: string): string {
  return value.startsWith('#') ? value : `#${value}`;
}
