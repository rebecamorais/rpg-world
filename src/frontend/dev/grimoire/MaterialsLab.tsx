'use client';

/*
 * Internal lab for the Grimoire material surfaces (/dev/grimoire/materials). Not product UI:
 * its text is in Portuguese and stays out of next-intl on purpose (it lives outside the folders
 * the hardcoded-text guard reads).
 */
import { useCallback, useState } from 'react';

import { SpellCard } from '@frontend/components/character/spells/spell-card/SpellCard';
import {
  MaterialSurface,
  cardMaterial,
} from '@frontend/components/grimoire/material-surface/MaterialSurface';
import {
  type CardMaterial,
  MATERIAL_IDS,
  type MaterialId,
} from '@frontend/components/grimoire/material-surface/types';
import type { Spell } from '@frontend/types/spells';

import type { LabParams } from './lab-params';

// Built once: stable objects keep SpellCard's memo working
const MATERIALS = Object.fromEntries(MATERIAL_IDS.map((id) => [id, cardMaterial(id)])) as Record<
  MaterialId,
  CardMaterial
>;

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

export function MaterialsLab({
  spells,
  material,
  count,
  expanded,
}: LabParams & { spells: Spell[] }) {
  const current = { material, count, expanded };
  const [openId, setOpenId] = useState<string | null>(expanded ? (spells[0]?.id ?? null) : null);
  const toggle = useCallback((id: string) => setOpenId((prev) => (prev === id ? null : id)), []);
  const cardMat = material ? MATERIALS[material] : undefined;

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-10 px-4 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-display">Grimoire · Material Surfaces</h1>
        <p className="text-body text-muted-foreground max-w-prose">
          Laboratório interno. Os materiais são parados (sem animação) e só existem nesta página; o
          spellbook continua igual.
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
                  ...MATERIALS['glacial-glass'],
                  ornament: (
                    <span
                      aria-hidden="true"
                      data-overflow-probe=""
                      className="border-spell pointer-events-none absolute -top-2.5 -right-2.5 z-20 size-5 rotate-45 border-2 border-dashed"
                    />
                  ),
                }}
              />
            </div>
          )}
        </div>
      </section>

      {/* 3. The real SpellCard in a long list: what the benchmark scrolls */}
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
          <a className="text-body underline" href={href({ count: 100 }, current)}>
            100 cards
          </a>
          <a className="text-body underline" href={href({ expanded: !expanded }, current)}>
            {expanded ? 'fechar o primeiro' : 'abrir o primeiro'}
          </a>
        </nav>
        <p className="text-caption text-muted-foreground" data-lab-scenario="">
          {`material=${material ?? 'none'} · ${Math.min(count, spells.length)} cards`}
        </p>
        <div className="flex flex-col gap-3" data-lab-list="">
          {spells.slice(0, count).map((spell) => (
            <SpellCard
              key={spell.id}
              spell={spell}
              showLevel
              isExpanded={openId === spell.id}
              onToggle={toggle}
              material={cardMat}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
