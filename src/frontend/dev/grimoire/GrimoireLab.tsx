'use client';

/*
 * Internal lab for the Grimoire library (/dev/grimoire): materials, effects, item tiles. Not product UI:
 * its text is in Portuguese and stays out of next-intl on purpose (it lives outside the folders
 * the hardcoded-text guard reads).
 */
import { type CSSProperties, useCallback, useState } from 'react';

import { ItemImage } from '@frontend/components/character/inventory/ItemImage';
import { groupOf, itemGroupStyle } from '@frontend/components/character/inventory/item-visuals';
import { SpellCard } from '@frontend/components/character/spells/spell-card/SpellCard';
import { EffectLayers, cardEffect } from '@frontend/components/grimoire/card-effect/CardEffect';
import {
  type CardEffect,
  EFFECT_IDS,
  type EffectId,
} from '@frontend/components/grimoire/card-effect/types';
import {
  MaterialLayers,
  MaterialSurface,
  cardMaterial,
} from '@frontend/components/grimoire/material-surface/MaterialSurface';
import {
  type CardMaterial,
  MATERIAL_IDS,
  type MaterialId,
} from '@frontend/components/grimoire/material-surface/types';
import { DAMAGE_THEMES, SCHOOL_THEMES } from '@frontend/constants/damage-themes';
import { spellEffectOf } from '@frontend/constants/grimoire-effects';
import { ITEM_GROUP_MATERIALS, spellMaterialOf } from '@frontend/constants/grimoire-materials';
import { cn } from '@frontend/lib/utils';
import type { Spell } from '@frontend/types/spells';

import type { ItemDto } from '@backend/contexts/items/domain/item';

import type { LabParams } from './lab-params';

// Built once: stable objects keep SpellCard's memo working
const MATERIALS = Object.fromEntries(MATERIAL_IDS.map((id) => [id, cardMaterial(id)])) as Record<
  MaterialId,
  CardMaterial
>;

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

const NAMES: Record<MaterialId, string> = {
  'glacial-glass': 'Glacial Glass · vidro gelado',
  'alchemical-corrosion': 'Alchemical Corrosion · ácido viscoso',
  'crypt-stone': 'Crypt Stone · pedra necrótica',
  'divine-parchment': 'Divine Parchment · pergaminho radiante',
};

const href = (params: Partial<LabParams>, current: LabParams) => {
  const next = { ...current, ...params };
  const query = new URLSearchParams();
  if (next.material) query.set('material', next.material);
  if (next.effect) query.set('effect', next.effect);
  query.set('count', String(next.count));
  if (next.expanded) query.set('expanded', '1');
  return `?${query}`;
};

function Sample({ size }: { size: 'sm' | 'md' | 'lg' }) {
  return (
    <div className={size === 'sm' ? 'p-3' : 'p-5'}>
      <p className="font-display text-title">Bola de Fogo</p>
      <p className="text-label text-muted-foreground mt-1">3º nível · Evocação · 8d6 fogo</p>
      {size !== 'sm' && (
        <p className="text-body mt-3 max-w-prose">
          Uma faísca brilhante sai do seu dedo até um ponto à sua escolha e explode num estrondo.
          Cada criatura numa esfera de 6 metros faz um teste de resistência de Destreza.
          {size === 'lg' &&
            ' Em uma falha, sofre 8d6 de dano de fogo; em um sucesso, metade. O fogo contorna cantos e incendeia objetos inflamáveis que ninguém esteja segurando ou vestindo.'}
        </p>
      )}
    </div>
  );
}

export function GrimoireLab({
  spells,
  material,
  effect,
  count,
  expanded,
  items,
}: LabParams & { spells: Spell[]; items: ItemDto[] }) {
  const current = { material, effect, count, expanded };
  const [replay, setReplay] = useState(0);
  const [openId, setOpenId] = useState<string | null>(expanded ? (spells[0]?.id ?? null) : null);
  const toggle = useCallback((id: string) => setOpenId((prev) => (prev === id ? null : id)), []);
  // 'auto': each spell wears what the D&D map gives it (damage type, else school), or nothing
  const materialOf = (spell: Spell) => {
    if (material !== 'auto') return material ? MATERIALS[material] : undefined;
    const id = spellMaterialOf(spell);
    return id ? MATERIALS[id] : undefined;
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
          Laboratório interno da biblioteca do Grimório: materiais (parados), efeitos do card aberto
          e o reuso em itens da mochila. Tudo existe só nesta página; o spellbook e a mochila
          continuam iguais.
        </p>
      </header>

      {/* 1. Each material alone, at three card sizes */}
      <section className="flex flex-col gap-4" aria-labelledby="lab-materials">
        <h2 id="lab-materials" className="text-title">
          Materiais
        </h2>
        {MATERIAL_IDS.map((id) => (
          <div key={id} className="flex flex-col gap-3" data-lab-material={id}>
            <h3 className="text-heading">{NAMES[id]}</h3>
            <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
              <MaterialSurface material={id}>
                <Sample size="sm" />
              </MaterialSurface>
              <MaterialSurface material={id}>
                <Sample size="md" />
              </MaterialSurface>
            </div>
            <MaterialSurface material={id}>
              <Sample size="lg" />
            </MaterialSurface>
          </div>
        ))}
      </section>

      {/* 2. OverflowBorders: does an ornament get past the edge? */}
      <section className="flex flex-col gap-4" aria-labelledby="lab-overflow">
        <h2 id="lab-overflow" className="text-title">
          OverflowBorders (teste de projeção)
        </h2>
        <p className="text-body text-muted-foreground max-w-prose">
          O losango tracejado fica 10px para fora do canto. No painel ele aparece inteiro; no
          SpellCard, o content-visibility: auto recorta tudo na borda do card (paint containment).
        </p>
        <div className="grid gap-6 sm:grid-cols-2">
          <MaterialSurface material="glacial-glass">
            <span
              aria-hidden="true"
              data-overflow-probe=""
              className="border-spell absolute -top-2.5 -right-2.5 size-5 rotate-45 border-2 border-dashed"
            />
            <Sample size="sm" />
          </MaterialSurface>
          {spells[0] && (
            <div className="relative">
              <SpellCard
                spell={spells[0]}
                material={{
                  id: 'glacial-glass',
                  layers: (clipped) => (
                    <>
                      {MATERIALS['glacial-glass'].layers(clipped)}
                      <span
                        aria-hidden="true"
                        data-overflow-probe=""
                        className="border-spell pointer-events-none absolute -top-2.5 -right-2.5 z-20 size-5 rotate-45 border-2 border-dashed"
                      />
                    </>
                  ),
                }}
              />
            </div>
          )}
        </div>
      </section>

      {/* 3. Open-card effects: each type in its own color */}
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

      {/* 4. The real SpellCard in a long list: what the benchmark scrolls */}
      <section className="flex flex-col gap-4" aria-labelledby="lab-cards">
        <h2 id="lab-cards" className="text-title">
          Lista de SpellCards
        </h2>
        <nav className="flex flex-wrap gap-2" aria-label="Cenários">
          <a className="text-body underline" href={href({ material: null }, current)}>
            Original
          </a>
          {MATERIAL_IDS.map((id) => (
            <a key={id} className="text-body underline" href={href({ material: id }, current)}>
              {id}
            </a>
          ))}
          <a className="text-body underline" href={href({ material: 'auto' }, current)}>
            auto (por tipo de magia)
          </a>
          <a
            className="text-body underline"
            href={href({ effect: effect ? null : 'auto' }, current)}
          >
            {effect ? 'sem efeitos' : 'efeitos: auto (por tipo de magia)'}
          </a>
          <a className="text-body underline" href={href({ count: 100 }, current)}>
            100 cards
          </a>
          <a className="text-body underline" href={href({ expanded: !expanded }, current)}>
            {expanded ? 'fechar o primeiro' : 'abrir o primeiro'}
          </a>
        </nav>
        <p className="text-caption text-muted-foreground" data-lab-scenario="">
          {`material=${material ?? 'none'} · effect=${effect ?? 'none'} · ${Math.min(count, spells.length)} cards`}
        </p>
        <div className="flex flex-col gap-3" data-lab-list="">
          {spells.slice(0, count).map((spell) => (
            <SpellCard
              key={spell.id}
              spell={spell}
              showLevel
              isExpanded={openId === spell.id}
              onToggle={toggle}
              material={materialOf(spell)}
              effect={effectOf(spell)}
            />
          ))}
        </div>
      </section>

      {/* 5. The same library on another card: backpack item tiles */}
      <section className="flex flex-col gap-4" aria-labelledby="lab-items">
        <h2 id="lab-items" className="text-title">
          Itens da mochila
        </h2>
        <p className="text-body text-muted-foreground max-w-prose">
          Ladrilhos com as mesmas classes do ItemGrid e itens reais do catálogo. O material vem do
          grupo do item (mapa de exemplo de D&amp;D) e a cor é a do grupo: o ladrilho define
          --grimoire-tint como var(--item-color). A mochila de verdade não muda.
        </p>
        {[false, true].map((withMaterial) => (
          <div
            key={String(withMaterial)}
            className="flex flex-col gap-2"
            data-lab-items={withMaterial ? 'material' : 'plain'}
          >
            <h3 className="text-heading">{withMaterial ? 'Com material' : 'Sem material'}</h3>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
              {items.map((item) => {
                const group = groupOf(item.category);
                const id = withMaterial ? ITEM_GROUP_MATERIALS[group] : null;
                return (
                  <span
                    key={item.key}
                    className={cn(
                      'item-context bg-item-surface text-item-flare border-item-muted relative flex aspect-square flex-col items-center justify-center gap-1 rounded-md border p-1',
                    )}
                    style={
                      {
                        ...itemGroupStyle(group),
                        '--grimoire-tint': 'var(--item-color)',
                      } as CSSProperties
                    }
                  >
                    {id && <MaterialLayers material={id} />}
                    <span className="relative z-10 flex flex-col items-center gap-1">
                      <ItemImage item={item} size={32} />
                      <span className="text-foreground text-label line-clamp-2 w-full text-center break-words">
                        {item.name}
                      </span>
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
