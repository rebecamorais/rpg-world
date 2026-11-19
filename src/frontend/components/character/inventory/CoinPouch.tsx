'use client';

import { useState } from 'react';

import { useFormatter, useTranslations } from 'next-intl';

import { Button } from '@frontend/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@frontend/components/ui/dialog';
import { Label } from '@frontend/components/ui/label';
import { NumberInput } from '@frontend/components/ui/number-input';
import { SectionCard } from '@frontend/components/ui/section-card';
import { SelectField } from '@frontend/components/ui/select-field';
import { Skeleton } from '@frontend/components/ui/skeleton';
import { useLoadedCharacter } from '@frontend/context/CharacterContext';
import { useWriteGuard } from '@frontend/demo/DemoContext';
import { type InventoryApi, useInventory } from '@frontend/hooks/useInventory';
import { characterTheme } from '@frontend/lib/color-utils';

import {
  COINS,
  type Coin,
  type Coins,
  EMPTY_PURSE,
  fromCopper,
  pay,
  receive,
} from '@shared/systems/dnd5e';

import { CoinIcon } from './CoinIcon';

const MAX_COINS = 1_000_000_000;

type Mode = 'pay' | 'receive';

/**
 * The dialog's lines that name where the coins are. A character's are in the pouch; the party
 * chest passes its own, or its dialog would talk about a pouch it doesn't have.
 */
export interface CoinDialogText {
  receiveDescription: string;
  after: string;
  tooMany: (max: string) => string;
}

/** "45 PO + 1 PL", skipping the coins at zero. */
function useFormatCoins() {
  const t = useTranslations('characters.coins');
  const formatter = useFormatter();
  return (coins: Coins, separator = ' + ') =>
    COINS.filter((coin) => coins[coin] > 0)
      .map((coin) => `${formatter.number(coins[coin])} ${t(`${coin}.short`)}`)
      .join(separator) || t('none');
}

/** Pays (with change) or receives an amount; the result is saved to the pouch right away. */
function CoinDialog({
  mode,
  inventory,
  text,
  style,
  onDone,
}: {
  mode: Mode;
  inventory: InventoryApi;
  text?: CoinDialogText;
  style?: React.CSSProperties;
  onDone: () => void;
}) {
  const t = useTranslations('characters.coins');
  const { pouch, setCoins } = inventory;
  const format = useFormatCoins();
  const formatter = useFormatter();
  const [amount, setAmount] = useState(1);
  const [coin, setCoin] = useState<Coin>('gp');
  const [valid, setValid] = useState(true);

  const purse = pouch?.coins ?? EMPTY_PURSE;
  const payment = mode === 'pay' ? pay(purse, amount, coin) : null;
  const after = payment ? (payment.ok ? payment.after : null) : receive(purse, amount, coin);
  // The database keeps at most MAX_COINS of each coin (received coins, or the change of a payment)
  const overflow = after !== null && COINS.some((c) => after[c] > MAX_COINS);
  const canConfirm = valid && after !== null && !overflow && !!pouch;

  const confirm = () => {
    if (!after) return;
    setCoins(after);
    onDone();
  };

  return (
    <DialogContent className="character-context sm:max-w-[420px]" style={style}>
      <DialogHeader>
        <DialogTitle>{t(mode)}</DialogTitle>
        <DialogDescription>
          {mode === 'receive' && text ? text.receiveDescription : t(`${mode}Description`)}
        </DialogDescription>
      </DialogHeader>

      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (canConfirm) confirm();
        }}
      >
        <div className="flex items-end gap-2">
          <div className="flex-1 space-y-2">
            <Label htmlFor="coin-amount">{t('amount')}</Label>
            <NumberInput
              id="coin-amount"
              autoFocus
              value={amount}
              min={1}
              max={MAX_COINS}
              onValueChange={setAmount}
              onValidityChange={setValid}
            />
          </div>
          <SelectField
            aria-label={t('coin')}
            value={coin}
            onValueChange={(value) => setCoin(value as Coin)}
            options={COINS.map((c) => ({ value: c, label: t(`${c}.short`) }))}
            className="w-24"
          />
        </div>

        {payment && !payment.ok ? (
          <p role="alert" className="text-danger-flare text-sm">
            {t('missing', { amount: format(fromCopper(payment.missing)) })}
          </p>
        ) : overflow ? (
          <p role="alert" className="text-danger-flare text-sm">
            {text
              ? text.tooMany(formatter.number(MAX_COINS))
              : t('tooMany', { max: formatter.number(MAX_COINS) })}
          </p>
        ) : (
          <dl className="text-sm" aria-live="polite">
            {payment?.ok && (
              <>
                <div className="border-border flex justify-between gap-4 border-b border-dashed py-1.5">
                  <dt className="text-muted-foreground">{t('spent')}</dt>
                  <dd>{format(payment.spent)}</dd>
                </div>
                <div className="border-border flex justify-between gap-4 border-b border-dashed py-1.5">
                  <dt className="text-muted-foreground">{t('change')}</dt>
                  <dd>{format(payment.change)}</dd>
                </div>
              </>
            )}
            {after && (
              <div className="flex justify-between gap-4 py-1.5">
                <dt className="text-muted-foreground">{text?.after ?? t('after')}</dt>
                <dd className="text-right">{format(after, ' · ')}</dd>
              </div>
            )}
          </dl>
        )}

        <DialogFooter>
          <Button type="submit" variant="character" disabled={!canConfirm}>
            {t('confirm')}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

/** The coin pouch every character carries. */
export function CoinPouch() {
  const t = useTranslations('characters.coins');
  const character = useLoadedCharacter();
  const inventory = useInventory(character.id);

  return (
    <CoinPurse
      inventory={inventory}
      title={t('title')}
      hint={t('hint')}
      dialogStyle={characterTheme(character.accentColor).style}
    />
  );
}

/**
 * The five coins of a pouch (a character's, or the party chest), editable by hand, and Pay /
 * Receive. Saved on the spot (not through the sheet's save bar). A hand edit is sent when the
 * field loses focus, so typing "120" is one request, not three.
 *
 * The typed number is the final value, not a difference: it goes with the value the field showed
 * when typing began, and if someone changed that coin meanwhile the server refuses it and a toast
 * says what it is now (on a shared chest, adding to an old screen would give a number nobody
 * typed). Pay and Receive still add up.
 */
export function CoinPurse({
  inventory,
  title,
  hint,
  dialogText,
  dialogStyle,
}: {
  inventory: InventoryApi;
  title: string;
  hint: string;
  /** Left out for a character's pouch, whose lines are the default. */
  dialogText?: CoinDialogText;
  dialogStyle?: React.CSSProperties;
}) {
  const t = useTranslations('characters.coins');
  const tCommon = useTranslations('common');
  const { pouch, isLoading, setCoinTo } = inventory;
  const [mode, setMode] = useState<Mode | null>(null);
  // The demo refuses Pay and Receive at once, not after the whole form was filled in
  const openDialog = useWriteGuard()((next: Mode) => setMode(next));
  // What was typed in each field and not yet sent, and what the field showed before it
  const [typed, setTyped] = useState<Partial<Record<Coin, { value: number; seen: number }>>>({});

  const purse = pouch?.coins ?? EMPTY_PURSE;

  const type = (coin: Coin, value: number) =>
    setTyped((all) => ({ ...all, [coin]: { value, seen: all[coin]?.seen ?? purse[coin] } }));

  const commit = (coin: Coin) => {
    const edit = typed[coin];
    setTyped(({ [coin]: _sent, ...rest }) => rest);
    if (edit) setCoinTo(coin, edit.value, edit.seen);
  };

  return (
    <SectionCard>
      <SectionCard.Header>
        <SectionCard.Title icon="coins" iconVariant="game" hint={hint}>
          {title}
        </SectionCard.Title>
      </SectionCard.Header>
      <SectionCard.Body className="flex flex-col gap-4" aria-busy={isLoading}>
        {isLoading && (
          <span role="status" className="sr-only">
            {tCommon('loading')}
          </span>
        )}
        <ul className="grid grid-cols-5 gap-2">
          {COINS.map((coin) => (
            <li
              key={coin}
              className="group border-border bg-background/60 flex flex-col items-center gap-1 rounded-lg border px-1 py-2"
            >
              <CoinIcon coin={coin} />
              {/* Not 0 while loading: the purse isn't known to be empty yet */}
              {isLoading ? (
                <Skeleton aria-hidden="true" className="my-0.5 h-6 w-3/4" />
              ) : (
                <NumberInput
                  ghost
                  showIcon={false}
                  aria-label={t(`${coin}.name`)}
                  value={typed[coin]?.value ?? purse[coin]}
                  min={0}
                  max={MAX_COINS}
                  onValueChange={(value) => type(coin, value)}
                  onBlur={() => commit(coin)}
                  onKeyDown={(e) => e.key === 'Enter' && commit(coin)}
                  containerClassName="w-full"
                  className="h-auto w-full p-0 text-center font-mono text-lg font-bold tabular-nums md:text-lg"
                />
              )}
              <abbr
                title={t(`${coin}.name`)}
                className="text-label text-muted-foreground no-underline"
              >
                {t(`${coin}.short`)}
              </abbr>
            </li>
          ))}
        </ul>

        {/* data-sheet-edit: the read-only sheet (the GM reading it) hides Pay and Receive */}
        <div data-sheet-edit className="flex gap-2">
          <Button variant="outline" size="sm" disabled={!pouch} onClick={() => openDialog('pay')}>
            {t('pay')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!pouch}
            onClick={() => openDialog('receive')}
          >
            {t('receive')}
          </Button>
        </div>
      </SectionCard.Body>

      <Dialog open={mode !== null} onOpenChange={(open) => !open && setMode(null)}>
        {mode && (
          <CoinDialog
            key={mode}
            mode={mode}
            inventory={inventory}
            text={dialogText}
            style={dialogStyle}
            onDone={() => setMode(null)}
          />
        )}
      </Dialog>
    </SectionCard>
  );
}
