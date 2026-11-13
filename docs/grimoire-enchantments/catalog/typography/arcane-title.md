# ArcaneTitle (`arcane-title`)

Categoria: Tipografia · Status: proposto (fora do primeiro grupo do Playground) · Faixas: `F1`, `F2`, `F3` · Custo: Muito baixo

## 1. Identidade

- **Propósito:** dar voz de grimório a títulos curtos (nome da magia, do personagem, de seção, de página) sem tocar no texto corrido.
- **Descrição:** a fonte de exibição é escolhida pela variante, e há um tratamento opcional: capitular com moldura, runas nas laterais ou brilho dourado que passa **uma vez**.
- **Usos:** nome da magia no card, título de página do grimório, cabeçalho de seção da ficha, nome de NPC, título de entrada do diário.

**Verificado no repositório:**

- `src/frontend/lib/fonts.ts` carrega Cinzel 600/700 (subset `latin`) via `next/font/google`, na variável `--font-cinzel`.
- `app/globals.css` define `--font-display` e as utilities `text-display`/`text-title`, com a regra "Cinzel só em display e title, nunca em texto corrido". `h1` e `h2` já usam `font-display`.
- `src/frontend/components/character/spells/spell-card/parts/SpellHeader.tsx` usa `font-display` no `h3` com o nome da magia, com `truncate`.

## 2. Visual

**Direção:** inscrição de manuscrito, sóbria. Quatro tons de "voz", em vez de quatro efeitos diferentes. O texto é sempre legível antes de ser decorado.

| Variante             | Aparência                                                            | Fonte                                                           | Cor                                                                         | Uso sugerido                                                             | Interação                                    | Fallback estático                                    |
| -------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------- | ---------------------------------------------------- |
| `scholarly` (padrão) | Capitulares romanas, sem enfeite. É o visual de hoje                 | Cinzel (REF-28), **já carregada**                               | `foreground`                                                                | Tudo; tema `legacy`, `arcane-scholar`                                    | Nenhuma                                      | É ela mesma                                          |
| `manuscript`         | Impresso antigo; capitular opcional com moldura (`initial-frame`)    | IM Fell English (REF-31) ou Cormorant Garamond itálico (REF-30) | Texto `foreground`, moldura `--grimoire-ornament`                           | Página do grimório, diário; tema `ancient-manuscript`                    | Nenhuma                                      | Sem moldura, com Cinzel até a fonte do tema carregar |
| `celestial`          | Capitulares ornadas, com um gradiente que desliza devagar e não gira | Cinzel Decorative (REF-73)                                      | Gradiente entre `*-flare` e `--grimoire-ornament` (`background-clip: text`) | Nome do personagem, título de capítulo; tema `celestial-codex`           | Deslize opcional de uma vez no evento (`F4`) | Cor sólida `*-flare`                                 |
| `runic`              | Letra uncial, ladeada por uma sequência curta de runas               | Uncial Antiqua (REF-32) + runas da Noto Sans Runic (REF-84)     | Texto `foreground`, runas `--grimoire-ornament-muted`                       | Título de seção, nome de tomo; temas `shadow-archive` e `wildwood-codex` | Nenhuma                                      | Runas ocultas; só o texto                            |

**Brilho dourado opcional (todas as variantes):** uma faixa de luz atravessa o título **uma vez**, num evento (abrir o tomo, preparar). Usa a técnica de duas camadas recortadas no texto (REF-52, REF-101), disparada por uma única chamada WAAPI (REF-53). Nunca em loop.

**Cor:**

- O ornamento segue a família de tokens do `tone` (`--spell-*`, `--character-*`, `--primary-*`) e o `--grimoire-ornament` do tema.
- O texto fica sempre em `foreground`, exceto no `celestial`.

**Temas:** a variante padrão vem do preset (`--grimoire-title-font` aponta para a fonte). O `legacy` usa `scholarly`, sem nenhuma mudança visual.

## 3. Proposta técnica

**CSS (utilities Tailwind 4) + componente React fino, sem estado (Server Component).**

- Família, tamanho e peso vêm de `text-display`/`text-title`. O ArcaneTitle troca só `font-family` (via `--grimoire-title-font`) e acrescenta o tratamento.
- **`runic`:** as runas entram em `::before`/`::after` com texto alternativo vazio, `content: 'ᚠᚱᛁ' / ''`. É o mesmo padrão do separador `'•' / ''` no `SpellHeader`, para os leitores de tela não lerem runas. A `font-family` do pseudo-elemento é a Noto Sans Runic.
- **Runas, as duas fontes:** agora, as runas reais da Noto Sans Runic (REF-84); depois, as runas inventadas da arte da dona (`arcane-title/flank-rune.svg`, em máscara). O token `--grimoire-title-runes` escolhe `font` ou `art`.
- **Sequência de runas determinística:** é derivada do texto (hash → índice no bloco U+16A0–16F8), então o mesmo nome sempre gera as mesmas runas. É a ideia da REF-46, feita em texto e não em canvas. O cálculo roda no servidor e entra como `data-runes`, lido pelo CSS via `attr()`.
  - **Não verificado:** se o `attr()` funciona em `content` com fallback em todos os navegadores-alvo. A alternativa é um `span aria-hidden` com o texto.
- **`manuscript`:** a capitular usa `::first-letter`, com a moldura SVG como `background` mascarado.
- **`celestial`:** um gradiente de 200% com `background-clip: text` (REF-57), sem `rotate`/`scale`. Fica parado; o deslize é opcional e acontece uma vez.
- **Brilho único:** um hook `useTitleSweep()` chama `el.animate([{ backgroundPosition: '-100% 0' }, { backgroundPosition: '200% 0' }], { duration: 900, iterations: 1 })` uma vez e cancela no `finish`. Não usa listeners nem `IntersectionObserver`.

```tsx
type ArcaneTitleVariant = 'scholarly' | 'manuscript' | 'celestial' | 'runic';

interface ArcaneTitleProps extends React.ComponentProps<'h1'> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p'; // semantics belong to the caller
  size?: 'display' | 'title'; // picks text-display or text-title
  variant?: ArcaneTitleVariant; // default: the theme's, else 'scholarly'
  tone?: 'spell' | 'character' | 'primary'; // token family for ornaments
  initial?: boolean; // 'manuscript' drop-cap frame
}

// Optional one-shot sweep; the caller decides when.
function useTitleSweep(): { ref: React.RefObject<HTMLElement>; sweep: () => void };

<ArcaneTitle as="h2" size="title" variant="runic" tone="character">
  Grimório de Ada
</ArcaneTitle>;
```

As classes `arcane-title arcane-title-<variant>` também ficam disponíveis soltas, para quem já tem o heading (como o `SectionCard.Title`).

- **Estilos:** `@utility arcane-title-*` em `app/globals.css`, ou num `grimoire.css` importado por ele. Usa só tokens (`design-tokens.unit.test.ts`).
- **Dependências:** nenhuma.
- **Pontos de integração:**
  - `parts/SpellHeader.tsx`: o `h3`, só `scholarly`/`celestial` sem enfeite lateral, por causa do `truncate`;
  - `src/frontend/components/ui/section-card.tsx` (`SectionCard.Title`);
  - `src/frontend/components/shared/PageHeader.tsx`.

**Fontes:**

- **Na fase 2, só a Cinzel**, que já está carregada.
- A fonte de cada tema só é declarada quando o tema for implementado, com `preload: false`, e aplicada dentro de `[data-grimoire=…]`. O `next/font` não carrega por atributo: a fonte entra no CSS e o navegador só a baixa quando um nó a usa.
- A Noto Sans Runic entra com o subset de runas. **Não verificado:** se o `next/font/google` aceita `subsets: ['runic']`. Conferir em `node_modules/next/dist/docs/` antes de implementar.
- **pt-BR:** os acentos foram conferidos no próprio arquivo da fonte em Cinzel Decorative, IM Fell English, Uncial Antiqua e Noto Sans Runic. Na Cinzel e na Cormorant, foi conferida só a lista de subsets (`latin`).

## 4. Personalização

- **Tokens do tema:** `--grimoire-title-font`, `--grimoire-title-tracking`, `--grimoire-title-runes` (`font | art | none`), `--grimoire-ornament`.
- **Props:** `variant`, `tone`, `as`, `size`, `initial`.
- Sem prop de cor livre nem de tamanho: a escala tipográfica do app manda.

## 5. Desempenho

| Aspecto            | Avaliação                                                                                                             |
| ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| DOM                | 0 nós extras (pseudo-elementos)                                                                                       |
| Pintura            | `celestial` cria uma camada de gradiente por título, barata. As outras variantes não pintam nada além do texto        |
| Animação           | Nenhuma por padrão. O brilho anima `background-position` **uma vez**, ≤ 900 ms, só no título acionado                 |
| SVG                | 1 moldura de capitular (`manuscript`), cacheada como URL                                                              |
| Fonte              | O custo real: cada família nova é um download. A Noto Sans Runic com o subset de runas **ainda não foi medida**       |
| Várias instâncias  | `scholarly` e `runic` são seguras em lista (`F1`). `celestial` e `manuscript` com capitular: uma por tela (`F2`/`F3`) |
| Celular            | As runas laterais somem abaixo de 360 px (`@container`), para não espremer o título                                   |
| Movimento reduzido | Sem brilho. O texto fica na cor de destaque sólida (`-webkit-text-fill-color`), como no fallback da REF-51            |

**Benchmark no `/dev/grimoire`:**

- KB de fonte transferidos por página, com e sem a fonte do tema e com a Noto Sans Runic;
- CLS na troca de fonte (meta: 0, com `adjustFontFallback`);
- LCP do spellbook, com regressão máxima de 5% contra o `legacy`.

## 6. Acessibilidade

- O heading é de quem usa (`as`). A hierarquia não muda, e cada página continua com um `h1` só.
- As runas são decorativas: texto alternativo vazio no `content` ou `aria-hidden`. Elas não podem aparecer no nome acessível.
- `celestial`: o gradiente precisa de 4,5:1 (ou 3:1 em título grande) em **todo** o trecho, contra `card` e `background`. O teste de contraste dos tokens mede as duas pontas.
- Letra uncial e Fell em título longo cansam a leitura. Por isso as duas ficam só em títulos curtos e **nunca em texto corrido**.
- `forced-colors: active`: o `background-clip: text` some, e o título passa a `color: CanvasText` explícito. As runas e a moldura ficam ocultas.
- Não recebe foco, porque é texto. O `text-wrap: balance` continua.

## 7. Compatibilidade

| Superfície            | Suporte                                  | Nota                                                   |
| --------------------- | ---------------------------------------- | ------------------------------------------------------ |
| `spell-card-compact`  | `scholarly`                              | O nome usa `truncate`; enfeite lateral roubaria espaço |
| `spell-card-expanded` | `scholarly`, `runic`, `celestial`        |                                                        |
| `spellbook-page`      | todas                                    | `manuscript` com capitular no título da página         |
| `character-sheet`     | `scholarly`, `runic`, `celestial` (nome) |                                                        |
| `inventory-card`      | `scholarly`                              |                                                        |
| `campaign`            | todas                                    | Diário: `manuscript`                                   |

## 8. Assets

Os prompts de geração ficam fora do repositório.

- `arcane-title/flank-rune.svg`: losango com runa inventada, na ponta do filete lateral, espelhado por CSS. É a versão "arte" da variante `runic`; até ela existir, a variante usa a Noto Sans Runic.
- `arcane-title/initial-frame.svg`: moldura quadrada da capitular `manuscript`.

## 9. Referências

| Ref     | Nome                                                                                                                            | Fonte              | Tecnologia                                         | Licença · código                        | Relevância e adaptação                                  |
| ------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------ | -------------------------------------------------- | --------------------------------------- | ------------------------------------------------------- |
| REF-28  | [Cinzel](https://fonts.google.com/specimen/Cinzel)                                                                              | Google Fonts       | fonte variável                                     | OFL-1.1 · **pode usar**                 | `scholarly`; já carregada                               |
| REF-31  | [IM Fell English](https://fonts.google.com/specimen/IM+Fell+English)                                                            | Google Fonts       | fonte                                              | OFL-1.1 · **pode usar**                 | `manuscript`; só `latin`                                |
| REF-30  | [Cormorant Garamond](https://fonts.google.com/specimen/Cormorant+Garamond)                                                      | Google Fonts       | fonte variável + itálico                           | OFL-1.1 · **pode usar**                 | Alternativa itálica do `manuscript`                     |
| REF-73  | [Cinzel Decorative](https://fonts.google.com/specimen/Cinzel+Decorative)                                                        | Google Fonts       | fonte                                              | OFL-1.1 · **pode usar**                 | `celestial`; com moderação                              |
| REF-32  | [Uncial Antiqua](https://fonts.google.com/specimen/Uncial+Antiqua)                                                              | Google Fonts       | fonte                                              | OFL-1.1 · **pode usar**                 | `runic`; ruim em tamanhos pequenos                      |
| REF-84  | [Noto Sans Runic](https://fonts.google.com/noto/specimen/Noto+Sans+Runic)                                                       | Google Fonts       | fonte (89/89 runas Unicode, conferidas no arquivo) | OFL-1.1 · **pode usar**                 | Runas reais da `runic`, sempre decorativas              |
| REF-57  | [Aurora Text](https://magicui.design/docs/components/aurora-text)                                                               | Magic UI           | `background-clip: text`, fundo de 200%             | MIT · **código reutilizável** com aviso | Deslize do `celestial`, sem a rotação                   |
| REF-52  | [Animated Shiny Text](https://magicui.design/docs/components/animated-shiny-text)                                               | Magic UI           | `background-clip: text` + keyframe                 | MIT · **código reutilizável** com aviso | Faixa de brilho, executada uma vez; evitar o alfa `/70` |
| REF-53  | [Gradient Shimmer](https://21st.dev/@mona_biasia/components/gradient-shimmer)                                                   | 21st · mona_biasia | WAAPI + `color-mix(in oklab)`                      | não declarada · **só inspiração**       | Uma chamada `animate()` por evento, sem os listeners    |
| REF-51  | [Text Shimmer](https://21st.dev/@wensity/components/text-shimmer)                                                               | 21st · wensity     | keyframes + `background-clip: text`                | não declarada · **só inspiração**       | Fallback de movimento reduzido com cor sólida           |
| REF-101 | [Clip Gradient Mask](https://github.com/isas1/forever-ai-components/blob/main/infinite/kinetic-type/07-clip-gradient-mask.html) | forever · isas1    | máscara CSS + `background-clip: text`              | MIT · **código reutilizável** com aviso | Faixa de luz dourada                                    |
| REF-23  | [Sparkles Text](https://magicui.design/docs/components/sparkles-text)                                                           | Magic UI           | `setInterval` + motion                             | MIT · **só inspiração** (técnica ruim)  | Descartado: re-render a cada 100 ms                     |

## 10. Questões em aberto

- O tema `arcane-scholar` fica só com a Cinzel, ou troca para Marcellus (REF-29)? A sugestão é manter a Cinzel.
- `manuscript` com `::first-letter` falha se o título começar com um ícone. A capitular viraria prop?
- As runas em `attr()` funcionam em todos os navegadores-alvo, ou já começamos com um `span aria-hidden`?
