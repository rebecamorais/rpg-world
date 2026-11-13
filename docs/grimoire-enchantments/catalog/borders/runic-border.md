# RunicBorder (`runic-border`)

Bordas · Status: proposto, **1º grupo do Playground** · Custo: Muito baixo (`static`, `hover-glow`) / Baixo (`active`) / Moderado (`ritual`, só por evento) · Faixas: `F1` (`static`, `hover-glow`, `active`), `F4` (volta de entrada), `F2` (`ritual`)

## 1. Identidade

- **Propósito:** contorno mágico de uma superfície, com detalhes rúnicos discretos que dizem "isto é encantado" sem competir com o conteúdo.
- **Descrição:** um anel fino desenhado só com máscara (sem nó extra), opcionalmente com um "cometa" de luz parado num canto e uma faixa curta de runas no topo. Pode acender no hover, ficar aceso num estado ativo e, em ocasiões raras, dar uma volta de luz.
- **Usos:** spell card (fechado e aberto), `SectionCard` da ficha, item mágico no inventário, card de NPC ou sessão.

## 2. Design visual

**Direção:** gravação fina em metal, não neon. A luz é rara e curta; em repouso, a borda parece entalhada.

| Variante     | Aparência                                                                                                            | Cor                                                              | Uso sugerido                                     | Interação                                                                                      | Fallback estático                      |
| ------------ | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------- | -------------------------------------- |
| `static`     | Anel de 1px desenhado por máscara, com um cometa parado (gradiente cônico num ângulo fixo) e runas opcionais no topo | anel `--grimoire-ornament-muted`, cometa e runas `--spell-muted` | Card fechado, listas longas                      | Nenhuma                                                                                        | É o próprio estado                     |
| `hover-glow` | `static` + o anel e as runas sobem para a cor cheia no hover e no foco                                               | `--spell-muted` → `--spell-flare`                                | Spell card, item clicável                        | Transição de `opacity` (200 ms) em `:hover`, `:focus-visible` e `:focus-within`                | `static` com o anel em `--spell-muted` |
| `active`     | Anel aceso de forma persistente; ao entrar no estado, **uma** volta de luz percorre a borda                          | `--spell-flare`, brilho `--spell-glow`                           | Magia preparada, item equipado, turno de combate | `data-active` liga; `data-fading` faz a saída; a volta usa `offset-path`, `iteration-count: 1` | Anel aceso, sem a volta                |
| `ritual`     | O cometa dá **um** giro completo, ou um traço tracejado corre pela borda uma vez                                     | `--spell-flare` → `--spell-glow`                                 | Card aberto ao conjurar; momento especial        | Disparado por evento (ex.: abrir a magia, lançar), ≤ 900 ms                                    | `active`                               |

**Comportamento de cor:** o componente lê só tokens. Dentro de `.spell-context`, a cor vem da magia; dentro de `.character-context`, do personagem; nos temas, `--grimoire-ornament` define o metal do anel em repouso. Nada de cor fixa.

**Temas:** `legacy` deixa a borda atual (`border-border hover:border-spell-muted`) e não liga o componente. `arcane-scholar` usa `static` com runas; `shadow-archive` usa `hover-glow` com runas que só aparecem no hover; `elemental-archive` usa `active` na cor do elemento.

**Runas:** duas fontes, decididas pela dona.

1. **Agora:** texto em **Noto Sans Runic** (REF-84), runas reais do Futhark Antigo, puramente decorativas, com `aria-hidden`. Nunca formam palavra com sentido; a sequência é fixa ou gerada (ver `rune-divider`).
2. **Depois:** a arte de runas inventadas da dona (`runic-border/segment.svg`) como alternativa, trocada pelo token `--grimoire-rune-source`.

## 3. Proposta técnica

**CSS + SVG/texto.** Nenhuma dependência nova.

- **Anel (`static`):** um `::before` com `padding: var(--grimoire-border-width)` e a máscara de "só a borda": `mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); mask-composite: exclude;` (técnica da REF-16, MIT). O fundo do pseudo-elemento é um `conic-gradient` **parado** num ângulo fixo, com paradas em `color-mix(in srgb, var(--spell-color) 4%, transparent)` em vez de `transparent` (evita a faixa cinza, REF-36).
- **Runas:** um `::after` com o texto das runas em `content` (Noto Sans Runic, `font-size` pequeno, `letter-spacing`), posicionado no centro da borda superior sobre um "corte" do anel. Com a arte da dona, o `::after` passa a ser um `mask-image` do SVG.
- **`hover-glow`:** só `opacity` e cor do pseudo-elemento, em `@media (hover: hover)` + `:focus-visible`/`:focus-within`. O padrão de "brilho pausado até o hover" (REF-49) vale se houver varredura.
- **`active`:** atributo `data-active` (e `data-fading` na saída, padrão da REF-35). A volta de entrada é um `::after` pequeno em `offset-path: rect(0 auto auto 0 round var(--radius))` com `@keyframes { to { offset-distance: 100% } }` e `animation-iteration-count: 1` (técnica da REF-34, MIT; REF-18). Navegador sem `offset-path: rect()` (`@supports`) fica só com o anel aceso.
- **`ritual`:** um quadrado de 200% com `conic-gradient` girando **por `transform`** uma vez (REF-17; roda no compositor), dentro de `overflow: hidden`. Alternativa: traço tracejado que corre a borda (REF-85 convertido de SMIL para CSS). Só em `F2`.
- **Proibido aqui:** `@property --angle` em loop (repinta a cada quadro, REF-35), rAF por card, ouvintes de ponteiro, `filter: blur()`.

**Estratégia de estilo:** uma `@utility enchant-runic-border` em `app/globals.css` (ou `grimoire.css` importado por ele) com os pseudo-elementos; o componente React só aplica a classe e os `data-*`. Funciona em Server Components.

**Pontos de integração (sem alterar nada nesta fase):**

- `src/frontend/components/character/spells/spell-card/SpellCard.tsx`: o `<article>` hoje tem `border` + `hover:border-spell-muted` e a faixa lateral `bg-spell w-1`. O RunicBorder entraria como classe no `<article>`, mantendo a faixa lateral (o cometa parado fica no canto oposto, superior direito).
- `src/frontend/components/character/spells/spell-card/parts/SpellQuickAction.tsx`: `PrepareSpellAction` é quem decide `active` (via `spell.isPrepared` no pai).
- `src/frontend/components/ui/section-card.tsx`: ficha.

## 4. API proposta

```ts
type RunicBorderVariant = 'static' | 'hover-glow' | 'active' | 'ritual';

interface RunicBorderProps {
  /** 'hover-glow' is the default for interactive cards. */
  variant?: RunicBorderVariant; // default 'static'
  /** Where rune glyphs are drawn; 'none' keeps only the ring and the parked comet. */
  runes?: 'top' | 'top-bottom' | 'none'; // default 'top'
  /** Bumping this key replays the 'active' entry lap or the 'ritual' spin once. */
  playKey?: string | number;
  /** Decorates the existing surface instead of rendering a wrapper. */
  asChild?: boolean; // @radix-ui/react-slot, already installed
  className?: string;
  children: React.ReactNode;
}
```

- **Sem componente:** `className="enchant-runic-border" data-variant="hover-glow"` basta para o caso estático.
- **Sem estado interno:** o pai decide `active`. O `playKey` só reinicia a animação (troca de `key` num pseudo-span ou alternância de `data-play`), sem `useEffect`.

## 5. Personalização

| Propriedade            | Token / prop                       | Padrão                                                   |
| ---------------------- | ---------------------------------- | -------------------------------------------------------- |
| Cor do anel em repouso | `--grimoire-ornament-muted`        | `var(--spell-muted)` ou `var(--character-muted)`         |
| Cor acesa              | `--grimoire-rune-active`           | `var(--spell-flare)`                                     |
| Brilho                 | `--grimoire-glow-strength` (0–1)   | `0.25`; `0` desliga o cometa e a volta                   |
| Largura do anel        | `--grimoire-border-width`          | `1px`                                                    |
| Ângulo do cometa       | `--grimoire-comet-angle`           | `40deg` (canto superior direito, longe da faixa lateral) |
| Fonte das runas        | `--grimoire-rune-source`           | `font` (Noto Sans Runic); `art` usa o SVG da dona        |
| Raio                   | herdado (`border-radius: inherit`) | o do card                                                |

## 6. Desempenho

- **DOM:** +0 nós (dois pseudo-elementos). `ritual` usa um terceiro pseudo-elemento só enquanto toca.
- **Pintura:** `static` pinta uma vez. `hover-glow` muda só `opacity`. A volta de `active` move um pseudo-elemento pequeno (`offset-distance`), uma vez.
- **SVG:** nenhum no caso padrão (máscara feita com gradientes). Com a arte da dona, 1 arquivo ≤ 2 KB em cache.
- **Fonte:** a Noto Sans Runic com subset `runic` é um arquivo a mais, carregado uma vez. **O peso não foi medido**: medir em `/dev/grimoire`. Alternativa se pesar: carregar só no Playground e no tema que usar runas.
- **Memória:** uma textura de máscara por tamanho de card; cards de lista têm a mesma largura.
- **Várias instâncias:** `static`/`hover-glow` são seguros em `F1`. O `content-visibility: auto` do `SpellCard` (verificado) evita pintar cards fora da tela.
- **Celular:** sem hover, o `hover-glow` aparece só no foco ou no card aberto.
- **Movimento reduzido:** a volta e o giro não tocam; `active` mostra direto o anel aceso, `ritual` cai para `active`.
- **Custo:** Muito baixo / Baixo / Moderado (só `ritual`, por evento).
- **Benchmark (`/dev/grimoire`):** spellbook com 60 cards em `hover-glow`, rolagem de 5 s com CPU 4×: 0 quadros > 50 ms e p95 ≤ 16,7 ms; ativar `active` em 10 cards seguidos: CLS 0 e nenhum frame longo.

## 7. Acessibilidade

- **Decoração:** pseudo-elementos com runas não são lidos se o `content` usar o texto alternativo vazio do CSS (`content: "ᚱᚢᚾ" / ""`), como o app já faz no `SpellHeader`. Na versão com SVG, `aria-hidden` não é necessário (pseudo-elemento).
- **Foco:** o RunicBorder **não substitui** o `focus-ring`. O `hover-glow` no `:focus-visible` é reforço.
- **Contraste:** a borda é decorativa (WCAG 1.4.11 não exige). O estado `active` nunca é a **única** pista: o botão de preparar mantém `aria-pressed` e o rótulo.
- **`forced-colors: active`:** esconde cometa, runas e brilho; a borda nativa fica com `CanvasText` (padrão da REF-36).
- **Movimento:** sem loops; animações só por evento, desligadas em movimento reduzido.

## 8. Compatibilidade

| Superfície            | Uso                        | Variante                                   |
| --------------------- | -------------------------- | ------------------------------------------ |
| `spell-card-compact`  | Sim                        | `hover-glow`; `active` se preparada        |
| `spell-card-expanded` | Sim                        | `hover-glow`/`active`; `ritual` ao lançar  |
| `spellbook-page`      | Moldura opcional da página | `static` sem cometa                        |
| `character-sheet`     | Sim (`SectionCard`)        | `static` com `--character-*`               |
| `inventory-card`      | Itens mágicos              | `static`; `active` se equipado/sintonizado |
| `campaign`            | Cards de sessão e NPC      | `static`                                   |

## 9. Assets

Nenhum obrigatório: o anel é gradiente e as runas vêm da fonte. Arte opcional da dona (prompts gerados fora do repositório):

- `runic-border/segment.svg`: faixa horizontal curta de runas inventadas, alternativa à fonte.
- `runic-border/segment-vertical.svg`: a mesma faixa na vertical (pode virar rotação do horizontal; decidir no Playground).

## 10. Referências

| ID     | Nome                 | URL                                                                                                    | Fonte           | Tecnologia                                                   | Licença                         | Código?          | Relevância                            | Adaptação                                                      |
| ------ | -------------------- | ------------------------------------------------------------------------------------------------------ | --------------- | ------------------------------------------------------------ | ------------------------------- | ---------------- | ------------------------------------- | -------------------------------------------------------------- |
| REF-16 | Shine Border         | https://magicui.design/docs/components/shine-border                                                    | Magic UI / 21st | Máscara `content-box` + `exclude`, gradiente radial          | MIT (verificada no repositório) | **Reutilizável** | Base do anel `static`                 | Sem a animação de `background-position` no card                |
| REF-36 | Border Beam Panel    | https://21st.dev/@rmahammad/components/border-beam-panel                                               | 21st            | Cometa cônico com máscara; fallback `forced-colors`          | MIT (no código)                 | **Reutilizável** | Visual de repouso (cometa parado)     | Sem rAF, sem ponteiro, sem blur; só o ângulo fixo e as paradas |
| REF-34 | Border Beam          | https://magicui.design/docs/components/border-beam                                                     | Magic UI / 21st | Máscara `intersect` + `offset-path: rect()`                  | MIT                             | **Reutilizável** | Volta de entrada do `active`          | `@keyframes` CSS no lugar do motion, uma iteração              |
| REF-17 | Animated Border      | https://21st.dev/@kevingirelli/components/animated-border                                              | 21st            | Quadrado com `conic-gradient` girando por `transform`        | Não declarada                   | Só inspiração    | Giro do `ritual` no compositor        | Uma volta, só no card aberto                                   |
| REF-35 | Animated Border Beam | https://21st.dev/@hyperiux/components/border-beam                                                      | 21st            | `@property` + máscaras cônicas, `data-active/fading`         | Não declarada                   | Só inspiração    | Padrão de entrada e saída do `active` | Só os atributos; **nada** do loop de `@property`               |
| REF-21 | Spotlight            | https://21st.dev/@kevingirelli/components/spotlight                                                    | 21st            | Anel por máscara + opacidade em `group-hover`/`focus-within` | Não declarada                   | Só inspiração    | `hover-glow` sem ponteiro             | Brilho em posição fixa                                         |
| REF-18 | Border Trail         | https://21st.dev/@ibelick/components/border-trail                                                      | 21st            | `offset-path` animado por framer-motion                      | Não declarada                   | Só inspiração    | Confirma a técnica da volta única     | Trocar motion por CSS                                          |
| REF-85 | Orbit Spinner        | https://github.com/isas1/forever-ai-components/blob/main/infinite/svg-animations/08-orbit-spinner.html | forever         | SVG SMIL, traço correndo                                     | MIT                             | **Reutilizável** | Alternativa de `ritual`               | Converter SMIL em CSS (o SMIL ignora o movimento reduzido)     |
| REF-84 | Noto Sans Runic      | https://fonts.google.com/noto/specimen/Noto+Sans+Runic                                                 | Google Fonts    | Fonte (bloco Unicode Runic completo)                         | OFL-1.1                         | **Reutilizável** | Runas reais sem arte                  | Subset `runic`, `aria-hidden`/texto alternativo vazio          |

## 11. Questões em aberto

- O cometa parado disputa atenção com a faixa lateral colorida do `SpellCard`? Testar no Playground se o cometa vai para o canto superior direito ou some no card fechado.
- Runas no topo cabem no card fechado (≈ 96 px de altura) sem cortar o nome da magia? Validar com nomes longos em pt e en.
- `active` substitui o `turn-glow` infinito do combate? Testar a troca por volta única + anel aceso.
- Peso real da Noto Sans Runic (subset `runic`): medir antes de ligar em produção.
