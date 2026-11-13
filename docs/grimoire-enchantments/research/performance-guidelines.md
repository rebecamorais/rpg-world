# Desempenho: orçamento, faixas e benchmark

O spellbook mostra dezenas de cards. Os enfeites não podem atrapalhar a rolagem, a primeira pintura nem a bateria do celular. Os números abaixo são **metas propostas**. Ainda não foram medidos; o Playground confirma ou ajusta.

## Princípios

1. **Estático por padrão.** Animação só por evento (hover, foco, ativação) e sempre com fim. Nenhum loop em card repetido.
2. **CSS e SVG, nunca Canvas ou WebGL** nos componentes. Um fundo de página em canvas só entraria com uma justificativa medida e pausando fora da tela e com a aba oculta.
3. **Sem JS no caminho visual.** Os encantamentos não usam `useState`, `useEffect` nem ouvintes de ponteiro. A exceção é o `sigil-pulse`, que precisa reiniciar uma animação: um `data-*` alternado pelo handler que já existe.
4. **Sem hidratação extra.** Encantamentos sem estado são Server Components ou spans puros dentro de componentes existentes. Nenhum `'use client'` novo só por enfeite.
5. **Animar só `transform` e `opacity`.** `box-shadow`, `filter`, `background-position` e `border-color` animados repintam. Só são aceitos em F2/F4 e por pouco tempo.
6. **Sem blur repetido.** `filter: blur()`, `backdrop-filter` e `drop-shadow` ficam proibidos em F1. Um brilho pode ser um gradiente radial pré-desenhado.
7. **Sem layout shift.** Os enfeites são `position: absolute` ou pseudo-elementos, ou ocupam espaço reservado desde o primeiro render.
8. **Movimento reduzido.** Todo efeito tem um estado final estático com sentido, e a regra global de `app/globals.css` só encurta a animação. O `forced-colors: active` esconde os enfeites puramente decorativos.
9. **Assets pequenos e cacheáveis.** Um SVG de máscara deve ter até ~2 KB depois de otimizado. Se é reutilizado, é servido de `public/` ou do sprite, não inline por card.

## Faixas de uso

| Faixa  | Superfície                                                  | Pode                                                                                                                              | Não pode                                                             | Exemplos                                                                                                                      |
| ------ | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **F1** | Card repetido (spellbook, inventário, lista de personagens) | Bordas e gradientes estáticos, `mask-image` com SVG cacheado, pseudo-elementos, transição curta de `opacity`/`transform` no hover | Loop, blur, filtro SVG por instância, SVG inline com mais de ~20 nós | `runic-border` estático, `arcane-corners`, `rune-divider`, `magic-bookmark`, `prepared-seal`, `enchanted-hover` (versão leve) |
| **F2** | Card aberto, diálogo, cabeçalho da ficha (1 a 3 por vez)    | Marca d'água grande, fundo temático, brilho de borda ativo, até 1 animação de entrada                                             | Loop infinito, canvas                                                | `sigil-watermark`, `school-emblem` grande, `astral-dust` no card                                                              |
| **F3** | Fundo de página (uma instância)                             | Gradientes em camadas, ruído estático, movimento ambiente lento e opcional com `prefers-reduced-motion: no-preference`            | Animar filtros, `background-attachment: fixed` com blur              | `astral-dust` de página, `ancient-parchment` de página                                                                        |
| **F4** | Interação ocasional (um evento)                             | Animação única de até 600 ms, com `transform`/`opacity`, em camada própria                                                        | Repetição sem novo evento, mudar o layout                            | `sigil-pulse`, desenho único dos cantos                                                                                       |

## Técnicas classificadas pelo código lido

As técnicas abaixo foram classificadas lendo a implementação real dos candidatos ([component-references.md](component-references.md)), não as descrições: em 8 dos 29 componentes do 21st, a descrição não deixa ver o custo real.

### Seguras em card repetido (F1)

- **Borda desenhada só com máscara** (`mask-composite: exclude`) num pseudo-elemento, estática (REF-16, REF-21). É 1 camada e não repinta no scroll.
- **Gradiente cônico parado** como cometa (REF-36), sem animar o ângulo.
- **Padrões de fundo** em um `radial-gradient` ou `repeating-linear-gradient` (REF-41, REF-40). São mais baratos que um SVG `<pattern>` por card, e muito mais baratos que um `<circle>` por ponto (a versão atual do REF-39).
- **Faixa SVG cacheada como máscara** sobre `currentColor` (REF-26): 1 nó, e a cor vem do token.
- **Runas em texto** (Noto Sans Runic, REF-84): é texto comum, sem SVG por card. O custo é o download da fonte, uma vez só, e precisa ser medido.
- **Transição de `opacity`** no `:hover` e no `:focus-visible`, e `animation-play-state` pausado até o hover (REF-49).

### Adequadas ao card aberto (F2)

- Sigilos grandes estáticos com máscara e vinheta (REF-92, REF-93, REF-94 congelados).
- Fundos em camadas (os 6 fundos atuais do `SpellVFX`).
- Molduras mais elaboradas (REF-07, REF-87) e foil sem tilt (REF-48), só em destaque.

### Adequadas ao fundo de página (F3)

- Campo de estrelas estático em tile (a ideia do tile de REF-43) e cintilar CSS lento (REF-88), sempre com movimento reduzido.
- Ruído `feTurbulence` estático (REF-08, como o `body` atual), gradientes complexos, estrela cadente rara (REF-67).

### Efeito único por evento (F4)

- Volta única pela borda com `offset-path` e `@keyframes` CSS (REF-34, REF-18).
- Giro de quadrado cônico por `transform`, que roda no compositor (REF-17).
- Anel que se expande por `transform: scale`, removido no `animationend` (REF-50 portado, REF-102).
- Pulso de `box-shadow` único (REF-56) e uma chamada WAAPI isolada (REF-53, REF-104).

### Restritas ou proibidas

O código mostrou cada um destes problemas:

| Técnica                                          | Problema                        | Visto em                                         |
| ------------------------------------------------ | ------------------------------- | ------------------------------------------------ |
| Laço de `@property --angle` com `conic-gradient` | Repinta a cada quadro           | REF-35                                           |
| rAF ou timeline JS por instância                 | CPU contínua por card           | REF-19, REF-37, REF-43, REF-45, REF-36 (animado) |
| Listener de ponteiro global por instância        | N listeners em `document`       | REF-47                                           |
| `setState`/`setInterval` em loop                 | Re-render contínuo              | REF-23, REF-43, REF-44                           |
| Animar `width`/`height`                          | Layout a cada quadro            | REF-50 (original)                                |
| Blur e `backdrop-filter` em card                 | Pintura cara no celular         | REF-13, REF-59, REF-44                           |
| Canvas/WebGL por card                            | Memória e GPU por instância     | REF-09, REF-24, REF-27, REF-70                   |
| SMIL (`<animate>`)                               | Ignora `prefers-reduced-motion` | REF-85 (converter para CSS)                      |
| Animar `background-position` sem parar           | Repinta a cada quadro           | REF-16 animado, REF-52 em loop: só uma vez       |

## Custo da fonte de runas

Para usar a Noto Sans Runic (REF-84) nas bordas e divisórias, o Playground mede:

1. o peso do subset `runic` servido pelo `next/font`;
2. se ela entra no carregamento inicial ou só quando um tema a usa (`display: swap`; um tema sem runas não a carrega).

**Meta:** ≤ 15 KB woff2 e nenhum impacto no LCP do spellbook `legacy`.

## Orçamento inicial (proposto)

Para um spellbook com 60 cards, num celular intermediário com CPU 4× mais lenta no DevTools:

| Métrica                             | Meta                                                                                 | Como medir                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| Nós DOM extras por card (F1)        | ≤ 4                                                                                  | Contar no Playground (`querySelectorAll('*')` antes e depois)     |
| Nós DOM extras por card aberto (F2) | ≤ 12                                                                                 | Idem                                                              |
| Bytes de asset por componente       | ≤ 2 KB por SVG (gzip), ≤ 8 KB por tema                                               | `ls -l` após o SVGO                                               |
| CSS novo da coleção                 | ≤ 6 KB gzip                                                                          | Tamanho do chunk CSS no `next build`                              |
| JS novo da coleção                  | ≤ 1 KB gzip (só o `sigil-pulse`)                                                     | Bundle analyzer                                                   |
| Rolagem do spellbook                | Sem frames longos: p95 do frame ≤ 16,7 ms, 0 frames acima de 50 ms em 5 s de rolagem | Performance panel / `PerformanceObserver('long-animation-frame')` |
| Pintura no hover                    | Área repintada só no card em foco                                                    | Paint flashing                                                    |
| CLS ao ativar ou abrir              | 0                                                                                    | `layout-shift` no `PerformanceObserver`                           |
| LCP do spellbook                    | Regressão ≤ 5% contra o `legacy`                                                     | Lighthouse mobile, mediana de 5 execuções                         |
| Memória                             | Regressão ≤ 5% do heap JS; sem camadas compostas novas por card em repouso           | Painel Layers / memória                                           |

## Plano de benchmark (Playground)

1. **Cenas fixas:** spellbook com 60 cards (todos fechados), com 1 aberto, ficha completa e inventário com 40 itens. Cada cena roda com o tema `legacy` e com o tema candidato.
2. **Matriz:** desktop sem limitação × celular emulado (CPU 4×, Moto G Power) × `prefers-reduced-motion` ligado e desligado × tema claro e escuro.
3. **Automação:** um spec Playwright em `e2e/` que rola a lista por 5 s e coleta `long-animation-frame` e `layout-shift`, além de contar os nós. Ele roda fora do CI no início, como o visual, e entra no CI quando os números estabilizarem.
4. **Manual:** paint flashing e painel Layers no Chrome; Safari iOS de verdade antes de aprovar F3.
5. **Critério de aceite** de cada componente no Playground: cumprir o orçamento da sua faixa, passar no axe nos dois temas, ter screenshot com movimento reduzido igual ao estado final e sumir em `forced-colors`.

## O que já existe e respeita isto (verificado)

- O `SpellCard` usa `content-visibility: auto`: cards fora da tela nem pintam.
- O `SpellVFX` só monta no card aberto (F2).
- O grão do `body` é um `feTurbulence` estático num data-URI pequeno (F3).
- O `turn-glow` é infinito, mas tem uma instância só. Não deve ser copiado para F1.
