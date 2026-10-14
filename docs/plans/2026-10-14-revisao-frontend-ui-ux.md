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
- [ ] → fase 2. Escala tipográfica com nomes de papel: `display`, `title`, `heading`, `body`, `label`, `caption`. Cinzel só em `display`/`title` (nomes, títulos de seção), nunca em texto corrido nem em labels pequenos.
- [x] Tokens semânticos. **Mudança:** mantidos os nomes do shadcn (`background`, `card`, `muted`, `muted-foreground`…) em vez de `surface-1/2/3`, para o `shadcn add` continuar funcionando.
  - [x] status: `danger`, `success`, `info`, `warning` (substituem `red/green/blue/yellow`);
  - [x] `-flare` virou a variante de texto que sempre passa AA; `-on` é o texto sobre preenchimento (branco ou preto);
  - [x] `prefers-reduced-motion` global;
  - [ ] → fase 2: trocar a paleta crua (`bg-zinc-950/20`…) pelos tokens e criar tokens de raio/movimento se a troca mostrar necessidade.
- [x] Cor do herói: um único sistema (`--character-color`). Remover o `--p-hue/--p-sat/--p-light` e o `hexToHsl` do `CharacterContext`. Gerar `--character-fg` (variante clareada em OKLCH para texto e ícones) e `--character-surface`.
- [x] Remover o que está morto: `glass-rebecca` e utilitários sem uso, o `ThemeProvider` vazio (ele também gera um 401 em `/api/profile` nas páginas públicas).
- [x] Ligar `color-contrast` no `e2e/a11y.spec.ts`, com casos de cor de destaque extrema (amarelo-claro, azul-marinho, vinho).
- [x] Texto secundário sem `opacity-*` (era o que falhava no contraste).
- [x] Corrigidos no caminho: cor padrão inválida do `CharacterCard`, scroll horizontal no celular (main sem `min-w-0`) e ficha vazando no desktop (`md:min-w-[1024px]`).

**Pronto quando:** fontes certas no browser, axe com contraste ligado e passando, nenhum token antigo sobrando.

## Fase 2: componentes base (`components/ui` e padrões)

- [ ] React 19: tirar o `forwardRef` dos 19 componentes; `Button` sem a prop `destroy` e com estado `loading`.
- [ ] Padrões novos, para acabar com as classes repetidas:
  - `FieldLabel` e `InlineField` (label + `GhostInput`, hoje repetido 4 vezes no `CharacterHeader`);
  - `SectionCard` composto (`SectionCard.Header/Title/Actions/Body`);
  - `StatBlock` (CA, iniciativa, deslocamento, dado de vida);
  - `EmptyState` e `ErrorState` (no lugar do `bg-red-50` solto no `StatusView`);
  - `PageHeader` com um único sticky.
- [ ] Padronizar foco, desabilitado, hover e área de toque em todos os primitivos.
- [ ] Zerar a paleta crua dentro de `components/ui`.

## Fase 3: arquitetura da ficha

Vem antes das telas porque mexe nos mesmos arquivos; refatorar depois seria fazer duas vezes.

- [ ] Dividir o `CharacterContext` em `state / actions / meta`, com `actions` estável. Os componentes leem do contexto em vez de receber 6 a 12 props repassadas (`StatusView` → `CombatStatsSection` → `CombatHeader` → `CombatStatsDialog`).
- [ ] `useCharacterEditor`: trocar os 9 handlers quase iguais por um `useReducer` (`update(patch)`), e derivar o rascunho em vez de sincronizar com `useEffect` + `Promise.resolve()`.
- [ ] Estado do diálogo de magias local ao layout, fora do editor. Lore e magias carregados na própria rota, não por `pathname.endsWith(...)`.
- [ ] Menos `'use client'`: `PageContainer`, `PageHeader` e páginas sem interatividade viram Server Components.
- [ ] Um `UserProvider` só (o do root, com `user={null}`, sai).
- [ ] Landmarks: um `<main>` por página, um `<h1>` por página.

## Fase 4: telas e fluxos (UX)

**Shell (header, menu, footer)**

- [ ] Header mobile: logo sem quebrar linha, seletor de idioma compacto (ou dentro do menu).
- [ ] Menu mobile: trocar o botão flutuante (que cobre conteúdo) por um botão no header; adicionar skip link.
- [ ] Footer: compacto no mobile, links de acordo com o login, fallback para o iframe do GitHub Sponsors.

**Home e auth**

- [ ] Home com `<h1>` e uma prévia da ficha.
- [ ] Auth: remover o gradiente azul→roxo dos 5 títulos, usar Cinzel + tokens; erros inline no campo.

**Lista de personagens**

- [ ] Card: corrigir a cor padrão (`hsl(var(--primary))` inválido) e o `` `${accentColor}1A` `` que só funciona com hex.
- [ ] Tirar o botão de dentro do link: um menu "…" com Excluir, visível também no toque.
- [ ] Estado vazio com CTA, skeletons no carregamento.

**Ficha**

- [ ] Hierarquia: nome em Cinzel; PV, CA e salvaguardas contra morte em destaque; no mobile, combate primeiro.
- [ ] Modelo de salvar: indicador "alterações não salvas", barra de salvar fixa, aviso ao sair da página com rascunho, atalho Ctrl/Cmd+S.
- [ ] Edição visível sem hover (o lápis do nome), campos numéricos com `inputmode` e steppers.
- [ ] Movimento: tirar o `animate-pulse` do ícone de CA, `rumble` e VFX pesados só com movimento permitido.

## Checklist de cada PR

- Screenshots antes/depois (desktop e mobile) na descrição.
- `e2e/a11y.spec.ts` passando, com contraste.
- Sem paleta crua nem `style={{}}` de cor em arquivo tocado.
- Textos novos em `messages/` (pt e en).
