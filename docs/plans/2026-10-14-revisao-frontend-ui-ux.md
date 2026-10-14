# Revisão de frontend: UI, UX e arquitetura

Plano de 2026-10-14. Um PR por fase, cada um com screenshots antes/depois e o axe passando.

## Decisões

| Tema         | Decisão                                                                                                                        |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Identidade   | **Fantasia sóbria**: títulos em Cinzel, corpo em Inter. Clima de grimório, UI limpa de produto.                                |
| Tema         | **Só dark**, com tokens prontos para um light no futuro.                                                                       |
| Cor do herói | **Ajuste automático**: a cor escolhida vale para detalhes; texto e ícones usam uma variante clareada que sempre passa WCAG AA. |
| Entrega      | **Um PR por fase**, na ordem abaixo.                                                                                           |

## Princípios (valem para toda revisão)

1. **Hierarquia antes de decoração.** Em cada tela, o olho tem que achar primeiro o que importa (nome e PV na ficha, CTA na home). Efeitos só depois.
2. **Contraste AA sempre.** Texto ≥ 4.5:1, componentes e ícones ≥ 3:1. Nada de `opacity-60` em texto para "suavizar": usar o token de texto secundário.
3. **Nada que só funcione com hover.** Toda ação precisa estar visível ou acessível por foco ou toque (lápis de editar, lixeira do card).
4. **Alvo de toque ≥ 44px no mobile**, foco visível em todo elemento interativo.
5. **Estado sempre explícito:** carregando, vazio, erro, salvo / não salvo.
6. **Movimento com propósito** e respeitando `prefers-reduced-motion`.
7. **Um token para cada decisão.** Componentes não usam paleta crua (`zinc-800`, `orange-500`…), só tokens semânticos.

## Fase 0: rede de segurança ✅

- [x] Testes de screenshot no Playwright (`toHaveScreenshot`) para as telas principais em `chromium` e `mobile`: home, login, cadastro, lista de personagens, ficha (status, lore, magias), perfil.
- [x] Cada PR seguinte mostra o diff visual e atualiza os baselines de propósito (`npm run test:visual -- --update-snapshots`). Fica fora do CI: a renderização de fontes muda entre máquinas.
- [x] Toda tela também falha se rolar na horizontal.

## Fase 1: fundação (tokens e tipografia) ✅

O que está quebrado hoje: o app inteiro renderiza com fonte do sistema (Geist e Inter são baixadas e não usadas, Cinzel nunca é carregada) e o `tailwind.config.ts` é ignorado pelo Tailwind v4 (o `animate-shimmer`, por exemplo, não existe).

- [x] Migrar o que importa do `tailwind.config.ts` para `@theme` em `app/globals.css` e apagar o config.
- [x] Fontes: carregar Cinzel (display) e Inter (corpo) via `next/font`; manter Geist Mono só se for usada em números, senão usar `tabular-nums` da Inter. Remover a Geist Sans.
- [x] (fase 2) Escala tipográfica com nomes de papel: `display`, `title`, `heading`, `body`, `label`, `caption`. Cinzel só em `display`/`title` (nomes, títulos de seção), nunca em texto corrido nem em labels pequenos.
- [x] Tokens semânticos. **Mudança:** mantidos os nomes do shadcn (`background`, `card`, `muted`, `muted-foreground`…) em vez de `surface-1/2/3`, para o `shadcn add` continuar funcionando.
  - [x] status: `danger`, `success`, `info`, `warning` (substituem `red/green/blue/yellow`);
  - [x] `-flare` virou a variante de texto que sempre passa AA; `-on` é o texto sobre preenchimento (branco ou preto);
  - [x] `prefers-reduced-motion` global;
  - [x] (fase 2) trocar a paleta crua (`bg-zinc-950/20`…) pelos tokens. Raio e movimento não precisaram de token novo.
- [x] Cor do herói: um único sistema (`--character-color`). Remover o `--p-hue/--p-sat/--p-light` e o `hexToHsl` do `CharacterContext`. Gerar `--character-fg` (variante clareada em OKLCH para texto e ícones) e `--character-surface`.
- [x] Remover o que está morto: `glass-rebecca` e utilitários sem uso, o `ThemeProvider` vazio (ele também gera um 401 em `/api/profile` nas páginas públicas).
- [x] Ligar `color-contrast` no `e2e/a11y.spec.ts`, com casos de cor de destaque extrema (amarelo-claro, azul-marinho, vinho).
- [x] Texto secundário sem `opacity-*` (era o que falhava no contraste).
- [x] Corrigidos no caminho: cor padrão inválida do `CharacterCard`, scroll horizontal no celular (main sem `min-w-0`) e ficha vazando no desktop (`md:min-w-[1024px]`).

**Pronto quando:** fontes certas no browser, axe com contraste ligado e passando, nenhum token antigo sobrando.

## Fase 2: componentes base (`components/ui` e padrões) ✅

- [x] React 19: tirar o `forwardRef` dos 19 componentes (e dos 4 cards da ficha); `Button` sem a prop `destroy` e com estado `loading`.
- [x] Padrões novos, para acabar com as classes repetidas:
  - `FieldLabel` e `InlineField` (label + `GhostInput`, hoje repetido 4 vezes no `CharacterHeader`);
  - `SectionCard` composto (`SectionCard.Header/Title/Actions/Body`);
  - `StatBlock` (CA, iniciativa, deslocamento, dado de vida), no lugar do `StatBadge`;
  - `EmptyState` e `ErrorState` (no lugar do `bg-red-50` solto no `StatusView`);
  - `PageHeader` com um único sticky.
- [x] Escala tipográfica (`text-display/title/heading/body/label/caption` em `globals.css`), registrada no `cn()`: um papel substitui tamanho, peso, família e tracking vindos antes.
- [x] Padronizar foco, desabilitado, hover e área de toque em todos os primitivos (`focus-ring` e `touch-target`, 44px em tela de toque).
- [x] Zerar a paleta crua no app inteiro, não só em `components/ui`. Feitiços ganharam a família `--spell-color` (mesma lógica AA da cor do herói). Um teste (`design-tokens.unit.test.ts`) barra paleta crua e cor fixa em classe.

**Ficou para a fase 4:** o lápis de editar e a lixeira do card ainda dependem de hover; o card da lista e o botão flutuante do menu no celular.

## Fase 3: arquitetura da ficha ✅

Vem antes das telas porque mexe nos mesmos arquivos; refatorar depois seria fazer duas vezes.

- [x] Dividir o `CharacterContext` em `state / actions / meta`, com `actions` estável. As seções da ficha leem do contexto em vez de receber 6 a 12 props repassadas (`StatusView` → `CombatStatsSection` → `CombatHeader` → `CombatStatsDialog`). Componentes-folha (`HealthPointsCard`, `MagicSystemCard`, `AttributeCard`, `StatBlock`) continuam recebendo props.
- [x] `useCharacterEditor` → `useDraft` genérico: `useReducer` com `update(patch)`, rascunho derivado (servidor + edições), `commit` que mantém o que foi digitado durante o salvamento. Os 9 handlers viraram patches em `lib/character-sheet-updates.ts`.
- [x] Estado do diálogo de magias fora do editor (ficou na aba de magias, o único lugar que o abre). Lore e magias carregados na própria rota (`LoreTab`, `SpellsTab`), não por `pathname.endsWith(...)`. A lore tem rascunho próprio e salva só a lore.
- [x] Menos `'use client'`: `PageContainer`, `PageHeader`, o layout e as 4 páginas da ficha viram Server Components; a interatividade fica em ilhas (`CharacterSheetShell`, `SaveCharacterButton`, `LoreTab`, `SpellsTab`).
- [x] Um `UserProvider` só (o do root, com `user={null}`, sai).
- [x] Landmarks: um `<main>` por página (no layout raiz), um `<h1>` por página. O `a11y.spec.ts` verifica os dois em todas as telas testadas.

**Mudanças visíveis:** home e lista ganharam `<h1>` em Cinzel (a lista mostra o título também vazia ou carregando); o botão "Adicionar item" do inventário, que não fazia nada, fica desabilitado.

## Fase 4: telas e fluxos (UX) ✅

**Shell (header, menu, footer)**

- [x] Header mobile: logo sem quebrar linha, seletor de idioma compacto (ou dentro do menu).
- [x] Menu mobile: trocar o botão flutuante (que cobre conteúdo) por um botão no header; adicionar skip link.
- [x] Footer: compacto no mobile, links de acordo com o login; o iframe do GitHub Sponsors virou um link (some com bloqueadores).

**Home e auth**

- [x] Home com ~~`<h1>`~~ (feito na fase 3) e uma prévia da ficha.
- [x] Auth: ~~remover o gradiente azul→roxo dos 5 títulos, usar Cinzel + tokens~~ (feito na fase 2); erros inline no campo.

**Lista de personagens**

- [x] Card: corrigir a cor padrão (`hsl(var(--primary))` inválido) e o `` `${accentColor}1A` `` que só funciona com hex (resolvido na fase 1 pelo `characterTheme`).
- [x] Tirar o botão de dentro do link: um menu "…" com Excluir, visível também no toque.
- [x] Estado vazio com CTA, skeletons no carregamento.

**Ficha**

- [x] Hierarquia: nome em Cinzel; PV, CA e salvaguardas contra morte em destaque (testes contra a morte num card ao lado do PV); no mobile, combate primeiro.
- [x] Modelo de salvar: indicador "alterações não salvas", barra de salvar fixa (celular; no desktop o cabeçalho já é fixo), aviso ao sair da página com rascunho (fechar a aba e links internos para fora da ficha; trocar de aba da ficha mantém o rascunho), atalho Ctrl/Cmd+S, Descartar.
- [x] Edição visível sem hover (o lápis do nome sempre; o dos campos, no toque), campos numéricos com `inputmode` e −/+ no PV.
- [x] Movimento: tirar o `animate-pulse` do ícone de CA (saiu na fase 2 com o `StatBlock`) e do selo "online"; `rumble`, shockwave, distorções e shimmer só com movimento permitido.

## Checklist de cada PR

- Screenshots antes/depois (desktop e mobile) na descrição.
- `e2e/a11y.spec.ts` passando, com contraste.
- Sem paleta crua nem `style={{}}` de cor em arquivo tocado.
- Textos novos em `messages/` (pt e en).
