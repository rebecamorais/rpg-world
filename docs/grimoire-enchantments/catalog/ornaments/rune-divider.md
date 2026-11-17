# RuneDivider (`rune-divider`)

Ornamentos · Status: proposto, **1º grupo do Playground** · Custo: Muito baixo · Faixas: `F1`, `F2`, `F3`

## 1. Identidade

- **Propósito:** separador decorativo entre seções e dentro da descrição de magias.
- **Descrição:** uma linha fina que se apaga nas pontas, com um ornamento no centro: um losango, uma sequência de runas, um floreio ou um ramo.
- **Usos:** entre os níveis do spellbook, entre partes da descrição de uma magia, entre seções da ficha, no diário.

## 2. Design visual

**Direção:** a linha que o escriba traça entre capítulos. Sempre discreta e simétrica.

| Variante     | Aparência                                                                                  | Cor                                                         | Uso sugerido                                       | Interação                                    | Fallback estático                   |
| ------------ | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------- | -------------------------------------------------- | -------------------------------------------- | ----------------------------------- |
| `minimal`    | Linha que se apaga nas pontas + losango central                                            | `--border` na linha, `--grimoire-ornament-muted` no losango | Qualquer lugar, padrão                             | Pode deslizar a linha para fora uma vez (F4) | É o próprio estado                  |
| `geometric`  | Linha + uma **sequência de runas reais** (Noto Sans Runic) no centro, separadas por pontos | Runas em `--grimoire-ornament`                              | Cabeçalhos de nível do spellbook, `arcane-scholar` | Nenhuma                                      | `minimal` (se a fonte não carregar) |
| `ornamental` | Linha + floreio em S espelhado                                                             | `--grimoire-ornament`                                       | Ficha, diário, `ancient-manuscript`                | Nenhuma                                      | `minimal`                           |
| `botanical`  | Linha + ramo com folhas alternadas                                                         | `--grimoire-ornament`                                       | `wildwood-codex`, druidas                          | Nenhuma                                      | `minimal`                           |

**Runas da `geometric`:** a dona decidiu usar as duas fontes.

1. **Agora:** texto em Noto Sans Runic (REF-84), sem arte. A sequência é fixa (ex.: `ᚠ·ᚱ·ᛗ`) ou **determinística a partir de uma string externa** (o nome da magia, o id da seção), na ideia da REF-46: a mesma magia mostra sempre as mesmas runas, e magias diferentes mostram runas diferentes. As runas são decorativas: nunca formam texto com sentido.
2. **Depois:** a arte de runas inventadas da dona (`rune-divider/runic.svg`) pode substituir a fonte via `--grimoire-rune-source: art`.

**Comportamento de cor:** só tokens; o ornamento usa `background-color` + máscara (assets) ou `color` (runas da fonte).

**Temas:** `legacy` usa `minimal` só onde já existe divisória hoje. `arcane-scholar`: `geometric`. `ancient-manuscript` e `wildwood-codex`: `botanical`/`ornamental`. `celestial-codex`: `geometric`.

## 3. Proposta técnica

**CSS + texto/SVG.** Nenhuma dependência nova.

- **Estrutura:** um `<div role="separator">` (ou `<hr>` estilizado) com 1 filho `aria-hidden` para o ornamento. A linha sai de `::before`/`::after` com `linear-gradient(to right, transparent, var(--border))` (e o inverso), que se apaga nas pontas.
- **`minimal`:** o losango é um quadrado de 6 px girado 45° (puro CSS, REF-98).
- **`geometric`:** o filho contém o texto das runas em `font-family: var(--font-runic)` (Noto Sans Runic carregada com `next/font/google`, subset `runic`). A geração determinística é uma função pura `runesFrom(seed: string, count: number)` (hash simples → índices no bloco U+16A0–U+16EA), fora do componente de estilo.
- **`ornamental`/`botanical`:** o filho é um `<span>` com `background-color: currentColor; mask: url(asset) no-repeat center / contain` (técnica da REF-26).
- **Faixa repetida (opcional):** para uma divisória que é toda padrão (escamas, treliça), `mask: url(asset) repeat-x center / Wpx Hpx` (REF-26, REF-90).
- **Proibido:** canvas por instância (REF-46 usa canvas; aqui só a ideia do _seed_).

**Estratégia de estilo:** `@utility enchant-divider` com `data-variant`.

**Pontos de integração:** cabeçalhos de nível em `src/frontend/components/character/spells/Spellbook.tsx`; entre `SpellDetails` e `SpellChipsRow` em `spell-card/SpellCard.tsx` (card aberto); entre seções da ficha.

## 4. API proposta

```ts
type RuneDividerVariant = 'minimal' | 'geometric' | 'ornamental' | 'botanical';

interface RuneDividerProps {
  variant?: RuneDividerVariant; // default 'minimal'
  /** Seed for a deterministic rune sequence ('geometric' only), e.g. the spell name. */
  seed?: string;
  /** Number of runes for 'geometric'. */
  runeCount?: 3 | 5; // default 3
  /** Keeps separator semantics; set false when purely decorative between headings. */
  semantic?: boolean; // default true
  /** Slides the lines out once on mount. */
  revealOnMount?: boolean;
  className?: string;
}

/** Pure helper, outside the visual component. */
declare function runesFrom(seed: string, count: number): string;
```

## 5. Personalização

| Propriedade          | Token                     | Padrão                                                                   |
| -------------------- | ------------------------- | ------------------------------------------------------------------------ |
| Cor da linha         | `--grimoire-divider-line` | `var(--border)`                                                          |
| Cor do ornamento     | `--grimoire-ornament`     | `var(--spell-muted)` / `var(--character-muted)` / `var(--primary-muted)` |
| Asset                | `--grimoire-divider-mask` | definido pelo tema; `none` = `minimal`                                   |
| Fonte das runas      | `--grimoire-rune-source`  | `font`; `art` usa o SVG da dona                                          |
| Espaçamento vertical | `--grimoire-divider-gap`  | `1rem`                                                                   |

## 6. Desempenho

- **DOM:** 2 nós (contêiner + ornamento); a linha é pseudo-elemento.
- **Pintura:** estática. `revealOnMount` anima `transform: scaleX` uma vez (compositor).
- **SVG:** ≤ 2 KB por asset, em cache.
- **Fonte:** a Noto Sans Runic é um arquivo a mais (peso **não medido**; medir em `/dev/grimoire`). Se pesar, a `geometric` carrega a fonte só nos temas que a usam, e cai para `minimal` antes do carregamento (`font-display: optional`).
- **Várias instâncias:** seguro em `F1` (o spellbook tem até ~10 cabeçalhos de nível).
- **Celular:** o ornamento central não encolhe abaixo de 16 px de altura.
- **Movimento reduzido:** `revealOnMount` mostra a linha pronta.
- **Custo:** Muito baixo.
- **Benchmark (`/dev/grimoire`):** spellbook com 10 divisórias `geometric` + 60 cards: medir o custo do carregamento da fonte (bytes, tempo até o texto) e a rolagem (p95 ≤ 16,7 ms).

## 7. Acessibilidade

- **Semântica:** o contêiner é `role="separator"` (ou `<hr>`), e o ornamento é `aria-hidden="true"`. Isto evita o problema da REF-26, onde o `aria-hidden` no próprio `<hr>` tira a semântica. Entre um título e outro, `semantic={false}` torna tudo decorativo.
- **Runas:** sempre `aria-hidden`; leitores de tela não leem as runas, mesmo sendo texto Unicode.
- **Contraste:** decorativo, sem exigência.
- **`forced-colors: active`:** a linha vira `CanvasText` em 1 px; o ornamento some.
- **Movimento:** só a entrada única, desligada em movimento reduzido.

## 8. Compatibilidade

| Superfície            | Uso                       | Variante                                         |
| --------------------- | ------------------------- | ------------------------------------------------ |
| `spell-card-compact`  | Não (não há seções)       | —                                                |
| `spell-card-expanded` | Entre partes da descrição | `minimal`/`geometric` com `seed` = nome da magia |
| `spellbook-page`      | Cabeçalhos de nível       | `geometric`                                      |
| `character-sheet`     | Entre seções              | `minimal`/`ornamental`                           |
| `inventory-card`      | Entre categorias          | `minimal`                                        |
| `campaign`            | Diário                    | `ornamental`/`botanical`                         |

## 9. Assets

Os prompts de geração ficam fora do repositório. Nenhum é obrigatório para o 1º grupo: `minimal` é CSS e `geometric` usa a fonte.

- `rune-divider/ornamental.svg` (antes `gilded.svg`): floreio em S espelhado com ponto central.
- `rune-divider/botanical.svg`: ramo com 3 pares de folhas e broto central.
- `rune-divider/runic.svg` (opcional, depois): runas inventadas da dona, alternativa à fonte na `geometric`.

Saíram: `diamond.svg` (o losango é CSS) e `celestial.svg` (sem variante correspondente).

## 10. Referências

| ID     | Nome            | URL                                                                                                   | Fonte        | Tecnologia                                         | Licença         | Código?                               | Relevância                      | Adaptação                                          |
| ------ | --------------- | ----------------------------------------------------------------------------------------------------- | ------------ | -------------------------------------------------- | --------------- | ------------------------------------- | ------------------------------- | -------------------------------------------------- |
| REF-26 | Wave Separator  | https://21st.dev/@serafimcloud/components/wave-separator                                              | 21st         | `<hr>` com `currentColor` + máscara SVG `repeat-x` | Não declarada   | Só inspiração                         | Técnica principal (1 nó, token) | Semântica no contêiner, `aria-hidden` no ornamento |
| REF-46 | Tile Band       | https://21st.dev/@sarat-asymmetrica/components/tile-band                                              | 21st         | Motivos com _seed_ num canvas; `<hr>` filho        | MIT (no código) | **Reutilizável** (só a ideia é usada) | Sequência determinística        | Em texto/CSS, sem canvas                           |
| REF-84 | Noto Sans Runic | https://fonts.google.com/noto/specimen/Noto+Sans+Runic                                                | Google Fonts | Fonte, bloco Unicode Runic completo                | OFL-1.1         | **Reutilizável**                      | Runas reais sem arte            | Subset `runic`, `aria-hidden`                      |
| REF-98 | Rule Lines      | https://github.com/isas1/forever-ai-components/blob/main/infinite/swiss/06-rule-lines.html            | forever      | Linhas em CSS que deslizam                         | MIT             | **Reutilizável**                      | `minimal` e `revealOnMount`     | Uma vez só                                         |
| REF-90 | Seigaiha        | https://github.com/isas1/forever-ai-components/blob/main/infinite/hokusai/03-seigaiha.html            | forever      | Padrão SVG                                         | MIT             | **Reutilizável**                      | Faixa repetida opcional         | Como máscara `repeat-x`                            |
| REF-87 | The Trellis     | https://github.com/isas1/forever-ai-components/blob/main/infinite/morris/06-the-trellis.html          | forever      | Treliça SVG                                        | MIT             | **Reutilizável**                      | Faixa `botanical`/`ornamental`  | Estática                                           |
| REF-02 | Border Flourish | https://github.com/isas1/forever-ai-components/blob/main/infinite/art-nouveau/08-border-flourish.html | forever      | Floreio SVG                                        | MIT             | **Reutilizável**                      | Desenho do `ornamental`         | Sem o `drop-shadow`                                |

## 11. Questões em aberto

- As runas reais podem, por acaso, formar sequências com significado em nórdico antigo. Como são decorativas e `aria-hidden`, o risco é baixo; a dona confirma se prefere só runas inventadas no futuro.
- `seed` = nome da magia muda as runas ao trocar de idioma (o nome é traduzido). Usar o id da magia em vez do nome?
- A Noto Sans Runic vale o arquivo extra só para divisórias e bordas? Medir no Playground.
