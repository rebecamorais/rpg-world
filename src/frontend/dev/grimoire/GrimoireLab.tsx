'use client';

/*
 * Internal lab for the Grimoire library (/dev/grimoire): open-card effects. Not product UI:
 * its text is in Portuguese and stays out of next-intl on purpose (it lives outside the folders
 * the hardcoded-text guard reads).
 */
import { type CSSProperties, type ReactNode, useCallback, useState } from 'react';

import { SpellCard } from '@frontend/components/character/spells/spell-card/SpellCard';
import { EffectLayers, cardEffect } from '@frontend/components/grimoire/card-effect/CardEffect';
import { EffectEmblem } from '@frontend/components/grimoire/card-effect/EffectArt';
import { ART, type ArtName } from '@frontend/components/grimoire/card-effect/art';
import {
  type CardEffect,
  EFFECT_IDS,
  type EffectId,
} from '@frontend/components/grimoire/card-effect/types';
import { DAMAGE_THEMES, SCHOOL_THEMES } from '@frontend/constants/damage-themes';
import { spellEffectOf, spellEmblemOf } from '@frontend/constants/grimoire-effects';
import type { Spell } from '@frontend/types/spells';

import type { LabParams } from './lab-params';

// Built once: stable objects keep SpellCard's memo working
// One element per emblem, built once: the same object keeps SpellCard's memo working
const EMBLEMS = Object.fromEntries(
  (Object.keys(ART) as ArtName[]).map((name) => [name, <EffectEmblem key={name} name={name} />]),
) as Record<ArtName, ReactNode>;

const EFFECTS = Object.fromEntries(EFFECT_IDS.map((id) => [id, cardEffect(id)])) as Record<
  EffectId,
  CardEffect
>;

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
}: LabParams & { spells: Spell[] }) {
  const current = { effect, count, expanded, icons };
  const [replay, setReplay] = useState(0);
  const [openId, setOpenId] = useState<string | null>(expanded ? (spells[0]?.id ?? null) : null);
  const toggle = useCallback((id: string) => setOpenId((prev) => (prev === id ? null : id)), []);
  // 'auto': each spell wears what the D&D map gives it (damage type, else school), or nothing
  const emblemOf = (spell: Spell) => {
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
          Laboratório interno da biblioteca do Grimório: os efeitos do card aberto. Tudo existe só
          nesta página; o spellbook continua igual.
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
          <a
            className="text-body underline"
            href={href({ icons: icons ? null : 'emblem' }, current)}
          >
            {icons ? 'ícones do jogo' : 'ícones: emblemas das escolas'}
          </a>
          <a className="text-body underline" href={href({ count: 100 }, current)}>
            100 cards
          </a>
          <a className="text-body underline" href={href({ expanded: !expanded }, current)}>
            {expanded ? 'fechar o primeiro' : 'abrir o primeiro'}
          </a>
        </nav>
        <p className="text-caption text-muted-foreground" data-lab-scenario="">
          {`effect=${effect ?? 'none'} · icons=${icons ?? 'game'} · ${Math.min(count, spells.length)} cards`}
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
              icon={icons ? emblemOf(spell) : undefined}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
