# Plano: performance do modal de busca de magias

**Data:** 2026-10-14
**Escopo:** `SpellSearchDialog` e `SpellCard` (o Spellbook também ganha, porque usa o mesmo card).
**Sintoma:** o modal trava um pouco ao abrir, rolar a lista, passar o mouse e expandir um card.
**Status (2026-10-15):** concluído. Fases 1–4 no PR #60 (junto da revisão do Spellbook), fase 5 e
medição final na branch `perf/spells-fase-5`. Ver "Medição depois" abaixo.

## Medição de base (2026-10-14)

Chromium via Playwright, 1600×1000, sem throttling de CPU, `next dev`, personagem do player de
exemplo, primeira página do modal (12 magias, 1 com `force-shockwave`). FPS medido com
`requestAnimationFrame`; cada variante desliga um efeito com CSS injetado.

| Cenário                                         | Parado | Rolando | Expandir/recolher |
| ----------------------------------------------- | -----: | ------: | ----------------: |
| Página sem modal                                |     60 |       — |                 — |
| Modal como está                                 |  29–58 |   28–35 |                26 |
| Sem `backdrop-filter` **só no `DialogContent`** |     60 |  **60** |            **45** |
| Sem `backdrop-filter` só nos cards              |     61 |      31 |                 — |
| Sem nenhum `filter: blur()`                     |     59 |      30 |                 — |
| Sem animações CSS                               |     58 |      30 |                 — |
| Sem nenhum desses efeitos                       |      — |      60 |                 — |

**Conclusão:** quase todo o lag vem do `backdrop-blur-xl` do `DialogContent`. Tirar só ele leva a
rolagem de ~29 para 60 fps. Os outros efeitos, sozinhos, não mudam o número nesta máquina (podem
pesar em máquinas mais fracas, por isso seguem no plano com prioridade menor). O expandir continua
em 45 fps sem o desfoque: o resto é a animação de layout (suspeito 4).

## Suspeitos (em ordem de impacto provável)

### 1. `backdrop-filter` em camadas, dentro de um container com scroll

- `DialogContent` usa `bg-background/95 backdrop-blur-xl`: o navegador desfoca a página inteira
  atrás de um painel de 90vh.
- Cada `SpellCard` usa `backdrop-blur-md hover:backdrop-blur-xl`. São 12 cards por página, cada um
  desfocando o que está atrás dele, e isso é recalculado **a cada frame de scroll**.
- O `transition-all duration-500` do `<article>` também anima o `backdrop-filter` ao passar o
  mouse (de `md` para `xl`), que é a transição mais cara que existe em CSS.

Atrás do modal o fundo já é praticamente opaco (95%), então o desfoque quase não aparece.

### 2. Camadas com `filter: blur()` grande

- "Thematic glow" do modal: `absolute inset-0 blur-3xl` cobrindo o diálogo inteiro.
- Por card (`SpellVFX`): brilho radial com `blur-3xl` (fica em `opacity-0`, mas a camada existe).
- Fundos em `constants/spell-vfx.tsx`: bolhas com `blur-[100px]` (`grid-mesh`), `blur-[80px]`
  (`classic-aura`) e `blur-[40px]` (`force-shockwave`).

Todas desenham só um gradiente borrado, o que um `radial-gradient` puro faz sem filtro.

### 3. Animações infinitas e transições largas

- `force-shockwave`: 3 `animate-shockwave` **infinitos** por card, mesmo fora da tela ou parados.
- Ícone decorativo de 160px com `transition-all duration-700` + `scale` + `rotate` no hover.
- `transition-all` espalhado (article, header, ícone) anima propriedades que nem mudam.

### 4. Expandir o card anima layout

- Duas transições de `grid-template-rows` empilhadas: o wrapper do `SpellCard` (300ms) e o de
  `SpellDetails` (500ms). Cada frame recalcula o layout da lista inteira.
- `contentVisibility: 'auto'` sem `containIntrinsicSize`: os cards fora da tela contam com altura 0
  e a barra de rolagem "pula" quando entram na tela.

### 5. Dados e re-render

- Toda troca de filtro/página mostra `LoadingState` e **desmonta e remonta os 12 cards** (não há
  `placeholderData`). A lista some e reaparece, o que parece travamento.
- Magias são dados estáticos, mas `useSpells` usa `staleTime` 0: reabrir o modal busca de novo.
- `useSpellDisplay` roda duas vezes por card (`SpellCard` e `SpellBackground`).
- `onClick={() => toggleExpand(spell.id)}` cria uma função nova por card a cada render, então um
  `memo` no `SpellCard` não adiantaria hoje: expandir um card re-renderiza os 12.

## Plano

### Fase 0: medir antes (baseline): feita, ver tabela acima

Para repetir com mais detalhe:

1. Chrome DevTools → Performance, CPU 4x mais lenta, gravar: abrir o modal, rolar a lista até o fim,
   passar o mouse em 3 cards, expandir/recolher um, trocar de página.
2. Anotar: frames perdidos no scroll, duração das tarefas longas, INP de expandir e de trocar
   filtro. Ativar "Rendering → Paint flashing / Layer borders" para ver quem repinta.
3. Guardar os números neste arquivo para comparar no fim.

### Fase 1: tirar os `backdrop-filter` (maior ganho, menor risco): feita

- **Prioridade:** `DialogContent` do modal com fundo opaco (`bg-background`), sem
  `backdrop-blur-xl`. Sozinha, essa linha resolve a rolagem (29 → 60 fps). Vale procurar o mesmo
  padrão em outros diálogos/sheets grandes (`grep -rn "backdrop-blur" src`).
- `SpellCard`: remover `backdrop-blur-md` / `hover:backdrop-blur-xl`; trocar `bg-card/40` por uma
  cor sólida equivalente. Hover passa a mudar só borda/fundo.
- Trocar `transition-all` do `<article>` por `transition-[transform,border-color,background-color,box-shadow]`.

### Fase 2: gradiente em vez de `blur()`: feita

- Brilho do modal e brilho do card: `radial-gradient(...)` sem `filter`, com a mesma cor e alcance.
- `spell-vfx.tsx`: substituir as bolhas `blur-[Npx]` por gradientes radiais. Conferir lado a lado
  com os baselines visuais.

### Fase 3: animações sob controle: feita (o fundo temático só aparece no card aberto, e o shockwave ficou estático)

- `force-shockwave`: animar só no hover/foco do card (`group-hover:animate-shockwave`) e sempre
  dentro de `motion-safe:`; parado, mostra um anel estático.
- Ícone decorativo: `transition-[transform,opacity]` e `will-change` só no hover.
- Shimmer: já é `motion-safe` e só no hover, manter.

### Fase 4: expandir sem animar layout em cascata: feita

- Uma transição de altura só (tirar a do `SpellDetails` ou a do `SpellCard`), com
  `transition-[grid-template-rows,opacity]` em vez de `transition-all`.
- `containIntrinsicSize: 'auto 120px'` (altura média do card recolhido) junto do
  `contentVisibility: 'auto'`.

### Fase 5: dados e re-render: feita (o skeleton também entrou no carregamento do Spellbook)

- `useSpells`: `placeholderData: keepPreviousData` (a lista antiga fica, com opacidade reduzida,
  enquanto a nova carrega) e `staleTime` longo (magias não mudam durante a sessão).
- Pré-carregar a próxima página com `queryClient.prefetchQuery`.
- Skeleton com o formato do card no primeiro carregamento, no lugar do `LoadingState`.
- `SpellCard` recebe `onToggle(id)` estável em vez de uma closure por card e vira `React.memo`;
  `SpellBackground` recebe o `theme` já calculado em vez de chamar `useSpellDisplay` de novo.

### Fase 6: medir depois: feita, ver "Medição depois"

- Repetir exatamente o roteiro da Fase 0 e registrar os números aqui.
- `npm run test:unit`, `npm run test:visual` (atualizar baselines do modal e do Spellbook se a
  aparência mudar de propósito) e um teste manual com `prefers-reduced-motion`.

## Medição depois (2026-10-15)

Mesmo cenário da base: Chromium via Playwright, 1600×1000, `next dev`, Alatar (player de exemplo),
primeira página do modal sem filtros. Três rodadas por cenário; FPS por `requestAnimationFrame`.

| Cenário                   | Parado | Rolando | Expandir/recolher |
| ------------------------- | -----: | ------: | ----------------: |
| Base (2026-10-14)         |  29–58 |   28–35 |                26 |
| Depois                    |  60–61 |      60 |                60 |
| Depois, CPU 4x mais lenta |  60–61 |      60 |             51–52 |

A base não tem a medição com CPU 4x; a linha fica como referência para próximas mudanças. Rolar
deixou de perder frames e expandir chega a 60 sem throttling. Virtualizar a lista segue sem
necessidade.

## Fora do escopo

- Virtualizar a lista: com 12 itens por página não compensa; reavaliar só se a medição da Fase 6
  ainda mostrar problema.
- Mudar o visual dos efeitos: a ideia é manter a aparência e trocar só a técnica.

## Ordem sugerida de commits

Um commit por fase (1 a 5), cada um com a medição rápida que justifica o próximo. Se a Fase 1 sozinha
já resolver o travamento, as fases 2 e 3 viram polimento e podem esperar.
