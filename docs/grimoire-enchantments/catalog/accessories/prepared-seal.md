# PreparedSeal (`prepared-seal`)

Categoria: Acessórios · Status: proposto (fora do primeiro grupo do Playground) · Faixas: `F1` (estático), `F4` (ao mudar de estado) · Custo: Baixo

## 1. Identidade

- **Propósito:** um selo que marca um item como escolhido ou ativo: magia preparada, item equipado ou sintonizado, missão aceita.
- **Descrição:** um selo redondo pequeno, preso ao canto ou ao lado do título. Pode ser lacre de cera, carimbo arcano, glifo aceso ou um marcador mínimo.
- **Usos:** magia preparada no grimório, item equipado, condição ativa, entrada concluída do diário.

**A semântica é genérica.** O componente recebe `state: 'on' | 'off'`. Quem usa decide o que "on" significa (preparada em D&D, equipada, sintonizada…). Nenhuma regra de sistema entra no componente.

**Verificado no repositório:**

- `PrepareSpellAction` e `LearnSpellAction` (`src/frontend/components/character/spells/spell-card/parts/SpellQuickAction.tsx`) são botões de 40 px com tooltip e `aria-label`.
- O `SpellCard` só mostra o `PrepareSpellAction` para magias de nível > 0.

O PreparedSeal **não substitui** esses botões. Ele decora o card, ou fica dentro do botão no lugar do ícone. O botão continua dono do rótulo e passa a ter `aria-pressed` (proposta).

## 2. Visual

**Direção:** marca de chancela, como num documento oficial do grimório. Em repouso, é estática. Só se mexe no instante em que o estado muda.

| Variante        | Aparência                                                                                    | Cor                                                                        | Uso sugerido                                                                    | Interação (só ao virar `on`)                                                                                       | Fallback estático |
| --------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------- |
| `wax`           | Lacre de cera com borda irregular e sigilo em baixo-relevo (2 tons: corpo + relevo)          | Corpo em `--spell-color` ou `--character-color`; relevo e sigilo em `*-on` | Magia preparada, carta selada; temas `ancient-manuscript` e `wildwood-codex`    | Carimbo: entra girando −8° e com escala 1,15, e assenta em 0° e escala 1 (180 ms, uma vez), como o selo da REF-107 | Lacre parado      |
| `arcane-stamp`  | Carimbo de tinta: anel serrilhado com glifo no centro e rótulo curvo opcional, inclinado −6° | Traço em `*-flare`, sem preenchimento                                      | Missão concluída, item identificado; temas `arcane-scholar` e `celestial-codex` | Mesmo carimbo                                                                                                      | Igual, parado     |
| `glowing-glyph` | Glifo fino num anel, com halo suave (`box-shadow` estático)                                  | `*-flare` + `*-glow`                                                       | Item sintonizado, buff ativo; temas `elemental-archive` e `shadow-archive`      | Um pulso único de `box-shadow` (REF-56) ou um `SigilPulse` `single-pulse`                                          | Sem halo          |
| `minimal`       | Ponto ou anel de 8 px em CSS puro                                                            | `*-flare`                                                                  | Lista compacta, celular; tema `legacy`                                          | Nenhuma                                                                                                            | Igual             |

O estado `off` não desenha nada (padrão) ou mostra um contorno apagado (`showOff`) em listas onde a posição vazia ajuda a ler a fileira.

**Temas:** o preset escolhe a variante padrão. O `legacy` não mostra selo: o ícone do botão continua sendo a pista.

## 3. Proposta técnica

**CSS + SVG, num componente React mínimo.**

- **Máscaras de uma cor:** `wax`, `arcane-stamp` e `glowing-glyph` são SVGs de uma cor usados como `mask-image` sobre `background-color` de token. Nenhum arquivo leva cor fixa.
- **`wax`:** usa **duas** máscaras (`wax-body`, `wax-relief`) em dois `span`s, para ter dois tons.
- **`arcane-stamp`:** a borda serrilhada vem do asset (ideia da REF-54). O rótulo curvo opcional é um `<svg>` inline com `<textPath>`, com ids gerados por `useId`. A REF-54 tem ids fixos, que colidem com várias instâncias.
- **`minimal`:** só CSS (`border-radius`, `border`).
- **Sigilo do centro:** vem do `sigil` (um ícone do sprite game-icons, REF-33, como o da escola) ou de um asset do `sigil-watermark`.
- **Animação só na mudança, nunca ao montar:**
  - a regra existe só em `[data-state='on'][data-animate]`;
  - o componente compara o estado com o anterior num `ref` e grava `data-animate` direto no nó, num `useLayoutEffect`, sem `setState`;
  - remove o atributo no `animationend`.

  É o padrão `data-active`/`data-fading` da REF-35, simplificado. Só usa `@keyframes` com `transform` e `opacity`.

```tsx
interface PreparedSealProps {
  state: 'on' | 'off';
  variant?: 'wax' | 'arcane-stamp' | 'glowing-glyph' | 'minimal'; // default: the theme's, else 'minimal'
  tone?: 'spell' | 'character' | 'primary' | 'success';
  sigil?: string; // game-icons id or a sigil asset id (D&D passes the school, for example)
  label?: string; // optional curved text for 'arcane-stamp' (decorative, aria-hidden)
  showOff?: boolean; // ghost outline when off
  animateOnChange?: boolean; // default true
  size?: 'sm' | 'md'; // 16 / 24 px
  className?: string;
}

// The button stays the source of truth and of the accessible label.
<PreparedSeal
  state={spell.isPrepared ? 'on' : 'off'}
  variant="wax"
  tone="spell"
  sigil={schoolIcon}
/>;
```

- **Estilos:** `@utility grimoire-seal-*` em `app/globals.css` (ou `grimoire.css`), só com tokens.
- **Dependências:** nenhuma.
- **Pontos de integração:**
  - `parts/SpellQuickAction.tsx` (`PrepareSpellAction`: o selo no lugar do ícone, ou ao lado);
  - `SpellCard.tsx` (enfeite no canto);
  - inventário (equipado/sintonizado);
  - a ficha (condições ativas).

## 4. Personalização

- **Props:** `variant`, `tone`, `sigil`, `label`, `size`, `showOff`, `animateOnChange`.
- **Tema:** variante padrão (no preset), `--grimoire-seal-tilt` (inclinação do `arcane-stamp`) e `--grimoire-glow-strength` (força do halo do `glowing-glyph`; 0 desliga).

## 5. Desempenho

| Aspecto            | Avaliação                                                                                                                                                        |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DOM                | 1 `span` (`minimal`, `arcane-stamp`, `glowing-glyph`), 2 no `wax`, +1 `<svg>` se tiver `label`                                                                   |
| Pintura            | Máscara pequena (≤ 24 px). O halo do `glowing-glyph` é `box-shadow` estático, sem `filter: blur`                                                                 |
| Animação           | ≤ 180 ms, só ao mudar de estado, com `transform`/`opacity`. O pulso do `glowing-glyph` anima `box-shadow` uma vez, numa área de 24 px, o que é aceitável em `F4` |
| SVG                | 2 a 4 arquivos de 1 a 2 KB, cacheados como URL                                                                                                                   |
| Várias instâncias  | Seguro em 60 cards (`F1`); só o selo acionado anima (`F4`)                                                                                                       |
| Celular            | Sem custo extra; `size="sm"` no card compacto                                                                                                                    |
| Movimento reduzido | Sem carimbo e sem pulso (regra global). Fica o selo já assentado                                                                                                 |

**Benchmark no `/dev/grimoire`:**

- alternar 20 magias seguidas com CLS 0 (`PerformanceObserver('layout-shift')`) e sem frames acima de 50 ms;
- o painel Layers deve terminar com o mesmo número de camadas do início.

## 6. Acessibilidade

- O selo é `aria-hidden="true"`, inclusive o rótulo curvo. O estado é anunciado pelo botão (`aria-pressed`, rótulo "Preparar"/"Despreparar") ou por um `sr-only` no cabeçalho ("Preparada").
- Forma, não só cor: `on` tem selo, `off` não tem (ou tem contorno). Isso cumpre a WCAG 1.4.1.
- Contraste do selo como objeto gráfico: 3:1 contra o card. O `*-flare` garante isso nos testes de contraste.
- `forced-colors`: as máscaras viram `CanvasText`, e o selo continua visível como forma. O halo some.
- Não recebe foco. Dentro do botão, o `focus-ring` é do botão.

## 7. Compatibilidade

| Superfície            | Suporte                         | Nota                                            |
| --------------------- | ------------------------------- | ----------------------------------------------- |
| `spell-card-compact`  | `minimal`, `wax` (`sm`)         | Junto do nome ou dentro do `PrepareSpellAction` |
| `spell-card-expanded` | todas                           |                                                 |
| `spellbook-page`      | todas                           | Lista de magias preparadas                      |
| `character-sheet`     | `glowing-glyph`, `minimal`      | Condições e buffs ativos                        |
| `inventory-card`      | `arcane-stamp`, `glowing-glyph` | Equipado/sintonizado                            |
| `campaign`            | `arcane-stamp`                  | Missão concluída                                |

## 8. Assets

Os prompts de geração ficam fora do repositório.

- `prepared-seal/wax-body.svg`: silhueta sólida do lacre (borda irregular), máscara do corpo.
- `prepared-seal/wax-relief.svg`: anel interno com o espaço do sigilo, máscara do relevo.
- `prepared-seal/arcane-stamp.svg`: anel serrilhado duplo com marcas de tinta falhada. É o antigo `stamp-ring.svg`, renomeado.
- `prepared-seal/glowing-glyph.svg`: círculo fino com 4 marcas cardeais e pontos nas diagonais. É o antigo `glyph-ring.svg`, renomeado.

## 9. Referências

**Lacuna:** nenhuma fonte tem um lacre de cera de verdade. O `wax` é montado com a arte da dona, o disco serrilhado (REF-54), o halo de raios (REF-95) e o carimbo que entra uma vez (REF-107).

| Ref     | Nome                                                                                                                                     | Fonte               | Tecnologia                                      | Licença · código                                          | Relevância e adaptação                                         |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ----------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------- |
| REF-107 | [Swipe Card Stack](https://github.com/isas1/forever-ai-components/blob/main/infinite/ui-microinteractions/05-swipe-card-stack.html)      | forever · isas1     | CSS + WAAPI; selo "LIKE/NOPE"                   | MIT · **código reutilizável** com aviso                   | Carimbo que entra girando e escalando e assenta, uma vez       |
| REF-54  | [Stamp](https://21st.dev/@designali-in/components/stamp)                                                                                 | 21st · designali-in | SVG estático: círculo serrilhado + `<textPath>` | não declarada · **só inspiração**                         | Borda serrilhada e rótulo curvo do `arcane-stamp`, com `useId` |
| REF-56  | [Pulsating Button](https://magicui.design/docs/components/pulsating-button)                                                              | Magic UI            | keyframe de `box-shadow` com `oklch(from …)`    | MIT · **código reutilizável** com aviso                   | Pulso **único** do `glowing-glyph` (sem o loop)                |
| REF-14  | [Neon Glow Pulse](https://github.com/isas1/forever-ai-components/blob/main/infinite/buttons/05-neon-glow-pulse.html)                     | forever · isas1     | pulso de `box-shadow` em CSS                    | MIT · **código reutilizável** com aviso                   | Mesmo pulso, alternativa                                       |
| REF-95  | [Sunburst Fan](https://github.com/isas1/forever-ai-components/blob/main/infinite/art-deco/01-sunburst-fan.html)                          | forever · isas1     | medalhão em SVG com raios                       | MIT · **código reutilizável** com aviso                   | Halo de raios atrás do `wax`/`glowing-glyph`, estático         |
| REF-35  | [Animated Border Beam](https://21st.dev/@hyperiux/components/border-beam)                                                                | 21st · hyperiux     | `data-active`/`data-fading`                     | não declarada · **só inspiração**                         | Padrão de entrada e saída do estado (só o padrão)              |
| REF-109 | Denied Buzz / Checklist Complete (`infinite/feedback-states/09-denied-buzz.html`, `infinite/progress-status/12-checklist-complete.html`) | forever · isas1     | feedback de carimbo (faixa medium)              | MIT · **código reutilizável** com aviso                   | Ritmo do carimbo. Verificação parcial                          |
| REF-33  | [game-icons.net](https://game-icons.net)                                                                                                 | game-icons          | sprite SVG                                      | CC BY 3.0 · pode usar (falta a atribuição no `NOTICE.md`) | Sigilos de escola já no sprite                                 |

## 10. Questões em aberto

- O selo vai dentro do `PrepareSpellAction` (substituindo o ícone) ou num canto separado do card? O primeiro economiza espaço; o segundo deixa o botão neutro.
- O `wax` com 2 máscaras vale o segundo `span`, ou um tom só basta?
- O rótulo curvo do `arcane-stamp` (ex.: o nome da escola) cabe em 24 px? Talvez só a partir de `md` ou no card aberto.
