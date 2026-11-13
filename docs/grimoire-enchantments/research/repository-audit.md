# Auditoria do repositório

Feita em 13/11/2026, na branch `feat/ficha-na-mesa` (o último commit em `main` é `eb9ef29`). Foi só leitura. Tudo aqui é **verificado** no código, salvo quando está marcado de outro jeito.

## Versões

| Peça              | Versão                                                                                                           | Fonte                                            |
| ----------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Next.js           | ^16.4.5                                                                                                          | `package.json`                                   |
| React / React DOM | ^19.3.1                                                                                                          | `package.json`                                   |
| Tailwind CSS      | ^4.3 (`@tailwindcss/postcss`), sem `tailwind.config`, tudo em `@theme`                                           | `package.json`, `app/globals.css`                |
| shadcn            | estilo `new-york`, `baseColor: zinc`, aliases `@frontend/*` (não usa a estrutura padrão `components/ui` na raiz) | `components.json`                                |
| Ícones            | `lucide-react` ^1.70 + `@iconify-json/game-icons` (CC BY 3.0, empacotado num sprite)                             | `package.json`, `scripts/generate-game-icons.ts` |
| Animação          | **nenhuma biblioteca** (sem framer-motion, motion ou GSAP)                                                       | `package.json`                                   |
| Testes            | Vitest (unit e integração), Playwright (e2e, a11y com axe, visual), Stryker                                      | `package.json`                                   |

## Arquitetura de componentes

- **Primitivos:** em `src/frontend/components/ui/`, com nomes de arquivo em kebab-case (`section-card.tsx`, `stat-block.tsx`). As variantes usam `class-variance-authority` e as classes se combinam com `cn()` (`src/frontend/lib/utils.ts`), que registra os papéis tipográficos no tailwind-merge.
- **Componentes compostos:** seguem o padrão `SectionCard.Header/Title/Body` (`src/frontend/components/ui/section-card.tsx`). É o modelo de composição que o Grimoire segue.
- **Feature folders:** `src/frontend/components/character/spells/spell-card/` tem `parts/`, `hooks/` e o teste unitário ao lado do componente (`*.unit.test.tsx`).
- **Server Components por padrão:** a interatividade fica em "ilhas" `'use client'` (docs/plans/2026-10-14-revisao-frontend-ui-ux.md, fase 3). Encantamentos sem estado devem continuar sem `'use client'`.

## Tokens e tema

Arquivo `app/globals.css`:

- **Escuro é o padrão** (`:root`). O claro fica em `:root[data-theme='light']` e só redefine o que muda (linhas 10-80).
- **Cores derivadas** (linhas ~82-200): `-flare` (texto e ícone com AA garantido via `oklch(from …)`), `-on`, `-surface`, `-muted` e `-glow`. São calculadas para três famílias:
  - `--primary`
  - `--character-color`: dentro de `.character-context`, vira o `--primary`
  - `--spell-color`: dentro de `.spell-context`, cada card define a sua
- **`@theme inline`:** expõe as cores como utilitários (`bg-spell-surface`, `text-character-flare`...).
- **Atmosfera do `body`:** um radial com `--atmosphere` e um **grão `feTurbulence` estático** em data-URI, de 160×160, repetido (linha ~410). É o embrião do `ancient-parchment` e do `astral-dust`.
- **Escala tipográfica por papel:** `text-display`, `text-title` (Cinzel), `text-heading`, `text-body`, `text-label` e `text-caption` (Inter). Regra: Cinzel nunca entra em texto corrido.
- **Utilitários de estado:** `focus-ring` (contorno de 2px na cor `--ring`) e `touch-target` (44px em toque).
- **Keyframes:** `fade-in`, `shimmer` e `turn-glow` (infinito, 2,4s). O `turn-glow` é o único loop decorativo. É aceitável porque só existe uma instância (de quem é o turno), mas não serve de modelo para cards repetidos.
- **Movimento reduzido:** uma regra global zera `animation-duration` e `transition-duration` (linha ~500). Os componentes do Grimoire podem contar com ela, mas **ainda precisam de um estado final estático com sentido**, porque a animação "termina" no último quadro.
- **Teste de tokens:** `src/frontend/styles/design-tokens.unit.test.ts` barra a paleta crua do Tailwind e cores fixas em classes. Os temas do Grimoire precisam definir tokens, não classes.
- **Teste de contraste:** `src/frontend/lib/theme-tokens.unit.test.ts` e `src/frontend/lib/contrast.ts` (citados no comentário do topo do CSS).

## Spellbook e spell card

| Arquivo                                                                            | O que importa para o Grimoire                                                                                                                                                                                                                                      |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/frontend/components/character/spells/spell-card/SpellCard.tsx`                | `React.memo`, `content-visibility: auto` com `contain-intrinsic-size: auto 96px`, `--spell-color` por card, faixa lateral `bg-spell` de 4px, a borda vira `border-spell-muted` no hover e quando está aberto, e o botão de fundo cobre o card (`absolute inset-0`) |
| `.../spell-card/SpellCard.tsx` (`SpellVFX`)                                        | Só renderiza com o card **aberto**, com `mask-image` que apaga antes do texto, opacidade de 50% e o ícone gigante a 10% no canto (a marca d'água de hoje)                                                                                                          |
| `.../spell-card/SpellBackground.tsx` + `src/frontend/constants/spell-vfx.tsx`      | 6 fundos CSS puros, escolhidos por `bgStyleId`: `ethereal-glow`, `grid-mesh`, `void-dots`, `classic-aura`, `dots-space` e `force-shockwave` (anéis estáticos)                                                                                                      |
| `.../parts/SpellHeader.tsx`                                                        | Ícone da magia num quadrado `bg-spell-surface ring-spell-muted`, nome em `font-display`                                                                                                                                                                            |
| `.../parts/SpellQuickAction.tsx`                                                   | `PrepareSpellAction` e `LearnSpellAction`. O estado e o rótulo acessível já existem, então o `prepared-seal` só decora                                                                                                                                             |
| `src/frontend/constants/spells.ts`                                                 | `SPELL_SCHOOL_ICONS`: as 8 escolas de D&D 5e mapeadas para game-icons (`shield-reflect`, `portal`, `crystal-ball`, `chained-heart`, `rolling-energy`, `heat-haze`, `half-dead`, `magic-swirl`)                                                                     |
| `src/frontend/components/character/spells/Spellbook.tsx`, `SpellbookFilterBar.tsx` | A página que lista dezenas de cards: o alvo principal do orçamento de desempenho                                                                                                                                                                                   |

**Não verificado:** a página ao vivo `https://www.rpgworldapp.com/demo/characters/ada/spells` não foi aberta nesta pesquisa. Li o código equivalente.

## Ícones e SVG

- `src/frontend/components/ui/icon.tsx` (`AppIcon`): `variant="game"` lê o sprite gerado, e o padrão usa lucide.
- `scripts/generate-game-icons.ts` (`npm run icons`): empacota só os game-icons usados num sprite SVG, fora do bundle JS. **É o caminho natural para os sigilos e emblemas do Grimoire.**
- `public/coins/*.svg`: os únicos SVGs soltos em `public/`.
- **Lacuna de licença:** os game-icons são CC BY 3.0 (`node_modules/@iconify-json/game-icons/info.json`), mas o `NOTICE.md` não traz a atribuição. Isso não é escopo do Grimoire, mas vale corrigir junto ou antes.

## Fontes

`src/frontend/lib/fonts.ts` carrega via `next/font/google`:

- Inter (`latin`)
- Cinzel (`latin`, pesos 600 e 700)
- Geist Mono

O subset `latin` cobre os acentos do português. Não existe fonte serifada para texto corrido.

## Acessibilidade

- Meta: WCAG 2.1 AA (`ACCESSIBILITY.md`).
- `e2e/a11y.spec.ts` e `e2e/a11y.mobile.spec.ts`: axe nos dois temas, com `color-contrast` ligado, e verificam um `main` e um `h1` por página.
- **Sem modo de alto contraste** (limitação declarada). O Grimoire deve ao menos esconder os enfeites em `@media (forced-colors: active)`.
- Os enfeites atuais já usam `aria-hidden="true"` (`SpellVFX` e a faixa lateral do card).

## Testes e documentação

- Testes unitários ficam ao lado do código: `*.unit.test.ts(x)`.
- Visual: `e2e/visual/screens.visual.spec.ts` com `toHaveScreenshot`, fora do CI (a renderização de fontes varia entre máquinas).
- Docs em português, com data no nome:
  - `docs/plans/AAAA-MM-DD-*.md`: planos antigos
  - `docs/superpowers/specs/*-design.md`: decisões, com a legenda **(dona)**/**(decisão do builder)**
  - `docs/superpowers/plans/`: planos de implementação

## O que o Grimoire reaproveita

| Existente                                  | Vira                                                                         |
| ------------------------------------------ | ---------------------------------------------------------------------------- |
| Família `--spell-*` / `--character-*`      | Cor de todo componente; temas só redefinem as bases                          |
| `void-dots`, `dots-space`, `ethereal-glow` | Variantes de `astral-dust`                                                   |
| Grão `feTurbulence` do `body`              | Base do `ancient-parchment`                                                  |
| Ícone gigante do `SpellVFX`                | Primeira versão do `sigil-watermark`                                         |
| `SPELL_SCHOOL_ICONS` + sprite              | Mapeamento D&D do `school-emblem`                                            |
| `PrepareSpellAction`                       | Hospedeiro do `prepared-seal`                                                |
| `focus-ring`, `touch-target`               | Continuam donos do foco e da área de toque; os encantamentos não mexem neles |
| Regra global de movimento reduzido         | Base do `sigil-pulse` e do `enchanted-hover`                                 |
