# AstralDust (`astral-dust`)

Fundos · Status: proposto, **2ª leva** (depois do 1º grupo do Playground) · Custo: Muito baixo (`static-stars`, `arcane-gradient`) / Baixo (`cosmic-dust`, `ambient-glow`) · Faixas: `F2` (card aberto), `F3` (página). **Nunca no card fechado.**

## 1. Identidade

- **Propósito:** atmosfera mágica sutil de estrelas, partículas arcanas e poeira cósmica, atrás do conteúdo.
- **Descrição:** camadas de gradientes e pontos de luz na cor do contexto, mais densas nas bordas e apagadas no centro, onde fica o texto.
- **Usos:** fundo do card de magia aberto (substitui ou estende os fundos de hoje), fundo da página do grimório, cabeçalho da ficha, telas de campanha.

**Verificado:** o app já tem 6 fundos CSS em `src/frontend/constants/spell-vfx.tsx` (`ethereal-glow`, `grid-mesh`, `void-dots`, `classic-aura`, `dots-space`, `force-shockwave`), renderizados só no card aberto pelo `SpellVFX` (`spell-card/SpellCard.tsx`) com máscara que apaga antes do texto. O AstralDust é a evolução deles, não um substituto do mecanismo.

## 2. Design visual

**Direção:** céu noturno visto de um observatório, não espaço sideral de ficção científica. Pontos pequenos e esparsos, sem cometas nem planetas.

| Variante          | Aparência                                                                               | Cor                                      | Uso sugerido                    | Interação                                       | Fallback estático            |
| ----------------- | --------------------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------- | ----------------------------------------------- | ---------------------------- |
| `static-stars`    | Tile de várias estrelas de tamanhos diferentes, feito só com `radial-gradient`          | `--spell-color` a 20–40%, sobre `--card` | Card aberto, cabeçalho da ficha | Nenhuma                                         | É o próprio estado           |
| `arcane-gradient` | Gradientes radiais em camadas que sobem de um canto (o `ethereal-glow` atual, refinado) | `--spell-color` → `--background`         | Card aberto, diálogos           | Nenhuma                                         | É o próprio estado           |
| `cosmic-dust`     | Partículas esparsas que flutuam muito devagar                                           | `--grimoire-ornament` a ~30%             | **Só fundo de página** (`F3`)   | Deriva lenta, opcional                          | `static-stars` parado        |
| `ambient-glow`    | Algumas estrelas cintilam devagar sobre uma luz difusa                                  | `--spell-glow` / `--atmosphere`          | **Só fundo de página** (`F3`)   | Cintilar lento de `opacity` em poucos elementos | Estrelas fixas, sem cintilar |

**Comportamento de cor:** só tokens. No tema claro, os pontos usam `--spell-flare` (que já escurece no claro) com opacidade mais baixa, para não parecer sujeira.

**Temas:** `legacy` mantém os 6 fundos atuais. `arcane-scholar`: `static-stars` leve na página. `celestial-codex`: `static-stars` na página e no card aberto; `ambient-glow` opcional. `elemental-archive`: `static-stars` com `density="sparse"`.

## 3. Proposta técnica

**CSS (gradientes), com SVG opcional para o tile.** Nenhuma dependência nova.

- **`static-stars`:** o tile da demo da REF-43 reimplementado: 6 a 8 `radial-gradient(1px 1px at x y, var(--star) 50%, transparent)` num `background-size` de 200 px, que se repete. A base de pontos regulares é a da REF-41 (`radial-gradient(circle, C 1px, transparent 1px)`), com token no lugar do hex. Vinheta com `mask-image: radial-gradient(...)` (REF-39) para apagar o centro.
- **`arcane-gradient`:** 2 ou 3 `radial-gradient` empilhados, como o `ethereal-glow` atual (verificado em `spell-vfx.tsx`).
- **`cosmic-dust`:** 10 a 20 spans absolutos com `transform: translate` em `@keyframes` muito longo (60–120 s), só em `F3`, só com `prefers-reduced-motion: no-preference` (REF-89). Uma única instância por página.
- **`ambient-glow`:** o tile de `static-stars` + 3 a 5 estrelas maiores com cintilar de `opacity` (REF-88). Só `F3`.
- **Tile em SVG (opcional):** se os gradientes ficarem caros ou pobres, o tile da dona (`astral-dust/stars-tile.svg`) entra como `background-image`, uma vez em cache.
- **Proibido:** canvas e rAF (REF-09, REF-25, REF-45), partículas em JS (REF-24), `setState` em loop (REF-43, REF-44).

**Estratégia de estilo:** `@utility enchant-astral-dust` com `data-variant`; o componente React é só um `<div aria-hidden>` posicionado.

**Pontos de integração:** `src/frontend/constants/spell-vfx.tsx` (novas entradas `SPELL_BACKGROUNDS['static-stars']` etc., sem tirar as atuais) e `SpellVFX` em `spell-card/SpellCard.tsx`, que já monta o fundo só no card aberto. Na página, o `body` de `app/globals.css` já tem a atmosfera; o AstralDust entraria por cima, num contêiner do grimório.

## 4. API proposta

```ts
type AstralDustVariant = 'static-stars' | 'arcane-gradient' | 'cosmic-dust' | 'ambient-glow';

interface AstralDustProps {
  variant?: AstralDustVariant; // default 'static-stars'
  density?: 'sparse' | 'normal'; // default 'sparse'
  /** Where the content sits; the vignette keeps that area clear. */
  clearArea?: 'center' | 'bottom' | 'none'; // default 'center'
  className?: string;
}
```

O componente renderiza um único `<div aria-hidden="true">` absoluto (`inset-0`, `pointer-events-none`). `cosmic-dust` e `ambient-glow` acrescentam filhos apenas quando usados como fundo de página.

## 5. Personalização

| Propriedade    | Token                              | Padrão                                                      |
| -------------- | ---------------------------------- | ----------------------------------------------------------- |
| Cor da estrela | `--grimoire-star`                  | `color-mix(in srgb, var(--spell-color) 40%, transparent)`   |
| Densidade      | `density` / `--grimoire-star-tile` | `200px` (`sparse`), `140px` (`normal`)                      |
| Opacidade      | `--grimoire-texture-opacity`       | `0.5` no card, `0.35` na página                             |
| Vinheta        | `--grimoire-vignette`              | `radial-gradient(ellipse at center, transparent 40%, #000)` |
| Movimento      | `--grimoire-motion`                | `on-event`; `none` congela `cosmic-dust`/`ambient-glow`     |

## 6. Desempenho

- **DOM:** 1 nó (`static-stars`, `arcane-gradient`); `cosmic-dust` 10–20 nós e `ambient-glow` 3–5 nós, **uma vez por página**.
- **Pintura:** gradientes pintam uma vez; o tile se repete pelo navegador. `cosmic-dust` anima só `transform` (compositor); `ambient-glow` só `opacity`.
- **SVG:** nenhum por padrão; o tile opcional tem ≤ 2 KB.
- **Várias instâncias:** só existe no card aberto (um por vez) e no fundo de página. **Fora do card fechado**: lá ficaria o custo de pintar dezenas de gradientes na rolagem.
- **Celular:** pontos de 1 px somem em telas densas; usar 1,5 px a partir de `min-resolution: 2dppx`. A deriva lenta é barata, mas fica desligada por padrão no celular (`@media (pointer: coarse)`), a confirmar no Playground.
- **Movimento reduzido:** `cosmic-dust` e `ambient-glow` ficam parados (= `static-stars`).
- **Custo:** Muito baixo (`static-stars`, `arcane-gradient`) / Baixo (`cosmic-dust`, `ambient-glow`).
- **Benchmark (`/dev/grimoire`):** página do grimório com `ambient-glow` e 60 cards: rolagem de 5 s com CPU 4×, p95 ≤ 16,7 ms, sem camadas compostas novas por card; LCP com regressão ≤ 5% contra o `legacy`.

## 7. Acessibilidade

- Decorativo: `aria-hidden="true"`, `pointer-events: none`.
- **Contraste:** a vinheta mantém a área do texto limpa. Critério: o `--muted-foreground` continua com contraste ≥ 4,5:1 medido **sobre o ponto mais claro** do fundo, nos dois temas. Testar com o axe no Playground.
- **`forced-colors: active`:** o fundo some (`background: none`).
- **Movimento:** nada se move em movimento reduzido; mesmo sem ele, a deriva é lenta (≥ 60 s por ciclo) e longe do texto.

## 8. Compatibilidade

| Superfície            | Uso                         | Variante                                      |
| --------------------- | --------------------------- | --------------------------------------------- |
| `spell-card-compact`  | **Não**                     | —                                             |
| `spell-card-expanded` | Sim, via `SpellVFX`         | `static-stars`, `arcane-gradient`             |
| `spellbook-page`      | Sim, fundo da página        | `static-stars`, `ambient-glow`, `cosmic-dust` |
| `character-sheet`     | Cabeçalho                   | `static-stars`                                |
| `inventory-card`      | Não (ruído atrás de listas) | —                                             |
| `campaign`            | Telas de sessão             | `arcane-gradient`, `ambient-glow`             |

## 9. Assets

Opcionais (prompts gerados fora do repositório):

- `astral-dust/stars-tile.svg`: tile contínuo de ~35 pontos de tamanhos variados.
- `astral-dust/stars-tile-sparse.svg`: o mesmo com ~18 pontos.
- `astral-dust/constellation.svg`: 3 constelações inventadas, para o card aberto do `celestial-codex`.

## 10. Referências

| ID     | Nome                | URL                                                                                                        | Fonte      | Tecnologia                                      | Licença       | Código?          | Relevância                              | Adaptação                                |
| ------ | ------------------- | ---------------------------------------------------------------------------------------------------------- | ---------- | ----------------------------------------------- | ------------- | ---------------- | --------------------------------------- | ---------------------------------------- |
| REF-43 | Shooting Stars      | https://ui.aceternity.com/components/shooting-stars                                                        | Aceternity | rAF + `setState`; tile `.stars` na demo         | Aceternity    | Só inspiração    | Ideia do tile de estrelas em gradientes | Só o tile, reescrito; nada do rAF        |
| REF-41 | Dot Grid            | https://21st.dev/@halaska-studio/components/dot-grid                                                       | 21st       | 1 div com `radial-gradient` + `background-size` | Não declarada | Só inspiração    | Base de pontos em 1 nó                  | Token no lugar do hex                    |
| REF-39 | Dot Pattern         | https://magicui.design/docs/components/dot-pattern                                                         | Magic UI   | SVG `<pattern>` + máscara de vinheta            | MIT           | **Reutilizável** | Vinheta para limpar o centro            | Só a máscara; os pontos ficam em CSS     |
| REF-88 | Windows Cascade     | https://github.com/isas1/forever-ai-components/blob/main/infinite/vaporwave/09-windows-cascade.html        | forever    | Cintilar de estrelas só em CSS, com máscara     | MIT           | **Reutilizável** | `ambient-glow`                          | Poucas estrelas, só na página            |
| REF-89 | Dragonfly Glide     | https://github.com/isas1/forever-ai-components/blob/main/infinite/art-nouveau/09-dragonfly-glide.html      | forever    | SVG + keyframes, partículas de pólen            | MIT           | **Reutilizável** | `cosmic-dust`                           | Deriva só por `transform`, uma instância |
| REF-67 | Meteors             | https://magicui.design/docs/components/meteors                                                             | Magic UI   | `@keyframes` rotate + translateX                | MIT           | **Reutilizável** | Estrela cadente rara (extra)            | Só em `F3` e fora do movimento reduzido  |
| REF-09 | Twinkling Starfield | https://github.com/isas1/forever-ai-components/blob/main/infinite/cosmic-space/03-twinkling-starfield.html | forever    | Canvas + rAF                                    | MIT           | Só inspiração    | Contraexemplo de técnica                | O visual é bom; a técnica não serve      |

## 11. Questões em aberto

- No tema claro, estrelas fazem sentido ou viram "poeira"? Talvez o `astral-dust` seja só do tema escuro e do `celestial-codex`.
- O `arcane-gradient` substitui o `ethereal-glow` atual ou os dois convivem com nomes diferentes no `SPELL_BACKGROUNDS`?
- `cosmic-dust` desligado por padrão no celular: confirmar no Playground com um aparelho real.
