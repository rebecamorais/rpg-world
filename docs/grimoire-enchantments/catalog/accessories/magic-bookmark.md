# MagicBookmark (`magic-bookmark`)

Categoria: Acessórios · Status: proposto (fora do primeiro grupo do Playground) · Faixas: `F1` · Custo: Muito baixo

## 1. Identidade

- **Propósito:** uma fita, aba ou marcador preso à borda de um card ou página, para dizer "isto está marcado": favorito, seção, coleção pessoal, entrada salva.
- **Descrição:** uma peça estreita que sai do topo ou da lateral, como num livro de verdade.
- **Usos:** magia favorita, índice de seções do grimório, item salvo na mochila, entrada fixada do diário.

**O componente é só visual.** Ele não sabe por que está marcado e não salva nada. Quem usa decide se renderiza e cuida do estado e do botão que marca.

**Verificado no repositório:**

- O lucide `Bookmark` já está no `AppIcon` (`src/frontend/components/ui/icon.tsx`).
- Hoje **não existe** estado de favorito em magias.
- O `Pin`/`PinOff` existe no `AppIcon`, mas o uso dele não foi auditado (**não verificado**).

## 2. Visual

**Direção:** objeto físico do livro, discreto, sem animação em repouso.

| Variante          | Aparência                                                                                 | Cor                                                                                 | Uso sugerido                                  | Interação                                                                                           | Fallback estático |
| ----------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------- | ----------------- |
| `ribbon` (padrão) | Fita de tecido de 10 a 14 px saindo da borda superior, com ponta em V (rabo de andorinha) | Fita em `--character-color` ou `--spell-color` (sólida); vinco interno em `*-muted` | Favorito, entrada fixada                      | Ao aparecer, desce 4 px uma vez (`translateY`, 200 ms)                                              | Fita parada       |
| `arcane-tab`      | Aba lateral de índice, com um glifo arcano no centro                                      | Aba em `--grimoire-surface` com borda `*-muted`; glifo em `*-flare`                 | Seções do grimório, índice da ficha           | Nenhuma                                                                                             | Igual             |
| `metallic`        | Marcador de metal: lâmina estreita com gradiente metálico e um fecho na ponta             | Gradiente estático entre `--grimoire-ornament` e `*-flare`; fecho em `*-on`         | Coleção pessoal, item lendário ou sintonizado | Opcional: brilho que atravessa uma vez no hover (técnica da REF-49), só com `@media (hover: hover)` | Gradiente parado  |

Nenhuma variante anima em loop: uma fita balançando chama atenção demais numa lista.

**Temas:**

- `ancient-manuscript` e `wildwood-codex` usam `ribbon`.
- `arcane-scholar` usa `arcane-tab`.
- `elemental-archive` e `celestial-codex` usam `metallic`.
- O `legacy` não mostra marcador, porque a feature não existe hoje.

## 3. Proposta técnica

**CSS + SVG, num componente React sem estado (Server Component).**

- **`ribbon`:** um `span` absoluto com `clip-path: polygon(0 0, 100% 0, 100% 100%, 50% 80%, 0 100%)`. Não precisa de arquivo. A geometria da ponta se inspira na REF-106, sem o balanço por JS.
- **`arcane-tab`:** um `span` com `border-radius` só no lado de fora. O glifo é um SVG de uma cor em `mask-image` sobre `background-color: var(--…-flare)`.
- **`metallic`:** um `span` com `linear-gradient` de 3 a 4 paradas, todas em tokens (`color-mix`). O fecho é uma máscara (`metallic-clasp.svg`). O brilho opcional é um `::after` com `animation-play-state: paused`, que vira `running` no hover; sempre começa da borda e roda uma vez.
- **Tamanho:** `--grimoire-bookmark-size` (padrão 12 px de largura).

```tsx
interface MagicBookmarkProps {
  variant?: 'ribbon' | 'arcane-tab' | 'metallic'; // default: the theme's, else 'ribbon'
  tone?: 'spell' | 'character' | 'primary';
  placement?: 'top-left' | 'top-right' | 'right';
  className?: string;
}

// The parent is `relative`; whether to render is the caller's decision.
<article className="relative ...">
  {spell.isFavorite && <MagicBookmark variant="ribbon" tone="spell" placement="top-left" />}
</article>;
```

Não há `onClick`, `active` nem `state`. O glifo do `arcane-tab` é fixo no tema (não é prop), para manter a API pequena.

- **Estilos:** `@utility grimoire-bookmark-*` em `app/globals.css` (ou `grimoire.css`), só com tokens.
- **Dependências:** nenhuma.
- **Pontos de integração:**
  - `src/frontend/components/character/spells/spell-card/SpellCard.tsx` (o `article` já é `relative overflow-hidden`);
  - `src/frontend/components/ui/section-card.tsx` (`arcane-tab` no índice da ficha);
  - os cards da mochila.

## 4. Personalização

`variant`, `tone` e `placement`. O tema define a variante padrão, o `--grimoire-bookmark-size` e o glifo do `arcane-tab`.

## 5. Desempenho

| Aspecto            | Avaliação                                                                                                        |
| ------------------ | ---------------------------------------------------------------------------------------------------------------- |
| DOM                | 1 `span` (+1 pseudo-elemento para o glifo, o fecho ou o brilho)                                                  |
| Pintura            | Um polígono ou gradiente pequeno. Sem sombra borrada; no máximo um `drop-shadow` de 1 px no escuro, sem animação |
| Animação           | `ribbon`: descida de entrada (`transform`, 200 ms, uma vez). `metallic`: brilho opcional no hover, uma vez       |
| SVG                | Glifo ou fecho de 1 a 2 caminhos, ≤ 1 KB, cacheados como URL                                                     |
| Várias instâncias  | Seguro com dezenas (`F1`). O brilho fica parado em repouso, então não cria camada                                |
| Celular            | Não cobre a área de toque do `SpellQuickAction`. Por padrão vai em `top-left`, junto da faixa da cor da magia    |
| Movimento reduzido | Sem descida e sem brilho (regra global); fica o estado final                                                     |

**Benchmark no `/dev/grimoire`:**

- spellbook com 60 cards, todos marcados, sem frames acima de 16 ms na rolagem (CPU 4× mais lenta);
- contar os nós por card (meta F1: ≤ 4 extras no total do card).

## 6. Acessibilidade

- Sempre `aria-hidden="true"`. O significado fica em texto: o botão que marca tem `aria-pressed` e rótulo ("Remover dos favoritos"), ou há um `sr-only` no cabeçalho ("Favorita").
- A cor não é a única pista: a forma (fita, aba, lâmina) já distingue o item marcado.
- Contraste da forma: 3:1 contra o card, garantido pelos tokens `*-flare` e testado no teste de contraste.
- `forced-colors`: a peça vira `CanvasText` sólido e continua visível como forma. O brilho fica oculto.
- Não recebe foco.

## 7. Compatibilidade

| Superfície            | Suporte                | Nota                                       |
| --------------------- | ---------------------- | ------------------------------------------ |
| `spell-card-compact`  | `ribbon`               | `top-left`; não cobre o `SpellQuickAction` |
| `spell-card-expanded` | `ribbon`, `metallic`   |                                            |
| `spellbook-page`      | `arcane-tab`           | Índice de seções                           |
| `character-sheet`     | `ribbon`, `arcane-tab` |                                            |
| `inventory-card`      | `ribbon`, `metallic`   | `metallic` para item sintonizado           |
| `campaign`            | `ribbon`, `arcane-tab` | Entradas fixadas do diário                 |

## 8. Assets

Os prompts de geração ficam fora do repositório.

- `magic-bookmark/glyph-star.svg`: glifo da `arcane-tab` (estrela arcana de 4 pontas).
- `magic-bookmark/metallic-clasp.svg`: fecho do `metallic` (fivela pequena com rebite, silhueta sólida).

O `charm.svg` da versão anterior saiu junto com a variante `charm`.

## 9. Referências

**Lacuna:** nenhuma referência forte de marcador nas fontes pesquisadas. A forma e o glifo são **originais** (arte da dona).

| Ref     | Nome                                                                                                                 | Fonte           | Tecnologia                                            | Licença · código                                    | Relevância e adaptação                                                 |
| ------- | -------------------------------------------------------------------------------------------------------------------- | --------------- | ----------------------------------------------------- | --------------------------------------------------- | ---------------------------------------------------------------------- |
| REF-106 | [Ribbon Script](https://github.com/isas1/forever-ai-components/blob/main/infinite/art-nouveau/10-ribbon-script.html) | forever · isas1 | faixa de fita em SVG; balanço por JS                  | MIT · **código reutilizável** com aviso             | Geometria da ponta da `ribbon`, sem o balanço                          |
| REF-108 | Folding Paper (`infinite/css-3d/04-folding-paper.html`)                                                              | forever · isas1 | dobra 3D em CSS (faixa medium)                        | MIT · **código reutilizável** com aviso             | Ideia da dobra no topo do `metallic`; só estática. Verificação parcial |
| REF-49  | [Klyv Shimmer Button](https://21st.dev/@klyv-ui/components/klyv-shimmer-button)                                      | 21st · klyv-ui  | brilho com `animation-play-state` pausado até o hover | MIT (no código) · **código reutilizável** com aviso | Brilho de uma vez do `metallic`, sem o blur                            |
| REF-110 | SVGBackgrounds #43 "lifted paper corner"                                                                             | SVGBackgrounds  | padrão SVG                                            | proibido redistribuir · **só inspiração**           | Ideia de canto levantado; não entra no repositório                     |

## 10. Questões em aberto

- Favoritar magias é uma feature desejada? Ela precisa de estado no banco e fica fora desta coleção. Sem ela, o marcador só tem uso no índice (`arcane-tab`).
- `top-left` junto da faixa da magia, ou `top-right`? No celular, `top-right` disputa espaço com o `SpellQuickAction`.
