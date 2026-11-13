# EnchantedHover (`enchanted-hover`)

Categoria: Interações · Status: proposto. A variante `border-glow` entra no primeiro grupo do Playground **por meio do** `runic-border` (`hover-glow`); as outras ficam para depois · Faixas: `F1` · Custo: Baixo

## 1. Identidade

- **Propósito:** um efeito de "a superfície acorda" quando o ponteiro passa ou o teclado foca, igual em todo card clicável.
- **Descrição:** a borda acende na cor do item. Conforme a variante, uma faixa de brilho atravessa a superfície uma vez, ou uma luz radial aparece.
- **Usos:** card de magia, item da mochila, card de personagem, NPC, entrada do diário, abas do grimório.

**Verificado no repositório:**

- O `SpellCard` (`src/frontend/components/character/spells/spell-card/SpellCard.tsx`) faz `hover:border-spell-muted` com `transition-[border-color] duration-200`.
- O card inteiro é clicável por um `button` absoluto (`inset-0`), com `focus-visible:outline-spell-flare`.
- `app/globals.css` já tem o keyframe `shimmer` (`translateX(100%)`), usado no skeleton.

O EnchantedHover generaliza esse padrão para outras superfícies.

**Sobreposição com o `runic-border`:** a variante `hover-glow` do [`runic-border`](../borders/runic-border.md) **compõe** o `border-glow` daqui. Nos cards que já usam o `runic-border`, não é preciso aplicar os dois. O EnchantedHover existe sozinho para as superfícies sem borda rúnica (mochila, diário, `SectionCard`).

## 2. Visual

**Direção:** luz contida, que nunca segue o cursor. A superfície reage, mas o conteúdo não se mexe.

| Variante               | Aparência                                                                                                     | Cor                                                               | Uso sugerido                                                                   | Interação                                                                                     | Fallback estático                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| `border-glow` (padrão) | Um anel fino de luz acende **por cima** da borda, numa posição fixa: mais forte no topo e apagando para baixo | Anel em `*-flare`, com intensidade por `--grimoire-glow-strength` | Tudo; temas `arcane-scholar`, `shadow-archive`, `elemental-archive`            | `:hover` (em `@media (hover: hover)`), `:focus-visible`, `:focus-within`                      | A borda vira `*-muted` (o comportamento de hoje) |
| `surface-shimmer`      | Uma faixa diagonal de brilho atravessa o card **uma vez**                                                     | Faixa em `*-glow` com baixa opacidade                             | Item mágico, magia de nível alto; temas `celestial-codex`, `elemental-archive` | Mesmos gatilhos; a faixa começa da borda a cada entrada e não repete enquanto o ponteiro fica | Só a borda                                       |
| `gradient-highlight`   | Uma luz radial **estática** aparece no topo da superfície (fade de opacidade, sem movimento)                  | `radial-gradient` de `*-surface`                                  | Card aberto, card de personagem; temas `ancient-manuscript`, `wildwood-codex`  | Mesmos gatilhos                                                                               | Só a borda                                       |

A antiga variante `runes` saiu: acender as runas é tarefa do `runic-border` (`hover-glow`).

**Descartado de propósito:** brilho que segue o cursor (REF-20, REF-47, REF-58). Exige listener de ponteiro por card, escrita de variável a cada quadro e, em alguns casos, listener global no documento.

**Temas:** o preset escolhe a variante, e o `--grimoire-glow-strength: 0` reduz tudo ao `border-glow` sem luz (só a borda). O `legacy` é exatamente o hover de hoje.

## 3. Proposta técnica

**CSS puro: utility `enchanted-hover` + `enchanted-hover-<variant>`. Zero JS e zero nós extras.**

- **Gatilhos:** `&:focus-visible`, `&:focus-within`, `&[data-active]` e, dentro de `@media (hover: hover)`, `&:hover`. No `SpellCard`, o foco está no `button` interno, então `:focus-within` cobre o card. No toque, o hover não "gruda".
- **`border-glow`:** um `::before` com `inset: 0`, `padding: 1px` e a máscara de anel `mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); mask-composite: exclude`. É a técnica das REF-21 e REF-16. O fundo do pseudo-elemento é um `radial-gradient` **em posição fixa** (topo central), e não em `--x/--y` vindos do ponteiro. Só a `opacity` anima (0 → 1, 200 ms).
- **`surface-shimmer`:** um `::after` com a faixa diagonal e `animation: grimoire-sweep 600ms 1 both paused`. No hover ou foco, vira `animation-play-state: running` (o truque da REF-49). Ao sair, o `animation-name` é removido; ao entrar de novo, a faixa recomeça da borda. Anima só `transform`, como o `shimmer` existente e a REF-105.
- **`gradient-highlight`:** um `::before` com `radial-gradient` estático, e só a `opacity` muda.
- **Pré-requisitos:** o card precisa de `position: relative` e `overflow: hidden` (o `SpellCard` tem os dois). Os pseudo-elementos ficam em `z-0`, abaixo do conteúdo (`z-10`), com `pointer-events: none`.
- **Conflito de pseudo-elementos:** se o `runic-border` ou o `arcane-corners` já usam `::before`/`::after` no mesmo nó, o EnchantedHover vai num nó filho de fundo, que o `SpellVFX` já tem. Isso é definido no Playground.

```tsx
// CSS utility, no runtime:
<article className="spell-context enchanted-hover enchanted-hover-border-glow relative overflow-hidden ...">

// Optional typed helper (no component, no Slot): returns class names.
type EnchantedHoverVariant = 'border-glow' | 'surface-shimmer' | 'gradient-highlight';
function enchantedHover(
  variant?: EnchantedHoverVariant,
  tone?: 'spell' | 'character' | 'primary',
): string;
```

O `tone` vira a classe `enchanted-tone-<tone>`, que aponta `--enchant-color` para a família certa de tokens.

- **Estilos:** `@utility enchanted-hover*` em `app/globals.css` (ou `grimoire.css`), só com tokens.
- **Dependências:** nenhuma.
- **Pontos de integração:**
  - `SpellCard.tsx`: substitui o `hover:border-spell-muted`, com o mesmo resultado no `legacy`;
  - `src/frontend/components/ui/section-card.tsx`;
  - os cards da mochila e da lista de personagens.

## 4. Personalização

- **Tokens:** `--enchant-color` (padrão `--spell-color`), `--enchant-duration` (200 ms; `surface-shimmer` 600 ms) e `--grimoire-glow-strength` (0 a 1, multiplica a opacidade máxima).
- **Tema:** variante padrão no preset.

## 5. Desempenho

| Aspecto            | Avaliação                                                                                                                                                |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DOM                | 0 nós extras (`::before`/`::after`)                                                                                                                      |
| Pintura            | O anel e a luz radial são pintados **uma vez** e depois só mudam de `opacity`. A faixa só usa `transform`. Nada repinta o card durante a animação        |
| Animação           | Por evento, ≤ 600 ms, uma vez. Nada roda em repouso: `paused` não cria camada                                                                            |
| Memória            | Sem `will-change` permanente: 60 camadas fixas custariam memória à toa. Se o Playground mostrar engasgo, o `will-change` entra **só** dentro do `:hover` |
| Várias instâncias  | Seguro (`F1`): só um card fica em hover por vez                                                                                                          |
| Celular            | `@media (hover: hover)` desliga o hover; o foco de teclado externo continua                                                                              |
| Movimento reduzido | A faixa não corre (fica oculta). O anel e a luz radial aparecem sem transição (regra global)                                                             |

**Benchmark no `/dev/grimoire`:**

- com 60 cards, passar o ponteiro rápido pela lista inteira sem frames acima de 16 ms;
- o "Paint flashing" (painel Rendering) deve pintar só o card em foco, uma vez.

## 6. Acessibilidade

- O efeito aparece igual no `:focus-visible`. Ele **soma** ao `focus-ring` e ao `outline` existentes e nunca os substitui: o anel de foco continua sendo o indicador obrigatório.
- A luz fica abaixo do texto (`z-0`). Com `--grimoire-glow-strength` ≤ 0,6 sobre um `*-surface` que já é 90% transparente, o contraste do texto não muda. O Playground mede o pior caso nos dois temas.
- `forced-colors`: os pseudo-elementos somem (`display: none`), e a borda vira `Highlight` no foco.
- Não mexe no layout (só `opacity` e `transform`), então nada salta.
- Movimento reduzido: nenhuma faixa se move.

## 7. Compatibilidade

| Superfície            | Suporte                             | Nota                                                                |
| --------------------- | ----------------------------------- | ------------------------------------------------------------------- |
| `spell-card-compact`  | `border-glow`, `surface-shimmer`    | Se o card usa o `runic-border`, o `hover-glow` dele já basta        |
| `spell-card-expanded` | `border-glow`, `gradient-highlight` | O `SpellVFX` já ocupa o topo; a luz radial precisa combinar com ele |
| `spellbook-page`      | —                                   | Não se aplica à página                                              |
| `character-sheet`     | `border-glow`, `gradient-highlight` | `SectionCard` clicáveis                                             |
| `inventory-card`      | todas                               |                                                                     |
| `campaign`            | `border-glow`, `gradient-highlight` |                                                                     |

## 8. Assets

Nenhum. Tudo é gradiente e máscara CSS.

## 9. Referências

| Ref     | Nome                                                                                                                   | Fonte               | Tecnologia                                                              | Licença · código                                    | Relevância e adaptação                                                                |
| ------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------- | ----------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------- |
| REF-21  | [Spotlight](https://21st.dev/@kevingirelli/components/spotlight)                                                       | 21st · kevingirelli | máscara de anel com exclude + opacidade em `group-hover`/`focus-within` | não declarada · **só inspiração**                   | `border-glow`: o mesmo anel, com o brilho em **posição fixa** e sem o `onPointerMove` |
| REF-16  | [Shine Border](https://magicui.design/docs/components/shine-border)                                                    | Magic UI            | máscara `content-box` + `mask-composite: exclude`                       | MIT · **código reutilizável** com aviso             | A máscara do anel, estática                                                           |
| REF-49  | [Klyv Shimmer Button](https://21st.dev/@klyv-ui/components/klyv-shimmer-button)                                        | 21st · klyv-ui      | `animation-play-state` pausado até o hover                              | MIT (no código) · **código reutilizável** com aviso | `surface-shimmer` que sempre começa da borda (sem o blur)                             |
| REF-105 | [Skeleton Shimmer](https://github.com/isas1/forever-ai-components/blob/main/infinite/loaders/05-skeleton-shimmer.html) | forever · isas1     | faixa só em CSS, com `translate`                                        | MIT · **código reutilizável** com aviso             | Faixa do `surface-shimmer`, executada uma vez                                         |
| REF-39  | [Dot Pattern](https://magicui.design/docs/components/dot-pattern)                                                      | Magic UI            | vinheta `radial-gradient` em máscara                                    | MIT · **código reutilizável** com aviso             | Forma da luz do `gradient-highlight`                                                  |
| REF-20  | [Glowing Effect](https://ui.aceternity.com/components/glowing-effect)                                                  | Aceternity          | borda cônica mascarada no ponteiro, rAF, blur                           | Aceternity · **só inspiração**                      | O que **não** fazer                                                                   |
| REF-47  | [Spotlight Card](https://21st.dev/@jahed/components/spotlight-card)                                                    | 21st · jahed        | listener global de `pointermove` por instância                          | não declarada · **só inspiração**                   | O que **não** fazer                                                                   |

## 10. Questões em aberto

- O `surface-shimmer` no card compacto fica bonito ou chama atenção demais numa lista? Testar no Playground antes de virar padrão de algum tema.
- Quando o card tem `runic-border`, `arcane-corners` e EnchantedHover juntos, quem fica com `::before`/`::after`? A proposta é que o EnchantedHover vá para o nó de fundo do `SpellVFX`.
