'use client';

import * as React from 'react';

import { useTranslations } from 'next-intl';

import { GhostInput } from '@frontend/components/ui/ghost-input';
import { Input } from '@frontend/components/ui/input';
import { useReportFieldValidity } from '@frontend/context/FieldValidityContext';
import { cn } from '@frontend/lib/utils';

type NumberError = 'notANumber' | 'integer' | 'range' | 'min' | 'max';

interface NumberInputProps extends Omit<
  React.ComponentProps<typeof Input>,
  'value' | 'onChange' | 'type' | 'min' | 'max'
> {
  value: number;
  /** Called with every valid number typed; invalid text never reaches it. */
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  /** Accepts decimals ("7.5" or "7,5"); whole numbers only otherwise. */
  decimal?: boolean;
  /** Renders a GhostInput (inline sheet field) instead of a boxed Input. */
  ghost?: boolean;
  /** For GhostInput: whether to show its pencil icon. */
  showIcon?: boolean;
  /** Told whether the text is a valid number, so a dialog can hold its Save button. */
  onValidityChange?: (valid: boolean) => void;
  containerClassName?: string;
}

const NUMBER = /^-?\d+([.,]\d+)?$/;

/** The number in `text`, or why it isn't one this field accepts. */
function parse(
  text: string,
  { min, max, decimal }: Pick<NumberInputProps, 'min' | 'max' | 'decimal'>,
): { value: number; error?: undefined } | { value?: undefined; error: NumberError } {
  const trimmed = text.trim();
  if (!NUMBER.test(trimmed)) return { error: 'notANumber' };

  const value = Number(trimmed.replace(',', '.'));
  if (!decimal && !Number.isInteger(value)) return { error: 'integer' };

  const below = min !== undefined && value < min;
  const above = max !== undefined && value > max;
  if (below || above) {
    return { error: min !== undefined && max !== undefined ? 'range' : below ? 'min' : 'max' };
  }
  return { value };
}

/**
 * Number field that lets the text be anything while typing: clearing it doesn't snap back to 0
 * (or to a default), and out-of-range values aren't clamped. Valid numbers go to
 * `onValueChange` right away; an invalid text keeps the last valid value and shows why once
 * the field loses focus.
 */
function NumberInput({
  value,
  onValueChange,
  min,
  max,
  decimal = false,
  ghost = false,
  showIcon,
  onValidityChange,
  containerClassName,
  className,
  onFocus,
  onBlur,
  ...props
}: NumberInputProps) {
  const t = useTranslations('common.numberField');
  const messageId = React.useId();
  // `text` is what the user typed; `base` is the value it stood for. While `value` still
  // equals `base` the text stays; a change from outside (a +/- button, a refetch) replaces it.
  const [edit, setEdit] = React.useState<{ text: string; base: number } | null>(null);
  const [showError, setShowError] = React.useState(false);

  const editing = edit !== null && edit.base === value;
  const text = editing ? edit.text : String(value);
  const result = parse(text, { min, max, decimal });
  const error = editing && showError ? result.error : undefined;
  // The form's save waits while the text isn't valid, even before the error shows
  useReportFieldValidity(editing && result.error !== undefined);

  const Field = ghost ? GhostInput : Input;
  const ghostProps = ghost ? { showIcon } : {};

  return (
    <div className={cn('relative', containerClassName)}>
      <Field
        type="text"
        inputMode={decimal ? 'decimal' : 'numeric'}
        value={text}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? messageId : undefined}
        onFocus={onFocus}
        onChange={(e) => {
          const next = parse(e.target.value, { min, max, decimal });
          setEdit({ text: e.target.value, base: next.value ?? value });
          onValidityChange?.(next.value !== undefined);
          if (next.value !== undefined && next.value !== value) onValueChange(next.value);
        }}
        onBlur={(e) => {
          if (result.value !== undefined) {
            setEdit(null);
            setShowError(false);
          } else {
            setShowError(true);
          }
          onBlur?.(e);
        }}
        className={cn(
          className,
          // After `className`, so it wins over the field's own border (GhostInput has none)
          error && 'text-danger-flare border-danger rounded-md border border-solid',
          error && ghost && 'px-1',
        )}
        {...ghostProps}
        {...props}
      />
      {error && (
        <p
          id={messageId}
          className="text-danger-flare absolute top-full left-0 z-10 mt-0.5 font-sans text-xs font-medium whitespace-nowrap normal-case"
        >
          {t(error, { min: min ?? 0, max: max ?? 0 })}
        </p>
      )}
    </div>
  );
}

export { NumberInput };
