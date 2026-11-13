# Roadmap: do catálogo ao Playground

O épico fica no [Project 1](https://github.com/users/rebecamorais/projects/1), e cada fase ganha a sua sub-issue só quando começa. O status mora no Project, não aqui.

## Pontuação

Cada critério vale de 1 a 5:

- **Impacto:** quanta personalidade mágica o componente acrescenta.
- **Reuso:** quantas superfícies ele atende.
- **Simplicidade:** o esforço de implementar, inclusive a dependência de arte.
- **Desempenho:** se ele funciona com dezenas de instâncias.
- **Compatibilidade:** se ele encaixa no spellbook atual sem refazer nada.

As notas foram revisadas depois de ler o código das referências ([research/component-references.md](research/component-references.md)) e também estão no `component-registry.json` (`scores`).

| #   | Componente          | Impacto | Reuso | Simplicidade | Desempenho | Compat. | **Total** | Por quê                                                                                                                               |
| --- | ------------------- | ------- | ----- | ------------ | ---------- | ------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `rune-divider`      | 4       | 5     | 5            | 5          | 5       | **24**    | 1 nó com máscara (REF-26). A variante `geometric` usa runas reais da Noto Sans Runic (REF-84), sem precisar de arte                   |
| 2   | `sigil-watermark`   | 4       | 4     | 5            | 5          | 5       | **23**    | Generaliza o ícone de 128 px do `SpellVFX`. Referências MIT prontas para congelar (REF-92, REF-93, REF-94)                            |
| 3   | `school-emblem`     | 3       | 5     | 5            | 5          | 5       | **23**    | Formaliza a caixa de ícone do `SpellHeader`; o ganho visual é pequeno                                                                 |
| 4   | `enchanted-hover`   | 3       | 5     | 5            | 5          | 5       | **23**    | Só CSS. O `border-glow` já chega pelo `runic-border` `hover-glow`                                                                     |
| 5   | `arcane-title`      | 4       | 5     | 4            | 5          | 5       | **23**    | As variantes `runic` e `celestial` dão personalidade, mas cada fonte nova é um custo a medir                                          |
| 6   | `runic-border`      | 4       | 5     | 4            | 5          | 4       | **22**    | O anel com máscara MIT (REF-16), o cometa parado (REF-36) e as runas da fonte o tornam barato. Movimento só numa volta única (REF-34) |
| 7   | `arcane-corners`    | 4       | 5     | 4            | 5          | 4       | **22**    | A moldura que mais "encanta" o card, por 1 pseudo-elemento. Precisa de 2 SVGs (P1)                                                    |
| 8   | `sigil-pulse`       | 4       | 5     | 4            | 4          | 4       | **21**    | O `expanding-ring` em CSS puro (REF-102, REF-55, MIT)                                                                                 |
| 9   | `prepared-seal`     | 4       | 4     | 3            | 4          | 4       | **19**    | Marcador forte, mas o lacre de cera não tem referência e depende de arte                                                              |
| 10  | `magic-bookmark`    | 3       | 4     | 4            | 5          | 3       | **19**    | Ainda não existe "favorito" no app; as referências são fracas                                                                         |
| 11  | `astral-dust`       | 3       | 3     | 4            | 4          | 4       | **18**    | O padrão em gradiente custa 1 nó, mas não serve em card fechado: só no card aberto e na página                                        |
| 12  | `ancient-parchment` | 4       | 3     | 3            | 4          | 2       | **16**    | Risco de contraste e choque com o tema claro neutro; só serve como tema opcional                                                      |

## Primeiro grupo do Playground (decisão da dona)

**`runic-border`, `arcane-corners`, `sigil-watermark` e `rune-divider`.**

A combinação sugerida no prompt da #195 era RunicBorder, ArcaneCorners, SigilWatermark e AstralDust. A pesquisa confirmou as três primeiras e trocou a quarta:

- **`runic-border` entra.** A leitura do código mudou a nota dele. O anel sai de uma máscara MIT, as runas saem da fonte, e o único movimento é uma volta única, que roda no compositor. O `hover-glow` dele também entrega o `border-glow` do `enchanted-hover`.
- **`astral-dust` sai para a segunda leva.** O código das referências mostrou que estrelas e partículas só cabem no card aberto e no fundo de página (F2/F3). Na lista de cards fechados, que é o que mais aparece no spellbook, ele não pode entrar.
- **`rune-divider` entra no lugar.** Tem a maior nota, custa 1 nó e não depende de arte.
- **`school-emblem`, `enchanted-hover` e `arcane-title` ficam de fora**, apesar das notas altas. Entregam pouco além do que já existe: a caixa de ícone, o hover de borda e a Cinzel.

Juntos, os quatro montam o tema `arcane-scholar` em F1 e F2, sem animação contínua e sem dependência npm nova.

**Arte P1:** `arcane-corners/runic.svg`, `arcane-corners/geometric.svg` e `sigil-watermark/arcane.svg` (prompts mantidos fora do repositório). Nada trava o código, porque o Playground começa com placeholders e com as runas da fonte.

**Código que pode ser copiado** (MIT, com o aviso no `NOTICE.md`):

- a máscara do `shine-border` (REF-16);
- o `offset-path` do `border-beam` (REF-34), sem o motion;
- o cometa parado do Border Beam Panel (REF-36);
- os sigilos SVG do forever (REF-92, REF-93, REF-94), congelados.

Todo o resto é reimplementado a partir da técnica.

## Fases

| Fase                      | Entrega                                                                                                                                                                                                                                                                       | Pronto quando                                                                                                                                                                                                            |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **1. Catálogo** (esta)    | Os docs desta pasta e a spec-mãe                                                                                                                                                                                                                                              | As 12 specs, o registro, os temas, o guia de desempenho e este roadmap estão no `main`                                                                                                                                   |
| **2. Playground**         | Rota interna `/dev/grimoire`, fora da produção. Tokens `--grimoire-*` com os valores `legacy` em `:root`. Os 4 componentes do primeiro grupo em `src/frontend/components/grimoire/`, mais a Noto Sans Runic via `next/font` (subset `runic`, peso medido). Cenas de benchmark | Cada componente cumpre o orçamento da sua faixa ([research/performance-guidelines.md](research/performance-guidelines.md)), passa no axe nos dois temas, some em `forced-colors` e tem screenshot com movimento reduzido |
| **3. Spellbook**          | Tema `arcane-scholar` aplicado ao spellbook e ao card de magia, atrás do `data-grimoire`; o `legacy` segue como padrão                                                                                                                                                        | Sem regressão de rolagem nem de LCP contra o `legacy` (benchmark da fase 2)                                                                                                                                              |
| **4. Aparência da ficha** | Seletor de tema na página "Aparência da ficha"; a escolha é salva no personagem e vista por todos                                                                                                                                                                             | Precisa de uma decisão de dados (coluna nova); entra num plano próprio                                                                                                                                                   |
| **5. Resto**              | A segunda leva (`astral-dust`, `enchanted-hover` `surface-shimmer`/`gradient-highlight`, `sigil-pulse`, `prepared-seal`), depois os demais, e os 5 temas restantes, conforme a arte chegar                                                                                    | Uma sub-issue por grupo                                                                                                                                                                                                  |

### Detalhes da fase 2

- **Rota:** `app/[locale]/dev/grimoire/page.tsx`. Ela só existe fora da produção: retorna `notFound()` quando `process.env.NODE_ENV === 'production'` ou, melhor, quando uma flag de ambiente não está ligada. Ler `node_modules/next/dist/docs/` antes de escolher, porque o Next desta versão muda APIs. Ela fica fora do sitemap e do `robots`.
- **Cenas:** um spellbook com 60 cards de demo (reaproveitando os dados da demo `ada`), um card aberto, a ficha e o inventário. Um seletor de tema e um botão "reduzir movimento" para simular o modo.
- **Testes:** testes unitários dos componentes; spec visual do Playground (fora do CI, como o visual atual); spec de desempenho da rolagem (fora do CI no início); `design-tokens.unit.test.ts` cobrindo `src/frontend/components/grimoire/`; teste de contraste cobrindo os tokens dos temas.
- **Fora da fase 2:** tocar no spellbook de produção.

## Pendências fora do Grimoire, achadas na pesquisa

- O `NOTICE.md` não traz a atribuição CC BY 3.0 dos game-icons ([auditoria](research/repository-audit.md#ícones-e-svg)).
- O `turn-glow` é infinito. Daria para virar um pulso único na troca de turno, usando o `sigil-pulse` (questão aberta na [spec do sigil-pulse](catalog/interactions/sigil-pulse.md)).

## Issue-épico

Aberto como [#194](https://github.com/rebecamorais/rpg-world/issues/194), com a fase 1 em [#195](https://github.com/rebecamorais/rpg-world/issues/195). O texto original fica abaixo como referência.

**Título:** `Grimoire Enchantments: encantamentos visuais / Grimoire Enchantments: visual enchantments`

> ## Português
>
> Uma coleção de componentes visuais pequenos e combináveis (bordas, cantos, fundos, sigilos, divisórias, selos e efeitos de interação) que fazem o spellbook e a ficha parecerem um objeto encantado. Eles não dependem de nenhum sistema de RPG, e os temas de ficha saem da combinação deles. O visual de hoje continua como o tema `legacy`.
>
> - Spec: `docs/superpowers/specs/2026-11-13-grimoire-enchantments-design.md`
> - Catálogo: `docs/grimoire-enchantments/`
>
> Fases, cada uma com a sua sub-issue quando começar:
>
> 1. Catálogo (pesquisa e specs)
> 2. Playground interno em `/dev/grimoire`
> 3. Tema `arcane-scholar` no spellbook
> 4. Seletor de tema na Aparência da ficha
> 5. Os componentes e temas restantes
>
> ## English
>
> A collection of small, composable visual components (borders, corners, backgrounds, sigils, dividers, seals and interaction effects) that make the spellbook and character sheet feel like an enchanted object. They don't depend on any RPG system, and sheet themes are built by combining them. Today's look stays as the `legacy` theme.
>
> - Spec: `docs/superpowers/specs/2026-11-13-grimoire-enchantments-design.md`
> - Catalog: `docs/grimoire-enchantments/`
>
> Phases, each getting its own sub-issue when it starts:
>
> 1. Catalog (research and specs)
> 2. Internal playground at `/dev/grimoire`
> 3. `arcane-scholar` theme on the spellbook
> 4. Theme picker on the sheet Appearance page
> 5. The remaining components and themes

**Primeira sub-issue:** `Grimoire, fase 1: catálogo e specs / Grimoire, phase 1: catalog and specs`. Ela fecha com o PR destes docs.
