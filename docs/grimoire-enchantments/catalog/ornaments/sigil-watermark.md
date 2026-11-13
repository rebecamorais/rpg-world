# SigilWatermark (`sigil-watermark`)

Ornamentos · Status: proposto, **1º grupo do Playground** · Custo: Muito baixo · Faixas: `F2` (card aberto, diálogo), `F3` (página)

## 1. Identidade

- **Propósito:** um sigilo mágico grande e quase transparente atrás do conteúdo, que dá identidade à superfície sem atrapalhar a leitura.
- **Descrição:** um desenho de simetria radial (círculo arcano, órbitas celestes, diagrama alquímico, anel botânico) num canto ou no centro, a 6–10% de opacidade, apagado antes do texto.
- **Usos:** card de magia aberto, cabeçalho da ficha, página do grimório, diálogo de item mágico.

**Verificado:** o `SpellVFX` (`spell-card/SpellCard.tsx`) já põe o ícone principal da magia a 128 px e 10% de opacidade no canto superior direito do card aberto, sob uma máscara que apaga antes do texto. O SigilWatermark generaliza isso: primeiro com o próprio ícone (o fallback de hoje), depois com os sigilos da dona.

## 2. Design visual

**Direção:** diagrama de grimório gravado em baixo-relevo. Linhas finas, sem preenchimento, sem cor própria.

| Variante     | Aparência                                                                | Cor                   | Uso sugerido                            | Interação                         | Fallback estático                           |
| ------------ | ------------------------------------------------------------------------ | --------------------- | --------------------------------------- | --------------------------------- | ------------------------------------------- |
| `arcane`     | Três círculos concêntricos, heptagrama inscrito, glifos na faixa externa | `--spell-color` a ~8% | Magia aberta (padrão), `arcane-scholar` | Desenho único ao abrir (opcional) | O ícone da magia a 10% (o `SpellVFX` atual) |
| `celestial`  | Sol central, órbita elíptica, lua crescente e estrelas                   | Igual                 | `celestial-codex`, adivinhação          | Igual                             | Igual                                       |
| `alchemical` | Triângulos sobrepostos dentro de círculo e quadrado                      | Igual                 | Transmutação, itens, `shadow-archive`   | Igual                             | Igual                                       |
| `botanical`  | Anel de ramos e folhas com nó central                                    | Igual                 | `wildwood-codex`, druidas               | Igual                             | Igual                                       |

**Desenho único (`draw`):** no card aberto, o traço do sigilo pode se desenhar uma vez (REF-11), só sem movimento reduzido. Exige SVG inline, então é opcional.

**Comportamento de cor:** a cor vem de `background-color` atrás da máscara: `--spell-color` no card, `--character-color` na ficha, `--grimoire-ornament` nos temas que pedem metal.

**Temas:** `legacy` mantém o ícone gigante. `arcane-scholar`: `arcane`. `celestial-codex`: `celestial`. `wildwood-codex`: `botanical`. `shadow-archive`: `alchemical`.

## 3. Proposta técnica

**SVG como máscara, num pseudo-elemento ou div único.** Nenhuma dependência nova.

- **Desenho:** `background-color: var(--grimoire-sigil-color); mask: var(--grimoire-watermark-mask) no-repeat center / contain;` (técnica da REF-26: a cor vem do token, o SVG é só forma).
- **Apagar antes do texto:** uma segunda camada de máscara com gradiente (vinheta radial, REF-39, ou o `linear-gradient(to bottom, black, transparent 45%)` que o `SpellVFX` já usa), combinada com `mask-composite: intersect`.
- **Fallback:** sem asset, renderiza o `AppIcon variant="game"` do sprite (o comportamento de hoje).
- **Rotação:** referências que giram (REF-05, REF-92, REF-93) entram **congeladas**. Uma rotação lenta só é aceitável em `F3`, numa instância, sem movimento reduzido; fica fora do padrão.
- **`draw`:** SVG inline com `stroke-dasharray`/`stroke-dashoffset` em `@keyframes`, uma iteração; só no card aberto.

**Estratégia de estilo:** `@utility enchant-sigil` com `data-sigil="arcane"` e `data-placement`. O componente React é um `<div aria-hidden>`.

**Pontos de integração:** `SpellVFX` em `src/frontend/components/character/spells/spell-card/SpellCard.tsx` (troca o `<div className="absolute -top-6 -right-6 opacity-10"><AppIcon …/></div>` pelo SigilWatermark, mantendo a máscara do contêiner); cabeçalho da ficha (`CharacterSheetShell`).

## 4. API proposta

```ts
type SigilVariant = 'arcane' | 'celestial' | 'alchemical' | 'botanical';

interface SigilWatermarkProps {
  /** Sigil art; when the asset is missing, falls back to `icon`. */
  sigil?: SigilVariant; // default 'arcane'
  /** Game-icon fallback (today's SpellVFX behavior). */
  icon?: string;
  placement?: 'top-right' | 'top-left' | 'center' | 'bottom-right'; // default 'top-right'
  size?: 'md' | 'lg' | 'xl'; // 96 / 128 / 192px
  /** Draws the stroke once on mount (expanded surfaces only). */
  drawOnMount?: boolean;
  className?: string;
}
```

Quem escolhe a variante é o tema ou um mapeamento externo (ex.: escola → sigilo); o componente não conhece sistemas de RPG.

## 5. Personalização

| Propriedade | Token                       | Padrão                                          |
| ----------- | --------------------------- | ----------------------------------------------- |
| Cor         | `--grimoire-sigil-color`    | `var(--spell-color)` / `var(--character-color)` |
| Opacidade   | `--grimoire-sigil-opacity`  | `0.08` (escuro), `0.06` (claro)                 |
| Asset       | `--grimoire-watermark-mask` | definido pelo tema; `none` usa o ícone          |
| Tamanho     | `size`                      | `lg` (128 px), como o `SpellVFX`                |
| Vinheta     | `--grimoire-vignette`       | o gradiente atual do `SpellVFX`                 |

## 6. Desempenho

- **DOM:** 1 nó (ou 0, se for pseudo-elemento do contêiner). `drawOnMount` acrescenta um SVG inline de ~20–40 nós, só no card aberto.
- **Pintura:** uma máscara rasterizada uma vez por tamanho; nenhuma animação em repouso.
- **SVG:** ≤ 2 KB por sigilo, em cache. Pode ser detalhado, porque aparece grande, mas sem traço menor que 1 unidade.
- **Várias instâncias:** pensado para `F2` (um card aberto por vez) e `F3` (uma vez por página). Mesmo assim, é barato o bastante para cards de ficha.
- **Celular:** em telas estreitas, `size="md"` e `placement="top-right"` para não ficar atrás do texto.
- **Movimento reduzido:** `drawOnMount` mostra o sigilo pronto.
- **Custo:** Muito baixo.
- **Benchmark (`/dev/grimoire`):** abrir e fechar 20 cards seguidos com `arcane` + `drawOnMount`: 0 frames > 50 ms, CLS 0; comparar com o `SpellVFX` atual.

## 7. Acessibilidade

- Decorativo: `aria-hidden="true"`, `pointer-events: none`.
- **Legibilidade:** a opacidade máxima é 10%, e a vinheta apaga o sigilo antes da descrição. Critério: o axe não pode apontar perda de contraste no texto do card aberto, nos dois temas, com cores de magia extremas (amarelo-claro, azul-marinho).
- **`forced-colors: active`:** some.
- **Movimento:** só o desenho único, desligado em movimento reduzido.

## 8. Compatibilidade

| Superfície            | Uso                                | Variante                   |
| --------------------- | ---------------------------------- | -------------------------- |
| `spell-card-compact`  | Não (o card fechado não tem fundo) | —                          |
| `spell-card-expanded` | Sim (substitui o ícone gigante)    | conforme o tema            |
| `spellbook-page`      | Sim, um sigilo grande no fundo     | `arcane`/`celestial`, `xl` |
| `character-sheet`     | Cabeçalho                          | conforme o tema            |
| `inventory-card`      | Item mágico aberto                 | `alchemical`               |
| `campaign`            | Diário, NPC                        | conforme o tema            |

## 9. Assets

Os prompts de geração ficam fora do repositório.

- `sigil-watermark/arcane.svg` (antes `arcane-circle.svg`): círculos concêntricos, heptagrama, glifos na faixa.
- `sigil-watermark/celestial.svg`: sol, órbita, lua crescente e estrelas.
- `sigil-watermark/alchemical.svg`: triângulos sobrepostos em círculo e quadrado.
- `sigil-watermark/botanical.svg`: anel de ramos com nó central.

O antigo `seal.svg` saiu desta lista.

## 10. Referências

| ID     | Nome                 | URL                                                                                                          | Fonte    | Tecnologia                       | Licença       | Código?          | Relevância                         | Adaptação                                |
| ------ | -------------------- | ------------------------------------------------------------------------------------------------------------ | -------- | -------------------------------- | ------------- | ---------------- | ---------------------------------- | ---------------------------------------- |
| REF-92 | Kaleidoscope Mandala | https://github.com/isas1/forever-ai-components/blob/main/infinite/stained-glass/04-kaleidoscope-mandala.html | forever  | SVG + rotação                    | MIT           | **Reutilizável** | Composição de `arcane`/`celestial` | Congelado, 6–10%, `currentColor`         |
| REF-93 | Gilded Pinwheel      | https://github.com/isas1/forever-ai-components/blob/main/infinite/art-deco/09-gilded-pinwheel.html           | forever  | SVG, estrela de 8 pontas         | MIT           | **Reutilizável** | Base geométrica                    | Congelado                                |
| REF-94 | Orrery Rings         | https://github.com/isas1/forever-ai-components/blob/main/infinite/clockwork/04-orrery-rings.html             | forever  | SVG, anéis tracejados            | MIT           | **Reutilizável** | `celestial`                        | Sem filtro, estático                     |
| REF-96 | Gear Schematic       | https://github.com/isas1/forever-ai-components/blob/main/infinite/blueprint/02-gear-schematic.html           | forever  | SVG em traço de gravura          | MIT           | **Reutilizável** | `alchemical`                       | Só o estilo de traço                     |
| REF-05 | Radial Grille        | https://github.com/isas1/forever-ai-components/blob/main/infinite/art-deco/07-radial-grille.html             | forever  | Anéis e raios girando            | MIT           | **Reutilizável** | `arcane`                           | Estático                                 |
| REF-26 | Wave Separator       | https://21st.dev/@serafimcloud/components/wave-separator                                                     | 21st     | `currentColor` + máscara com SVG | Não declarada | Só inspiração    | Técnica de cor por token           | A mesma ideia, com o sigilo como máscara |
| REF-39 | Dot Pattern          | https://magicui.design/docs/components/dot-pattern                                                           | Magic UI | Máscara de vinheta radial        | MIT           | **Reutilizável** | Apagar antes do texto              | Combinada com a máscara do sigilo        |
| REF-11 | Stroke Draw-On       | https://github.com/isas1/forever-ai-components/blob/main/infinite/svg-animations/01-stroke-draw.html         | forever  | SVG traço + rAF                  | MIT           | **Reutilizável** | `drawOnMount`                      | Em CSS, sem rAF                          |

## 11. Questões em aberto

- O sigilo substitui o ícone gigante do `SpellVFX` em todos os temas ou só nos temas Grimoire? A sugestão é só nos temas; o `legacy` fica com o ícone.
- Variante por escola (mapeamento externo) ou por tema? Os dois são possíveis; decidir no Playground qual lê melhor.
- `drawOnMount` vale o SVG inline? Se o ganho for pequeno, fica só a máscara.
