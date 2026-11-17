'use client';

/*
 * Internal lab for the Grimoire library (/dev/grimoire): open-card effects. Not product UI:
 * its text is in Portuguese and stays out of next-intl on purpose (it lives outside the folders
 * the hardcoded-text guard reads).
 */
import { type CSSProperties, type ReactNode, useCallback, useState } from 'react';

import { SpellCard } from '@frontend/components/character/spells/spell-card/SpellCard';
import { schoolEmblemOf } from '@frontend/components/character/spells/spell-card/spell-grimoire';
import { cardBorder } from '@frontend/components/grimoire/card-border/CardBorder';
import {
  BORDER_HOVERS,
  BORDER_OPENINGS,
  type BorderHover,
  type BorderOpening,
  type CardBorder,
} from '@frontend/components/grimoire/card-border/types';
import { EffectLayers, cardEffect } from '@frontend/components/grimoire/card-effect/CardEffect';
import { EffectEmblem } from '@frontend/components/grimoire/card-effect/EffectArt';
import { ART, type ArtName } from '@frontend/components/grimoire/card-effect/art';
import {
  type CardEffect,
  EFFECT_IDS,
  type EffectId,
} from '@frontend/components/grimoire/card-effect/types';
import { DAMAGE_THEMES, SCHOOL_THEMES } from '@frontend/constants/damage-themes';
import {
  SPELL_CARD_BORDER,
  spellEffectOf,
  spellEmblemOf,
} from '@frontend/constants/grimoire-effects';
import type { Spell } from '@frontend/types/spells';

import type { LabParams } from './lab-params';

// Built once: stable objects keep SpellCard's memo working
// One element per emblem, built once: the same object keeps SpellCard's memo working
const EMBLEMS = Object.fromEntries(
  (Object.keys(ART) as ArtName[]).map((name) => [name, <EffectEmblem key={name} name={name} />]),
) as Record<ArtName, ReactNode>;

// The owner's emblem images, one per school (public/grimoire/emblems, 96px WebP, fixed colours)
const SCHOOL_IMAGES = Object.fromEntries(
  Object.keys(SCHOOL_THEMES).map((school) => [
    school,
    // A plain img: a tiny static file, decoded once and shared by every card of the school
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={school}
      src={`/grimoire/emblems/${school}.webp`}
      alt=""
      width={36}
      height={36}
      decoding="async"
      className="size-full"
    />,
  ]),
) as Record<string, ReactNode>;

const EFFECTS = Object.fromEntries(EFFECT_IDS.map((id) => [id, cardEffect(id)])) as Record<
  EffectId,
  CardEffect
>;

// Every hover × opening pair, built once (stable objects for SpellCard's memo)
const BORDERS = new Map<string, CardBorder>(
  [null, ...BORDER_HOVERS].flatMap((hover) =>
    [null, ...BORDER_OPENINGS].map((opening) => [
      `${hover}-${opening}`,
      cardBorder(hover, opening),
    ]),
  ),
);
const HOVER_LABELS: Record<BorderHover, string> = {
  glow: 'anel de luz',
  shine: 'brilho que percorre',
  turn: 'borda que gira',
};
const OPENING_LABELS: Record<BorderOpening, string> = {
  beam: 'feixe',
  spin: 'giro de luz',
  corners: 'cantos',
};

/** The gallery: every D&D damage type and school, in its own color, with its effect */
const GALLERY = [
  ...Object.entries(DAMAGE_THEMES).map(([key, theme]) => ({
    key,
    label: `dano · ${key}`,
    hex: theme.hex,
    effect: spellEffectOf({ damageType: key }),
  })),
  ...Object.entries(SCHOOL_THEMES).map(([key, theme]) => ({
    key,
    label: `escola · ${key}`,
    hex: theme.hex,
    effect: spellEffectOf({ school: key }),
  })),
];

const href = (params: Partial<LabParams>, current: LabParams) => {
  const next = { ...current, ...params };
  const query = new URLSearchParams();
  if (next.effect) query.set('effect', next.effect);
  if (next.icons) query.set('icons', next.icons);
  if (next.hover) query.set('hover', next.hover);
  if (next.opening) query.set('opening', next.opening);
  query.set('count', String(next.count));
  if (next.expanded) query.set('expanded', '1');
  return `?${query}`;
};

export function GrimoireLab({
  spells,
  effect,
  count,
  expanded,
  icons,
  hover,
  opening,
}: LabParams & { spells: Spell[] }) {
  const current = { effect, count, expanded, icons, hover, opening };
  // Borders only when asked for: without them the card is exactly today's
  const border = hover || opening ? BORDERS.get(`${hover}-${opening}`) : undefined;
  const [replay, setReplay] = useState(0);
  const [openId, setOpenId] = useState<string | null>(expanded ? (spells[0]?.id ?? null) : null);
  const toggle = useCallback((id: string) => setOpenId((prev) => (prev === id ? null : id)), []);
  // 'auto': each spell wears what the D&D map gives it (damage type, else school), or nothing
  const iconOf = (spell: Spell) => {
    if (icons === 'webp') return SCHOOL_IMAGES[spell.school?.toLowerCase() ?? ''];
    if (icons === 'mask') return schoolEmblemOf(spell.school);
    const name = spellEmblemOf(spell);
    return name ? EMBLEMS[name] : undefined;
  };
  const effectOf = (spell: Spell) => {
    if (effect !== 'auto') return effect ? EFFECTS[effect] : undefined;
    const id = spellEffectOf(spell);
    return id ? EFFECTS[id] : undefined;
  };

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-10 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-display">Grimoire · Laboratório</h1>
        <p className="text-body text-muted-foreground max-w-prose">
          Laboratório interno da biblioteca do Grimório: os efeitos do card aberto. O spellbook usa
          a combinação escolhida (o último link da lista de cards).
        </p>
      </header>

      {/* 1. Open-card effects: each type in its own color */}
      <section className="flex flex-col gap-4" aria-labelledby="lab-effects">
        <h2 id="lab-effects" className="text-title">
          Efeitos do card aberto
        </h2>
        <p className="text-body text-muted-foreground max-w-prose">
          Um efeito por tipo de dano e, sem dano, por escola (mapa de exemplo de D&amp;D). Cada
          painel usa a cor do tipo por --grimoire-tint. A entrada roda uma vez ao abrir; toque num
          painel para ver a ondulação. Com movimento reduzido, nada se mexe.
        </p>
        <button
          type="button"
          className="text-body self-start underline"
          onClick={() => setReplay((n) => n + 1)}
        >
          Abrir de novo
        </button>
        <div className="grid gap-3 sm:grid-cols-2" key={replay}>
          {GALLERY.map(({ key, label, hex, effect: id }) => (
            <div
              key={label}
              data-grimoire-host=""
              data-lab-effect={id ?? 'none'}
              className="bg-card border-border relative min-h-32 overflow-hidden rounded-xl border p-4"
              style={{ '--grimoire-tint': hex } as CSSProperties}
            >
              {id && <EffectLayers effect={id} />}
              <div className="relative z-10 flex items-center gap-3">
                <span
                  data-grimoire-origin=""
                  className="size-10 shrink-0 rounded-lg"
                  style={{ background: `color-mix(in srgb, ${hex}, transparent 80%)` }}
                />
                <div>
                  <p className="font-display text-title">{id}</p>
                  <p className="text-label text-muted-foreground">
                    {label} <span className="sr-only">{key}</span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. The real SpellCard in a long list: what the benchmark scrolls */}
      <section className="flex flex-col gap-4" aria-labelledby="lab-cards">
        <h2 id="lab-cards" className="text-title">
          Lista de SpellCards
        </h2>
        <nav className="flex flex-wrap gap-2" aria-label="Cenários">
          <a
            className="text-body underline"
            href={href({ effect: effect ? null : 'auto' }, current)}
          >
            {effect ? 'sem efeitos' : 'efeitos: auto (por tipo de magia)'}
          </a>
          <a className="text-body underline" href={href({ icons: null }, current)}>
            ícones do jogo
          </a>
          <a className="text-body underline" href={href({ icons: 'emblem' }, current)}>
            ícones: emblemas em SVG
          </a>
          <a className="text-body underline" href={href({ icons: 'webp' }, current)}>
            ícones: emblemas em WebP
          </a>
          <a className="text-body underline" href={href({ icons: 'mask' }, current)}>
            ícones: WebP como máscara, na cor da magia
          </a>
          <a className="text-body underline" href={href({ count: 100 }, current)}>
            100 cards
          </a>
          <a className="text-body underline" href={href({ expanded: !expanded }, current)}>
            {expanded ? 'fechar o primeiro' : 'abrir o primeiro'}
          </a>
        </nav>
        <a
          className="text-body self-start underline"
          href={href({ effect: 'auto', icons: 'mask', ...SPELL_CARD_BORDER }, current)}
        >
          o card de magia escolhido: desenhos, ícones na cor da magia, anel de luz e giro de luz
        </a>
        <nav className="flex flex-wrap gap-2" aria-label="Bordas">
          <span className="text-body text-muted-foreground">Borda no hover:</span>
          {[null, ...BORDER_HOVERS].map((h) => (
            <a
              key={h ?? 'none'}
              className="text-body underline aria-[current=true]:font-semibold"
              aria-current={h === hover}
              href={href({ hover: h }, current)}
            >
              {h ? HOVER_LABELS[h] : 'nenhum'}
            </a>
          ))}
        </nav>
        <nav className="flex flex-wrap gap-2" aria-label="Abertura">
          <span className="text-body text-muted-foreground">Borda ao abrir:</span>
          {[null, ...BORDER_OPENINGS].map((o) => (
            <a
              key={o ?? 'none'}
              className="text-body underline aria-[current=true]:font-semibold"
              aria-current={o === opening}
              href={href({ opening: o }, current)}
            >
              {o ? OPENING_LABELS[o] : 'nenhum'}
            </a>
          ))}
        </nav>
        <p className="text-caption text-muted-foreground" data-lab-scenario="">
          {`effect=${effect ?? 'none'} · icons=${icons ?? 'game'} · hover=${hover ?? 'none'} · opening=${opening ?? 'none'} · ${Math.min(count, spells.length)} cards`}
        </p>
        <div className="flex flex-col gap-3" data-lab-list="">
          {spells.slice(0, count).map((spell) => (
            <SpellCard
              key={spell.id}
              spell={spell}
              showLevel
              isExpanded={openId === spell.id}
              onToggle={toggle}
              effect={effectOf(spell)}
              icon={icons ? iconOf(spell) : undefined}
              border={border}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
