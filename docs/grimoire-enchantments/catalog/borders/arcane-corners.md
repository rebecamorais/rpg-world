# ArcaneCorners (`arcane-corners`)

Bordas · Status: proposto, **1º grupo do Playground** · Custo: Muito baixo · Faixas: `F1`, `F2`; `F4` para o acendimento único

## 1. Identidade

- **Propósito:** ornamentos nos cantos de cards e painéis. É o jeito mais barato de "emoldurar" uma superfície sem tocar no conteúdo.
- **Descrição:** quatro peças espelhadas pousadas nos cantos internos, na cor do contexto e em opacidade baixa. Podem acender uma vez, em sequência, quando o card é ativado.
- **Usos:** spell card, `SectionCard` da ficha, card de item, retrato do personagem, diálogos de destaque.

## 2. Design visual

**Direção:** cantos de livro antigo e instrumento arcano. Pequenos, finos, nunca maiores que ~6% da largura do card.

| Variante     | Aparência                                                                                                              | Cor                                               | Uso sugerido                | Interação                          | Fallback estático                                                   |
| ------------ | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | --------------------------- | ---------------------------------- | ------------------------------------------------------------------- |
| `geometric`  | L de dois traços com um losango na quina e um tique em cada ponta                                                      | `--grimoire-ornament` (padrão `--spell-muted`)    | Listas longas, card fechado | Opacidade sobe no hover/foco       | É o próprio estado. Sem asset: colchete em L de bordas CSS (REF-15) |
| `runic`      | Círculo cortado por um losango na quina, com braços e marcas de grau; pode levar uma runa da Noto Sans Runic no centro | Igual                                             | Grimório arcano, magias     | Igual                              | `geometric`                                                         |
| `ornamental` | L com voluta na quina e uma folha em cada braço, estilo manuscrito iluminado                                           | Igual                                             | Card aberto, ficha, diário  | Igual; desenho único ao abrir (F4) | `geometric`                                                         |
| `filigree`   | Filigrana metálica fina de arabescos e espirais                                                                        | `--grimoire-ornament` do tema (ouro velho, prata) | Item lendário, retrato      | Igual                              | `ornamental`                                                        |

**Acendimento (`flare`):** comportamento opcional de qualquer variante. Os quatro cantos acendem um após o outro, **uma vez** (atrasos 0/0,12/0,24/0,36 s), quando o pai sinaliza a ativação (padrão da REF-38, sem o loop).

**Desenho único (`draw`):** só em `ornamental`/`filigree` no card aberto: o traço se desenha uma vez por `stroke-dashoffset` (REF-01, REF-86). Exige o SVG inline em vez da máscara, então é `F2`.

**Comportamento de cor:** só tokens. O "metálico" do `filigree` vem da cor do tema, sem gradiente nem filtro.

**Temas:** `legacy` desligado. `arcane-scholar`: `runic`. `ancient-manuscript` e `wildwood-codex`: `ornamental`. `shadow-archive`: `geometric`. `celestial-codex`: `runic`.

## 3. Proposta técnica

**CSS + SVG.** Nenhuma dependência nova.

- **API de variáveis** inspirada na REF-15: `--grimoire-corner-size`, `--grimoire-corner-thickness`, `--grimoire-corner-inset`.
- **Implementação A (preferida, 0 nós):** dois pseudo-elementos, cada um com duas camadas de `mask-image` posicionadas em dois cantos. Como a máscara não espelha sozinha, os 4 cantos exigem **4 versões do asset** (geradas no build a partir do canto superior esquerdo, ou embutidas como data-URI com `transform` no próprio SVG).
- **Implementação B (fallback, +5 nós):** `<span aria-hidden>` com 4 filhos posicionados e espelhados por `transform: scale(±1, ±1)`. Usada quando o elemento já gasta os dois pseudo-elementos (ex.: junto com `runic-border`).
- **Sem asset (`geometric` provisório):** 4 colchetes de bordas CSS (REF-15). Serve até a arte chegar.
- **Tamanho:** `--grimoire-corner-size: clamp(12px, 6%, 28px)`.
- **`flare`:** `@keyframes` de `opacity` com `animation-delay` por canto e `iteration-count: 1`, disparado por `data-flare`.
- **Por que não `border-image`:** fica preso ao `border-width`, ignora o `border-radius` e não deixa o canto entrar no card.

**Estratégia de estilo:** `@utility enchant-corners` com `data-corners="runic"` etc. O componente React só aplica classe e atributos.

**Pontos de integração:** `SpellCard.tsx` (`src/frontend/components/character/spells/spell-card/SpellCard.tsx`): o `<article>` não usa pseudo-elementos hoje (verificado), então a implementação A cabe; a faixa lateral `bg-spell w-1` ocupa a borda esquerda, e o canto esquerdo precisa de recuo (`--grimoire-corner-inset` maior à esquerda). `src/frontend/components/ui/section-card.tsx` para a ficha.

## 4. API proposta

```ts
type ArcaneCornersVariant = 'geometric' | 'runic' | 'ornamental' | 'filigree';

interface ArcaneCornersProps {
  variant?: ArcaneCornersVariant; // default 'geometric'
  /** Which corners to draw; 'top' suits headers attached to the top edge. */
  corners?: 'all' | 'top' | 'bottom' | 'diagonal'; // default 'all'
  size?: 'sm' | 'md' | 'lg'; // maps to --grimoire-corner-size
  /** Bumping this key plays the staggered one-shot flare. */
  flareKey?: string | number;
  /** Draws the stroke once on mount (ornamental/filigree, expanded surfaces only). */
  drawOnMount?: boolean;
  asChild?: boolean;
  className?: string;
  children: React.ReactNode;
}
```

## 5. Personalização

| Propriedade           | Token                         | Padrão                                                                   |
| --------------------- | ----------------------------- | ------------------------------------------------------------------------ |
| Cor                   | `--grimoire-ornament`         | `var(--spell-muted)` / `var(--character-muted)` / `var(--primary-muted)` |
| Cor ativa             | `--grimoire-ornament-active`  | `var(--spell-flare)`                                                     |
| Tamanho               | `--grimoire-corner-size`      | `clamp(12px, 6%, 28px)`                                                  |
| Espessura (sem asset) | `--grimoire-corner-thickness` | `1.5px`                                                                  |
| Recuo                 | `--grimoire-corner-inset`     | `6px` (dentro do `rounded-xl`)                                           |
| Opacidade             | `--grimoire-ornament-opacity` | `0.6`; `1` no hover/foco                                                 |
| Asset                 | `--grimoire-corner-mask`      | definido pelo tema; `none` desliga                                       |

## 6. Desempenho

- **DOM:** +0 (A) ou +5 nós (B).
- **Pintura:** máscaras rasterizadas uma vez por tamanho; o hover muda só `opacity`.
- **SVG:** 1 arquivo por variante, ≤ 2 KB (`filigree` ≤ 2,5 KB), em cache para todas as instâncias. `drawOnMount` usa SVG inline (~10 nós) só no card aberto.
- **Animação:** nenhuma em repouso. `flare` = 4 animações de `opacity` (compositor), uma vez. `draw` = `stroke-dashoffset`, uma vez, `F2`.
- **Várias instâncias:** seguro em `F1`; com `content-visibility: auto` no `SpellCard`, cards fora da tela nem pintam.
- **Celular:** o tamanho mínimo de 12 px mantém o desenho legível; testar a 360 px de largura.
- **Movimento reduzido:** `flare` e `draw` mostram direto o estado final.
- **Custo:** Muito baixo.
- **Benchmark (`/dev/grimoire`):** 60 cards com `runic` + `runic-border` `hover-glow`: rolagem de 5 s com CPU 4×, p95 ≤ 16,7 ms, nós extras por card ≤ 4; `flare` em 10 cards: 0 frames > 50 ms.

## 7. Acessibilidade

- Decorativo: pseudo-elementos ou `<span aria-hidden="true">`. Nada é lido.
- Não interfere no foco nem no `focus-ring` (o recuo mantém o outline visível).
- **Contraste:** decorativo, sem exigência; manter opacidade de repouso ≥ 0,4 para não parecer sujeira no tema claro.
- **`forced-colors: active`:** os cantos somem (`display: none`).
- **Movimento:** só animações únicas, desligadas em movimento reduzido.

## 8. Compatibilidade

| Superfície            | Uso                    | Variante                          |
| --------------------- | ---------------------- | --------------------------------- |
| `spell-card-compact`  | Sim                    | `geometric`/`runic`, tamanho `sm` |
| `spell-card-expanded` | Sim                    | qualquer; `flare` ao preparar     |
| `spellbook-page`      | Cabeçalho da página    | `ornamental`, `corners="top"`     |
| `character-sheet`     | `SectionCard`, retrato | `ornamental`/`filigree`           |
| `inventory-card`      | Itens mágicos          | `filigree` para lendário          |
| `campaign`            | Diário, NPC            | `ornamental`                      |

## 9. Assets

Os prompts de geração ficam fora do repositório. Todos desenhados para o canto **superior esquerdo**.

- `arcane-corners/geometric.svg`: L com losango na quina e tiques nas pontas (antes `minimal.svg`).
- `arcane-corners/runic.svg`: círculo cortado por losango, braços com marcas de grau (antes `glyph.svg`).
- `arcane-corners/ornamental.svg`: L com voluta e folhas (antes `ancient.svg`).
- `arcane-corners/filigree.svg`: filigrana de arabescos.

## 10. Referências

| ID     | Nome               | URL                                                                                                   | Fonte   | Tecnologia                                     | Licença       | Código?          | Relevância                    | Adaptação                                          |
| ------ | ------------------ | ----------------------------------------------------------------------------------------------------- | ------- | ---------------------------------------------- | ------------- | ---------------- | ----------------------------- | -------------------------------------------------- |
| REF-15 | Corner Frame       | https://21st.dev/@kevingirelli/components/corner-frame                                                | 21st    | 4 spans com bordas, API de variáveis CSS       | Não declarada | Só inspiração    | API e fallback sem asset      | Mesma API; desenho por máscara em vez de colchetes |
| REF-38 | Focus Frame Border | https://21st.dev/@shadcnspace/components/shine-border-06                                              | 21st    | Opacidade com atraso por canto + `drop-shadow` | Não declarada | Só inspiração    | Acendimento em sequência      | Uma vez, sem filtro                                |
| REF-01 | Gatsby Frame       | https://github.com/isas1/forever-ai-components/blob/main/infinite/art-deco/06-gatsby-frame.html       | forever | SVG `stroke-dashoffset`, cantos simétricos     | MIT           | **Reutilizável** | Desenho único dos cantos      | `drawOnMount` no card aberto                       |
| REF-86 | Vine Grow          | https://github.com/isas1/forever-ai-components/blob/main/infinite/art-nouveau/01-vine-grow.html       | forever | Traço SVG que se desenha                       | MIT           | **Reutilizável** | Floreio `ornamental`          | Sem o filtro                                       |
| REF-87 | The Trellis        | https://github.com/isas1/forever-ai-components/blob/main/infinite/morris/06-the-trellis.html          | forever | Treliça SVG                                    | MIT           | **Reutilizável** | Motivo do `filigree`          | Recortar um canto da treliça                       |
| REF-07 | Gothic Lancet      | https://github.com/isas1/forever-ai-components/blob/main/infinite/stained-glass/02-gothic-lancet.html | forever | Arco gótico em SVG                             | MIT           | **Reutilizável** | Forma de moldura `ornamental` | Só a curva do arco, estática                       |

## 11. Questões em aberto

- Implementação A com 4 cantos espelhados em 2 pseudo-elementos é viável sem 4 arquivos? Decidir no Playground entre "4 arquivos gerados" e implementação B.
- O canto esquerdo convive com a faixa lateral colorida do `SpellCard`? Alternativa: só cantos da direita (`corners="diagonal"` adaptado) no card fechado.
- `runic` com uma runa da fonte no centro fica legível a 12 px? Se não, só a forma geométrica.
