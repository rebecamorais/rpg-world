# AncientParchment (`ancient-parchment`)

Fundos · Status: proposto, depois do 1º grupo · Custo: Baixo · Faixas: `F2` (card aberto, diálogo), `F3` (página). Só em temas que o pedirem.

## 1. Identidade

- **Propósito:** uma superfície que lembra manuscrito mágico, sem sacrificar a leitura.
- **Descrição:** cor de papel com grão fino estático, vinheta nas bordas e, conforme a variante, pauta de escriba, margens ou manchas do tempo.
- **Usos:** Lore e diário da mesa, descrição de magia aberta no tema `ancient-manuscript`, cabeçalho da ficha, notas de campanha.

**Verificado:** o `body` já usa um `feTurbulence` estático em data-URI (160×160, repetido) em `app/globals.css`. A spec do tema claro decidiu "claro neutro, não pergaminho" para o app: o pergaminho é **opcional, de tema**, nunca o padrão.

## 2. Design visual

**Direção:** papel velho de biblioteca, não papel queimado de cenário. Grão e vinheta discretos; o texto é sempre o protagonista.

| Variante     | Aparência                                                                  | Cor                                                         | Uso sugerido                                | Interação | Fallback estático           |
| ------------ | -------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------- | --------- | --------------------------- |
| `light`      | Papel claro e quente, grão fino, vinheta leve                              | `--grimoire-surface` (creme) + tinta `--foreground` do tema | Tema `ancient-manuscript` no modo claro     | Nenhuma   | Só a cor de papel, sem grão |
| `dark`       | Couro/papel escuro com grão e vinheta                                      | Superfície escura quente; tinta clara                       | Mesmo tema no modo escuro, `wildwood-codex` | Nenhuma   | Só a cor, sem grão          |
| `weathered`  | `light` ou `dark` + manchas nos cantos, cortadas pela borda                | Manchas em `color-mix` da superfície com a tinta, ~6%       | Diário, Lore, página de item antigo         | Nenhuma   | A variante base sem manchas |
| `manuscript` | `light` ou `dark` + pauta de escriba fina e uma margem vertical à esquerda | Pauta em `--grimoire-ornament-muted` a ~10%                 | Descrição de magia, diário                  | Nenhuma   | A variante base sem pauta   |

`weathered` e `manuscript` são camadas que se somam ao tom: o tom (`light`/`dark`) segue o `data-theme` por padrão.

**Comportamento de cor:** a superfície e a tinta vêm dos tokens do tema (`--grimoire-surface`, `--foreground`), e o teste de contraste (`theme-tokens.unit.test.ts`) passa a cobrir essas combinações. O grão é cinza neutro em `feColorMatrix`, então combina com qualquer cor.

**Temas:** só `ancient-manuscript` (tom pelo modo) e `wildwood-codex` (`dark` esverdeado). `legacy` não usa.

## 3. Proposta técnica

**CSS + SVG estático.** Nenhuma dependência nova.

- **Grão:** `feTurbulence` + `feColorMatrix` **estático** em data-URI, como o `body` já faz (REF-08 mostra o mesmo ruído animado; aqui ele fica parado). Tile pequeno (128–160 px), repetido.
- **Vinheta:** `radial-gradient` nas bordas, ou `mask-image` com gradiente radial (REF-39).
- **Pauta (`manuscript`):** `repeating-linear-gradient(to bottom, transparent 0 calc(var(--line) - 1px), var(--rule) calc(var(--line) - 1px) var(--line))`, alinhada ao `line-height` do texto (REF-40 usa SVG `<pattern>`; aqui é gradiente, mais barato). Margem: um `linear-gradient` vertical de 1 px.
- **Manchas (`weathered`):** o asset `ancient-parchment/stains.svg` como camada de `background-image`, sem desfoque.
- **Proibido:** shader WebGL (REF-27), ruído animado (REF-08, REF-69), `filter: blur`.

**Estratégia de estilo:** `@utility enchant-parchment` com `data-tone` e `data-layers="weathered manuscript"`. Todas as camadas num único `background-image` de um elemento: 0 nós extras.

**Pontos de integração:** Lore (`LoreTab`) e diário da mesa; `SpellDetails` (`spell-card/parts/SpellDetails.tsx`) no card aberto, só com o tema ativo.

## 4. API proposta

```ts
type ParchmentVariant = 'light' | 'dark' | 'weathered' | 'manuscript';

interface AncientParchmentProps {
  /** Base tone; follows data-theme when omitted. */
  tone?: 'light' | 'dark';
  /** Extra layers on top of the tone. */
  weathered?: boolean;
  manuscript?: boolean;
  asChild?: boolean;
  className?: string;
  children: React.ReactNode;
}
```

No registro, as variantes são `light | dark | weathered | manuscript`; na API, `weathered` e `manuscript` são camadas booleanas porque se combinam com o tom.

## 5. Personalização

| Propriedade       | Token                        | Padrão                                                          |
| ----------------- | ---------------------------- | --------------------------------------------------------------- |
| Cor da superfície | `--grimoire-surface`         | definida pelo tema                                              |
| Força do grão     | `--grimoire-texture-opacity` | `0.06`                                                          |
| Altura da pauta   | `--grimoire-rule-height`     | `1.5em` (casa com `text-body`)                                  |
| Cor da pauta      | `--grimoire-rule`            | `color-mix(in srgb, var(--grimoire-ornament) 10%, transparent)` |
| Vinheta           | `--grimoire-vignette`        | `0.12`                                                          |

## 6. Desempenho

- **DOM:** +0 (só `background` no próprio elemento).
- **Pintura:** um `background` de várias camadas, pintado uma vez por tamanho. Nenhuma animação.
- **SVG:** grão em data-URI (< 1 KB); manchas ≤ 2 KB em cache.
- **Várias instâncias:** pensado para 1 a 3 superfícies grandes (`F2`/`F3`). Em card repetido, o grão por card multiplica a pintura na rolagem; **não usar no card fechado**.
- **Celular:** o grão em tile pequeno é barato; testar a vinheta em telas longas (Lore).
- **Movimento reduzido:** nada se move.
- **Custo:** Baixo.
- **Benchmark (`/dev/grimoire`):** Lore longa (≥ 3 telas) com `manuscript` + `weathered`: rolagem de 5 s com CPU 4×, p95 ≤ 16,7 ms; contraste do texto medido pelo axe nos dois tons.

## 7. Acessibilidade

- **Contraste é o risco principal.** A tinta precisa de ≥ 4,5:1 sobre a superfície **somada ao grão e às manchas** (medir no pior ponto). O texto secundário (`--muted-foreground`) também.
- A pauta e as manchas são decorativas e nunca passam de ~10% de opacidade.
- **`forced-colors: active`:** remove grão, pauta e manchas; superfície vira `Canvas`.
- **Leitura:** a pauta precisa alinhar com o texto ou atrapalha; se não alinhar no Playground, sai.
- **Movimento:** nenhum.

## 8. Compatibilidade

| Superfície            | Uso                             | Variante                      |
| --------------------- | ------------------------------- | ----------------------------- |
| `spell-card-compact`  | **Não**                         | —                             |
| `spell-card-expanded` | Só no tema `ancient-manuscript` | `light`/`dark` + `manuscript` |
| `spellbook-page`      | Fundo da página no tema         | `weathered`                   |
| `character-sheet`     | Lore, cabeçalho                 | `manuscript`, `weathered`     |
| `inventory-card`      | Item antigo aberto              | `weathered`                   |
| `campaign`            | Diário da mesa                  | `manuscript`                  |

## 9. Assets

Os prompts de geração ficam fora do repositório.

- `ancient-parchment/stains.svg`: 3 manchas orgânicas nos cantos, cortadas pela borda (variante `weathered`).

O grão não é asset: é um data-URI gerado no CSS.

## 10. Referências

| ID     | Nome             | URL                                                                                              | Fonte      | Tecnologia                    | Licença                | Código?          | Relevância                             | Adaptação                              |
| ------ | ---------------- | ------------------------------------------------------------------------------------------------ | ---------- | ----------------------------- | ---------------------- | ---------------- | -------------------------------------- | -------------------------------------- |
| REF-08 | Film Grain       | https://github.com/isas1/forever-ai-components/blob/main/infinite/backgrounds/04-film-grain.html | forever    | `feTurbulence` + mix-blend    | MIT                    | **Reutilizável** | Grão                                   | Estático, como o `body`                |
| REF-40 | Grid Pattern     | https://magicui.design/docs/components/grid-pattern                                              | Magic UI   | SVG `<pattern>` com tracejado | MIT                    | **Reutilizável** | Pauta                                  | Refeita em `repeating-linear-gradient` |
| REF-39 | Dot Pattern      | https://magicui.design/docs/components/dot-pattern                                               | Magic UI   | Máscara de vinheta radial     | MIT                    | **Reutilizável** | Vinheta                                | Só a máscara                           |
| REF-90 | Seigaiha         | https://github.com/isas1/forever-ai-components/blob/main/infinite/hokusai/03-seigaiha.html       | forever    | Padrão SVG                    | MIT                    | **Reutilizável** | Guarda (endpaper) opcional             | Estático, a ~6%                        |
| REF-91 | Turbulent Banner | `infinite/svg-animations/04-turbulent-banner.html` (forever)                                     | forever    | `feTurbulence` animado (rAF)  | MIT                    | Só inspiração    | Borda gasta                            | Congelado                              |
| REF-27 | Paper Texture    | https://21st.dev/@paper-design/components/paper-texture                                          | 21st       | Shader WebGL                  | Apache-2.0 (declarada) | Só inspiração    | Referência visual de papel             | Nada da técnica                        |
| REF-69 | Noise Background | https://ui.aceternity.com/components/noise-background                                            | Aceternity | Ruído animado + blur          | Aceternity             | Só inspiração    | Confirma que o ruído deve ser estático | —                                      |

## 11. Questões em aberto

- O `ancient-manuscript` no modo claro muda muito a cara do app (o claro hoje é zinco neutro). Confirmar com a dona antes de implementar.
- Pauta alinhada ao texto funciona com o `text-body` (line-height 1.5) em pt e en, com quebras de parágrafo? Validar no Playground.
- Uma fonte de manuscrito (IM Fell English, REF-31) vem junto ou só no `arcane-title`?
