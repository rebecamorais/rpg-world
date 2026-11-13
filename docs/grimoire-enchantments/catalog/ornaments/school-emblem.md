# SchoolEmblem (`school-emblem`)

Ornamentos · Status: proposto, depois do 1º grupo · Custo: Muito baixo · Faixas: `F1` (`tile`, `ring`), `F2` (`shield`, `medallion`, halo)

## 1. Identidade

- **Propósito:** emblema visual de uma tradição ou classificação mágica (escola, domínio, círculo, elemento). O componente é **genérico**: recebe um identificador de emblema e não sabe o que é uma "escola de magia".
- **Descrição:** o ícone do emblema dentro de uma moldura (caixa, anel, escudo, medalhão), na cor do contexto, opcionalmente com um halo de raios e um rótulo em arco.
- **Usos:** cabeçalho do card de magia, filtro do grimório, ficha (tradição da classe), itens (escola do encantamento), facções na campanha.

**Verificado:**

- O `SpellHeader` (`src/frontend/components/character/spells/spell-card/parts/SpellHeader.tsx`) mostra o ícone principal numa caixa `bg-spell-surface text-spell-flare ring-spell-muted rounded-lg p-2.5 ring-1`.
- `SPELL_SCHOOL_ICONS` (`src/frontend/constants/spells.ts:5`) mapeia as 8 escolas de D&D 5e para game-icons.
- O sprite é gerado por `npm run icons` (`scripts/generate-game-icons.ts`).

## 2. Design visual

**Direção:** brasão de ordem arcana. Moldura fina, ícone forte, nada de brilho permanente.

| Moldura (`frame`) | Aparência                                                               | Cor                                                                  | Uso sugerido                          | Interação                         | Fallback estático  |
| ----------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------- | --------------------------------- | ------------------ |
| `tile`            | Caixa arredondada com anel de 1 px (o visual de hoje)                   | Fundo `--spell-surface`, ícone `--spell-flare`, anel `--spell-muted` | Card fechado (`F1`), `legacy`         | Nenhuma                           | É o próprio estado |
| `ring`            | Círculo com anel duplo fino e marcas de grau                            | Igual                                                                | Card aberto, filtro                   | Hover/foco: o anel externo acende | `tile`             |
| `shield`          | Escudo heráldico com o ícone dentro                                     | Igual                                                                | Ficha (tradição, domínio)             | Nenhuma                           | `tile`             |
| `medallion`       | Anel com contas e ornamentos cardeais, opcionalmente com rótulo em arco | Igual; borda em `--grimoire-ornament`                                | Página de detalhe, filtro selecionado | Nenhuma                           | `ring`             |

**Extras opcionais:**

- **Halo (`halo`):** raios finos atrás do emblema (REF-95, REF-06), estáticos. Marca o filtro selecionado ou a escola em destaque. Em `F2`.
- **Rótulo em arco (`label` + `curvedLabel`):** o nome passado pelo chamador escrito em arco no `medallion`, com `<textPath>` (técnica da REF-54, com `useId` para não repetir ids).

**Comportamento de cor:** só o contexto (`--spell-*`, `--character-*`, `--primary-*`). O tema escolhe a moldura padrão.

**Temas:** `legacy` = `tile`. `celestial-codex` = `ring` com halo. `elemental-archive` = `medallion` no card aberto.

## 3. Proposta técnica

**React + CSS + SVG.** Nenhuma dependência nova.

- **Ícone:** o `AppIcon variant="game"` existente (sprite, `currentColor`).
- **Molduras:** `tile` e `ring` são CSS (`border`, `outline` com `outline-offset`, marcas de grau com `repeating-conic-gradient` mascarado). `shield` e `medallion` usam `mask-image` de um asset sobre `background-color`, com o ícone centralizado por cima.
- **Halo:** pseudo-elemento com `repeating-conic-gradient` de raios finos e máscara radial; sem animação. A "respiração" das REF-04/REF-06 fica de fora.
- **Rótulo em arco:** um SVG inline pequeno com `<path id={useId()}>` e `<textPath startOffset="50%" text-anchor="middle">` (REF-54), só no `medallion`.
- É um componente React porque compõe ícone e moldura e escolhe o ícone por id. Sem estado; pode ser Server Component se o `AppIcon` puder (a verificar na implementação).

**Mapeamento D&D 5e (fora do componente).** Num helper de D&D (proposta: `src/frontend/lib/dnd/emblems.ts`), reaproveitando `SPELL_SCHOOL_ICONS`:

| Escola (`school`) | `emblem` (game-icons) | Origem                            |
| ----------------- | --------------------- | --------------------------------- |
| abjuration        | `shield-reflect`      | `SPELL_SCHOOL_ICONS` (verificado) |
| conjuration       | `portal`              | idem                              |
| divination        | `crystal-ball`        | idem                              |
| enchantment       | `chained-heart`       | idem                              |
| evocation         | `rolling-energy`      | idem                              |
| illusion          | `heat-haze`           | idem                              |
| necromancy        | `half-dead`           | idem                              |
| transmutation     | `magic-swirl`         | idem                              |

Outros sistemas passam o próprio mapeamento.

**Pontos de integração:** a caixa do ícone em `SpellHeader.tsx`; filtros em `src/frontend/components/character/spells/SpellbookFilterBar.tsx`.

## 4. API proposta

```ts
interface SchoolEmblemProps {
  /** Icon name from the game-icons sprite; the system mapping lives outside this component. */
  emblem: string;
  frame?: 'tile' | 'ring' | 'shield' | 'medallion'; // default 'tile'
  size?: 'sm' | 'md' | 'lg' | 'xl'; // 24 / 40 / 56 / 96px
  /** Static ray halo behind the emblem. */
  halo?: boolean;
  /** Accessible name; omit when nearby text already says it (then aria-hidden). */
  label?: string;
  /** Writes `label` on an arc ('medallion' only). */
  curvedLabel?: boolean;
  className?: string;
}
```

```tsx
// Usage (D&D): the component never imports SPELL_SCHOOL_ICONS.
<SchoolEmblem emblem={SPELL_SCHOOL_ICONS[spell.school]} frame="ring" />
```

## 5. Personalização

| Propriedade     | Token / prop                                     | Padrão                                       |
| --------------- | ------------------------------------------------ | -------------------------------------------- |
| Cor             | `--spell-*` / `--character-*` / `--primary-*`    | o contexto                                   |
| Moldura         | `frame`; o tema define `--grimoire-emblem-frame` | `tile`                                       |
| Tamanho         | `size`                                           | `md` (40 px, ≈ a caixa de hoje)              |
| Arte da moldura | `--grimoire-emblem-mask`                         | `school-emblem/shield.svg` / `medallion.svg` |
| Halo            | `--grimoire-glow-strength`                       | `0.25`; `0` desliga                          |

## 6. Desempenho

- **DOM:** 2 nós (moldura + ícone `<svg><use>`). O rótulo em arco acrescenta um SVG de ~3 nós, só no `medallion`.
- **Pintura:** `tile`/`ring` iguais à caixa de hoje; `shield`/`medallion` somam uma máscara pequena.
- **Animação:** só a transição de cor no hover/foco.
- **SVG:** o ícone é um `<use>` do sprite (verificado). Molduras ≤ 1,5 KB.
- **Várias instâncias:** seguro em `F1` com `tile`/`ring`; `medallion` e halo em `F2`.
- **Celular:** `sm` (24 px) só com `tile`.
- **Movimento reduzido:** nada a desligar além da transição.
- **Custo:** Muito baixo.
- **Benchmark (`/dev/grimoire`):** 60 cards fechados com `ring` contra `tile`: diferença de tempo de pintura < 3%, nós extras por card ≤ 1.

## 7. Acessibilidade

- Por padrão é `aria-hidden="true"`: o nome da escola já aparece em texto no cabeçalho (verificado: `displayValues.school` no card aberto). Com `label`, vira `role="img"` + `aria-label`, para usos isolados (filtro só com ícone).
- O rótulo em arco é visual: o SVG fica `aria-hidden`, e o nome acessível vem de `aria-label`.
- **Contraste:** `--spell-flare` sobre `--spell-surface` já é AA pelos tokens (verificado).
- **`forced-colors`:** o ícone fica `CanvasText`; molduras de máscara e halo somem; `tile`/`ring` mantêm a borda nativa.

## 8. Compatibilidade

| Superfície            | Uso                            | Moldura                           |
| --------------------- | ------------------------------ | --------------------------------- |
| `spell-card-compact`  | Sim                            | `tile` / `ring`, `md`             |
| `spell-card-expanded` | Sim                            | `ring` / `medallion`              |
| `spellbook-page`      | Filtros por escola             | `ring` (+ `halo` no selecionado)  |
| `character-sheet`     | Tradição da classe             | `shield`                          |
| `inventory-card`      | Escola do encantamento do item | `tile`                            |
| `campaign`            | Facções e ordens               | `shield` / `medallion` com rótulo |

## 9. Assets

Os prompts de geração ficam fora do repositório.

- `school-emblem/medallion.svg`: anel com contas e ornamentos cardeais.
- `school-emblem/shield.svg`: contorno de escudo heráldico.

Os 8 ícones de escola **já existem** (game-icons, REF-33).

## 10. Referências

| ID     | Nome            | URL                                                                                                | Fonte      | Tecnologia                    | Licença       | Código?                           | Relevância                | Adaptação                         |
| ------ | --------------- | -------------------------------------------------------------------------------------------------- | ---------- | ----------------------------- | ------------- | --------------------------------- | ------------------------- | --------------------------------- |
| REF-54 | Stamp           | https://21st.dev/@designali-in/components/stamp                                                    | 21st       | SVG serrilhado + `<textPath>` | Não declarada | Só inspiração                     | Rótulo em arco            | `useId` nos ids; nosso traço      |
| REF-95 | Sunburst Fan    | https://github.com/isas1/forever-ai-components/blob/main/infinite/art-deco/01-sunburst-fan.html    | forever    | Medalhão com raios            | MIT           | **Reutilizável**                  | Halo                      | Estático                          |
| REF-06 | The Halo        | https://github.com/isas1/forever-ai-components/blob/main/infinite/mucha/01-the-halo.html           | forever    | Halo só em CSS                | MIT           | **Reutilizável**                  | Halo em CSS               | Sem o loop                        |
| REF-04 | Crown Motif     | https://github.com/isas1/forever-ai-components/blob/main/infinite/art-deco/12-crown-motif.html     | forever    | Emblema sobre halo de raios   | MIT           | **Reutilizável**                  | Composição do `medallion` | Sem a respiração                  |
| REF-93 | Gilded Pinwheel | https://github.com/isas1/forever-ai-components/blob/main/infinite/art-deco/09-gilded-pinwheel.html | forever    | Estrela de 8 pontas           | MIT           | **Reutilizável**                  | Ornamento do `medallion`  | Estático                          |
| REF-97 | Gyroscope Rings | https://github.com/isas1/forever-ai-components/blob/main/infinite/css-3d/15-gyroscope-rings.html   | forever    | Anéis 3D em CSS               | MIT           | **Reutilizável**                  | `ring` com marcas         | Projeção 2D, estática             |
| REF-33 | game-icons.net  | https://game-icons.net                                                                             | game-icons | Ícones SVG (sprite)           | CC BY 3.0     | **Reutilizável** (com atribuição) | Os ícones das escolas     | Falta a atribuição no `NOTICE.md` |

## 11. Questões em aberto

- O `SpellHeader` usa `mainIcon` (o tipo de dano tem prioridade sobre a escola no `useSpellDisplay`; não verificado em detalhe). Com o SchoolEmblem no cabeçalho, onde fica o ícone do dano? Decisão de produto para o Playground.
- O rótulo em arco cabe em nomes longos de escola em pt ("Transmutação", "Encantamento") a 96 px? Testar.
