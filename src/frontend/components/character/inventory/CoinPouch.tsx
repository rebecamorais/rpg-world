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
import { useLoadedCharacter } from '@frontend/context/CharacterContext';
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

/** "45 PO + 1 PL", skipping the coins at zero. */
function useFormatCoins() {
  const t = useTranslations('characters.coins');
  return (coins: Coins, separator = ' + ') =>
    COINS.filter((coin) => coins[coin] > 0)
      .map((coin) => `${coins[coin]} ${t(`${coin}.short`)}`)
      .join(separator) || t('none');
}

/** Pays (with change) or receives an amount; the result is saved to the pouch right away. */
function CoinDialog({
  mode,
  inventory,
  style,
  onDone,
}: {
  mode: Mode;
  inventory: InventoryApi;
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
        <DialogDescription>{t(`${mode}Description`)}</DialogDescription>
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
            {t('tooMany', { max: formatter.number(MAX_COINS) })}
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
                <dt className="text-muted-foreground">{t('after')}</dt>
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
 */
export function CoinPurse({
  inventory,
  title,
  hint,
  dialogStyle,
}: {
  inventory: InventoryApi;
  title: string;
  hint: string;
  dialogStyle?: React.CSSProperties;
}) {
  const t = useTranslations('characters.coins');
  const { pouch, setCoins } = inventory;
  const [mode, setMode] = useState<Mode | null>(null);
  // What was typed in each field and not yet sent
  const [typed, setTyped] = useState<Partial<Coins>>({});

  const purse = pouch?.coins ?? EMPTY_PURSE;

  const commit = (coin: Coin) => {
    const value = typed[coin];
    setTyped(({ [coin]: _sent, ...rest }) => rest);
    if (value !== undefined && value !== purse[coin]) setCoins({ ...purse, [coin]: value });
  };

  return (
    <SectionCard>
      <SectionCard.Header>
        <SectionCard.Title icon="coins" iconVariant="game" hint={hint}>
          {title}
        </SectionCard.Title>
      </SectionCard.Header>
      <SectionCard.Body className="flex flex-col gap-4">
        <ul className="grid grid-cols-5 gap-2">
          {COINS.map((coin) => (
            <li
              key={coin}
              className="group border-border bg-background/60 flex flex-col items-center gap-1 rounded-lg border px-1 py-2"
            >
              <CoinIcon coin={coin} />
              <NumberInput
                ghost
                showIcon={false}
                aria-label={t(`${coin}.name`)}
                value={typed[coin] ?? purse[coin]}
                min={0}
                max={MAX_COINS}
                onValueChange={(value) => setTyped((t) => ({ ...t, [coin]: value }))}
                onBlur={() => commit(coin)}
                onKeyDown={(e) => e.key === 'Enter' && commit(coin)}
                containerClassName="w-full"
                className="h-auto w-full p-0 text-center font-mono text-lg font-bold tabular-nums md:text-lg"
              />
              <abbr
                title={t(`${coin}.name`)}
                className="text-label text-muted-foreground no-underline"
              >
                {t(`${coin}.short`)}
              </abbr>
            </li>
          ))}
        </ul>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={!pouch} onClick={() => setMode('pay')}>
            {t('pay')}
          </Button>
          <Button variant="outline" size="sm" disabled={!pouch} onClick={() => setMode('receive')}>
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
            style={dialogStyle}
            onDone={() => setMode(null)}
          />
        )}
      </Dialog>
    </SectionCard>
  );
}
