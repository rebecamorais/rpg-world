# Tema claro e contraste AA — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tema claro opcional (escuro continua padrão), trocado por um botão no topo, com contraste WCAG AA garantido por testes nos dois temas.

**Architecture:** O tema é `data-theme` no `<html>`, posto por um script inline no `<head>` a partir do cookie `theme` (sem piscar em páginas pré-renderizadas). Os tokens claros redefinem os do `:root` em `app/globals.css`. As fórmulas das cores derivadas (`-flare`, `-on`) são espelhadas em TypeScript (`src/frontend/lib/contrast.ts`) para um teste varrer o círculo de cores, e um teste de sincronia garante que CSS e TS usam os mesmos números.

**Tech Stack:** Next.js 16 (App Router, next-intl), Tailwind v4, Vitest, Playwright + @axe-core/playwright.

**Spec:** `docs/superpowers/specs/2026-11-10-tema-claro-e-contraste-design.md`. Leia junto com este plano.

## Global Constraints

- Escuro é o padrão. Sem cookie, ou com valor desconhecido, vale `dark`. O tema do sistema operacional é ignorado.
- O atributo é `data-theme="dark" | "light"` no `<html>`, não uma classe `.dark`.
- Cookie `theme`: `path=/; max-age=31536000; SameSite=Lax`.
- Contraste mínimo: texto 4.5:1. Borda de campo (`--input`) e anel de foco (`--ring`) 3:1.
- Componentes usam só tokens. Nada de paleta crua do Tailwind (`zinc-*`, `text-white`…). Exceções: marcas de terceiros (Google, Ko-fi, Discord) e os templates de e-mail.
- O tema escuro só muda em três pontos: `-on` corrigido, `color-scheme` e as linhas do combate.
- Textos novos em `messages/en.json` e `messages/pt.json` (es e sv vêm do Crowdin).
- Comentários no código em inglês, como no resto do repo. Mensagens de commit em pt / en, no formato do repo (`tipo: pt / en`).
- Um PR no fim, com commits por tarefa.

## Review Focus

1. **Cookie `theme` com valor inválido** (`neon`, vazio, `light;x`): a página abre no escuro e o botão funciona. Teste na Tarefa 3 (`parseTheme`) e no script inline.
2. **Dialogs e drawers em portal** (fora do `.character-context`) no tema claro: precisam ficar claros e com contraste. Coberto pelo axe nos dois temas, nos testes de dialog de `conditions` e `a11y` (Tarefa 5).
3. **Sistema operacional em modo claro e sem cookie:** abre escuro. Teste e2e com `colorScheme: 'light'` na Tarefa 5.
4. **Navegação no cliente depois da troca:** ir de uma página para outra sem recarregar mantém o tema. Teste e2e na Tarefa 5.
5. **Linha de combate apagada com hover e foco:** volta ao destaque total e continua passando no axe. Teste na Tarefa 4.

---

### Task 1: Modelo de contraste e varredura das cores livres

**Files:**
- Create: `src/frontend/lib/contrast.ts`
- Test: `src/frontend/lib/contrast.unit.test.ts`

**Interfaces:**
- Produces:
  - `type Rgb = { r: number; g: number; b: number }` (0–1, sRGB)
  - `type ThemeName = 'dark' | 'light'`
  - `parseHex(hex: string): Rgb`, `toHex(c: Rgb): string`
  - `relativeLuminance(c: Rgb): number` (WCAG, sRGB linearizado por partes)
  - `contrastRatio(a: Rgb, b: Rgb): number`
  - `over(fg: Rgb, alpha: number, bg: Rgb): Rgb` (composição alfa)
  - `toOklch(c: Rgb): { l: number; c: number; h: number }`, `fromOklch(o): Rgb` (com mapeamento de gama: reduz o croma mantendo L e h até caber no sRGB)
  - `flare(color: Rgb, theme: ThemeName): Rgb` (escuro: `l = max(l, FLARE_MIN_L_DARK)`; claro: `l = min(l, FLARE_MAX_L_LIGHT)`; os dois com `c = min(c, FLARE_MAX_C)`)
  - `onColor(color: Rgb): Rgb` (preto se `0.2126·r^2.2 + 0.7152·g^2.2 + 0.0722·b^2.2 > ON_LUMINANCE`, senão branco)
  - Constantes exportadas: `FLARE_MIN_L_DARK = 0.74`, `FLARE_MAX_C = 0.2`, `FLARE_MAX_L_LIGHT` e `ON_LUMINANCE = 0.179` (calibrar `FLARE_MAX_L_LIGHT` no passo 4, ponto de partida `0.5`)
  - `SURFACES: Record<ThemeName, Record<'background' | 'card' | 'popover' | 'muted' | 'veilOverBlack' | 'veilOverWhite', Rgb>>`, com o fundo, o painel, o popover e o muted de cada tema (os mesmos hex do `globals.css`) e o véu da ficha, `over(background, 0.85, preto|branco)`.

O `-on` usa luminância com gama 2.2, não limite de L em OKLCH, porque a CSS consegue calcular isso em `color(from X srgb …)` com `pow()` (Tarefa 2), e a luminância é o que o WCAG mede. 0.179 fica no meio da faixa em que branco e preto passam (Y entre 0.175 e 0.183).

- [ ] **Step 1: Write the failing tests**

```ts
describe('contrastRatio', () => {
  it('white on black is 21', () => expect(contrastRatio(parseHex('#fff'), parseHex('#000'))).toBeCloseTo(21, 1));
  it('white on #ef4444 fails AA (the bug being fixed)', () =>
    expect(contrastRatio(parseHex('#ffffff'), parseHex('#ef4444'))).toBeCloseTo(3.76, 1));
});

describe('oklch round trip', () => {
  it.each(['#663399', '#ef4444', '#fde047', '#09090b'])('%s', (hex) =>
    expect(toHex(fromOklch(toOklch(parseHex(hex))))).toBe(hex));
});

// The free picker: every hue, from near black to near white, saturated to grey
const sweep = () => { /* h 0..355 step 5 × l 0.05..0.97 step 0.04 × c in [0, 0.05, 0.12, 0.2, 0.37], via fromOklch */ };

describe.each(['dark', 'light'] as const)('flare on %s', (theme) => {
  it('reaches 4.5:1 on every surface of the theme, for every color', () => {
    const failures = sweep().flatMap((color) => Object.entries(SURFACES[theme])
      .filter(([, bg]) => contrastRatio(flare(color, theme), bg) < 4.5)
      .map(([name, bg]) => `${toHex(color)} on ${name}: ${contrastRatio(flare(color, theme), bg).toFixed(2)}`));
    expect(failures).toEqual([]);
  });
});

it('onColor reaches 4.5:1 on every solid color', () => {
  const failures = sweep().filter((c) => contrastRatio(onColor(c), c) < 4.5).map(toHex);
  expect(failures).toEqual([]);
});

it('the preset accent colors get black text', () => {
  for (const hex of ['#ef4444', '#3b82f6', '#ec4899', '#a855f7'])
    expect(toHex(onColor(parseHex(hex)))).toBe('#000000');
});
```

A mensagem da falha lista cada cor e superfície que reprovou, com a razão de contraste encontrada.

- [ ] **Step 2: Run, verify it fails**

Run: `npx vitest run --config ./test/vitest.config.unit.ts src/frontend/lib/contrast.unit.test.ts`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement `contrast.ts`.** Use as matrizes OKLab ↔ sRGB linear de Björn Ottosson, as mesmas da CSS Color 4. Sem dependência nova. O mapeamento de gama de `fromOklch` faz busca binária no croma.

- [ ] **Step 4: Calibrate.** Rode o teste. Se `flare` reprovar no claro, baixe `FLARE_MAX_L_LIGHT` em passos de 0.01 até passar com folga: a pior razão encontrada precisa ficar ≥ 4.6, porque o navegador pode mapear a gama de outro jeito. Se reprovar no escuro, **não** mude `0.74`: é o valor atual do escuro. Nesse caso, pare e reporte quais cores e superfícies reprovaram. O `onColor` precisa passar com `0.179`. Se não passar, reporte também.

- [ ] **Step 5: Run, verify it passes** (o mesmo comando). Expected: PASS.

- [ ] **Step 6: Commit** — `test: modelo de contraste das cores derivadas / contrast model for derived colors`

### Task 2: Tokens do tema claro e fórmulas derivadas no CSS

**Files:**
- Modify: `app/globals.css`, nos tokens (linhas 1–55), nas derivadas (57–116) e no comentário do topo
- Test: `src/frontend/lib/theme-tokens.unit.test.ts` (novo)

**Interfaces:**
- Consumes: `contrastRatio`, `over`, `parseHex`, `SURFACES` e as constantes da Tarefa 1.
- Produces: os seletores claros, usados pelas Tarefas 3–6:
  - `:root[data-theme='light']` para os tokens.
  - `:root[data-theme='light'], [data-theme='light'] .character-context, [data-theme='light'] .spell-context` para as derivadas. A especificidade (0,2,0) vence `.character-context` (0,1,0).

- [ ] **Step 1: Write the failing test.** O teste lê `app/globals.css` com `fs` e extrai os hex do primeiro bloco `:root {` (escuro) e de `:root[data-theme='light'] {` (claro), com a herança do escuro para o que o claro não redefine. Depois confere:

```ts
const TEXT = ['foreground', 'muted-foreground', 'card-foreground', 'popover-foreground', 'secondary-foreground', 'accent-foreground'];
const SURFACE = ['background', 'card', 'popover', 'muted', 'secondary'];
it.each(['dark', 'light'])('%s: text tokens reach 4.5:1 on every surface and on the sheet veil', ...);
it.each(['dark', 'light'])('%s: placeholder reaches 4.5:1 on background, card and input surfaces', ...);
it.each(['dark', 'light'])('%s: accent-foreground on accent, destructive-foreground on destructive reach 4.5:1', ...);
it.each(['dark', 'light'])('%s: --input border reaches 3:1 on background and card', ...);
it('SURFACES in contrast.ts match globals.css', ...); // background, card, popover e muted iguais nos dois temas
it('globals.css uses the same numbers as contrast.ts', () => {
  expect(css).toContain(`max(l, ${FLARE_MIN_L_DARK})`);
  expect(css).toContain(`min(l, ${FLARE_MAX_L_LIGHT})`);
  expect(css).toContain(`min(c, ${FLARE_MAX_C})`);
  expect(css).toContain(`(${ON_LUMINANCE} -`);
});
```

Pares que hoje reprovam no escuro aparecem aqui e precisam ser corrigidos no escuro também. Isso entra na regra de "dark só muda nos três pontos" como correção de AA. Anote no PR.

- [ ] **Step 2: Run, verify it fails** — `npx vitest run --config ./test/vitest.config.unit.ts src/frontend/lib/theme-tokens.unit.test.ts`. Expected: FAIL (no light block).

- [ ] **Step 3: Write the light tokens** em `:root[data-theme='light']`, com os valores iniciais da spec, seção 3: fundo `#fafafa`, painel `#f4f4f5`, popover `#ffffff`, texto `#09090b`, secundário `#52525b`, placeholder `#71717a`, bordas `#e4e4e7`, `--accent` lilás claro com `--accent-foreground` escuro e `--overlay` mais leve. As cores de status ficam mais escuras se o teste pedir. Ponha `color-scheme: dark` no `:root` e `color-scheme: light` no claro. `--input` precisa de 3:1, o que um `#e4e4e7` não dá: use um cinza mais escuro só no `--input`. Atualize o comentário "dark only" do topo. No claro, o brilho das moedas, o `turn-glow` e o gradiente do `body` (brand a 82% de transparência) ficam mais discretos (decisão do builder).

- [ ] **Step 4: Write the derived formulas.**
  - Escuro (`:root, .character-context, .spell-context` e o bloco `@supports`):
    - `-on`: troque o `oklch(... clamp(0, (0.68 - l) * 1000, 1) 0 0)` por `color(from X srgb v v v)`, com `v = clamp(0, (0.179 - (0.2126 * pow(r, 2.2) + 0.7152 * pow(g, 2.2) + 0.0722 * pow(b, 2.2))) * 100000, 1)`. Vale para `--primary-on` e `--character-on`.
    - Status `-flare`: ganham uma versão OKLCH no `@supports`, igual à de primary (`max(l, 0.74) min(c, 0.2)`).
  - Claro (seletor da seção Interfaces):
    - Reserva sem `@supports`: `color-mix(in oklch, X, black 45%)` para `-flare` e `color-mix(in srgb, X, black 30%)` para status.
    - Dentro de `@supports`: `oklch(from X min(l, FLARE_MAX_L_LIGHT) min(c, 0.2) h)` para primary, character, spell e as quatro cores de status.
    - `-surface`, `-muted` e `-glow` com mais opacidade, se ficarem invisíveis no claro (decisão do builder).
  - Os dois lados ganham um comentário que aponta para `src/frontend/lib/contrast.ts` como fonte dos números.

- [ ] **Step 5: Run, verify it passes** (o mesmo comando, mais o da Tarefa 1). Expected: PASS.

- [ ] **Step 6: Varredura de cor fixa.** Run: `grep -rnE "\b(text|bg|border|ring|fill|stroke|from|to|via)-(white|black|zinc|gray|neutral|slate|stone)(-[0-9]+)?\b|#[0-9a-fA-F]{3,6}\b" src/frontend app --include=*.tsx | grep -v unit.test`. Expected: só o logo do Google em `LoginForm.tsx`, o padrão `#663399` de `ProfileForm.tsx` e o `characterTheme('#6d28d9')` de `SheetPreview.tsx`. Qualquer outra ocorrência vira token.

- [ ] **Step 7: Commit** — `feat: tokens do tema claro e contraste AA das cores derivadas / light theme tokens and AA derived colors`

### Task 3: Escolha do tema — cookie, script inline, botão e toasts

**Files:**
- Create: `src/frontend/lib/theme.ts`, `src/frontend/hooks/useTheme.ts`, `src/frontend/components/layout/ThemeToggle.tsx`
- Modify: `app/[locale]/layout.tsx:72-80` (script no `<head>`), `src/frontend/components/layout/HeaderSessionActions.tsx` (botão), `src/frontend/components/ui/sonner.tsx`, `src/frontend/components/ui/icon.tsx` (registrar `Sun` e `Moon` do lucide), `messages/en.json`, `messages/pt.json`
- Test: `src/frontend/lib/theme.unit.test.ts`, `src/frontend/components/layout/ThemeToggle.unit.test.tsx`

**Interfaces:**
- Produces:
  - `THEMES = ['dark', 'light'] as const`, `type Theme = (typeof THEMES)[number]`, `DEFAULT_THEME: Theme = 'dark'`, `THEME_COOKIE = 'theme'`
  - `parseTheme(value: string | undefined | null): Theme`
  - `themeCookie(theme: Theme): string`, que devolve `theme=<t>; path=/; max-age=31536000; SameSite=Lax`
  - `THEME_SCRIPT: string`, o script inline: lê o cookie e põe `document.documentElement.dataset.theme` só com `light` ou `dark`, senão `dark`
  - `applyTheme(theme: Theme): void`, que grava o cookie e o `dataset.theme`
  - `useTheme(): { theme: Theme; setTheme: (t: Theme) => void }`, com `useSyncExternalStore` sobre um `MutationObserver` do atributo `data-theme` do `<html>` (snapshot do servidor `'dark'`)
  - `<ThemeToggle />`, sem props
  - Mensagens `common.useLightTheme` ("Use light theme" / "Usar tema claro") e `common.useDarkTheme` ("Use dark theme" / "Usar tema escuro")

- [ ] **Step 1: Write the failing tests.**
  - `theme.unit.test.ts`:
    - `parseTheme`: `'light'`→`'light'`, `'dark'`→`'dark'`, e `'neon'`, `''`, `undefined` e `'LIGHT'` viram `'dark'`.
    - `themeCookie('light')` devolve a string exata das Global Constraints.
    - `THEME_SCRIPT`, rodado com `new Function` sobre um `document` falso: cookie `a=1; theme=light` dá `light`, `theme=neon` dá `dark`, e sem cookie dá `dark`.
  - `ThemeToggle.unit.test.tsx` (jsdom):
    - No escuro, o botão tem o nome "Use light theme".
    - Clicar põe `data-theme="light"` no `<html>`, grava o cookie e muda o nome para "Use dark theme".
- [ ] **Step 2: Run, verify they fail** — `npx vitest run --config ./test/vitest.config.unit.ts src/frontend/lib/theme.unit.test.ts src/frontend/components/layout/ThemeToggle.unit.test.tsx`
- [ ] **Step 3: Implement.**
  - O `THEME_SCRIPT` entra no `<head>` do layout raiz, ao lado do script de `data-session`, como outro `<script dangerouslySetInnerHTML>`. A CSP já permite script inline (`shared/http/security-headers.ts`). O `<html>` já tem `suppressHydrationWarning`.
  - O `ThemeToggle` é um `Button variant="ghost" size="sm"` com o mesmo estilo do `LanguageSwitcher` (`text-muted-foreground hover:text-foreground`). O ícone é `Sun` no escuro (a ação é "ir para o claro") e `Moon` no claro, e o `aria-label` vem de `useLightTheme` / `useDarkTheme`.
  - O botão fica em `HeaderSessionActions`, junto do suporte e do idioma, fora dos ramos de sessão, para aparecer com e sem login, no desktop e no celular.
  - `sonner.tsx` usa `useTheme().theme` em vez de `"dark"` e perde o comentário "Dark only".
- [ ] **Step 4: Run, verify they pass**, mais `npm run lint` e `npx tsc --noEmit`. Expected: tudo limpo.
- [ ] **Step 5: Commit** — `feat: botão de tema claro e escuro no topo / light and dark theme toggle in the header`

### Task 4: Linhas de combate fora da vez legíveis

**Files:**
- Modify: `src/frontend/components/combat/CombatRow.tsx:93-96`
- Modify: `e2e/conditions.spec.ts:132-136`
- Test: `src/frontend/components/combat/CombatRow.unit.test.tsx`, com um caso novo

**Interfaces:** nenhuma nova.

- [ ] **Step 1: Write the failing unit test** — `it('a waiting row fades only its art, never its text')`: renderiza uma linha que não é a atual e está fechada, e verifica que o `<article>` da linha não tem `opacity-` nem `grayscale` na classe. O avatar e a faixa de cor podem ter.
- [ ] **Step 2: Run, verify it fails** — `npx vitest run --config ./test/vitest.config.unit.ts src/frontend/components/combat/CombatRow.unit.test.tsx`
- [ ] **Step 3: Implement.** Tire `opacity-75 grayscale-[.7]` da linha. A linha em espera apaga só o avatar e a faixa de cor (`opacity-60 grayscale`, com volta no `group-hover` e no `group-focus-within`), e o nome passa a `text-muted-foreground`, que já passa AA. A linha atual continua com `border-primary animate-turn-glow`. Em `conditions.spec.ts`, troque a linha 134 por `expect(await violations(page, '[aria-label="Combat order"]')).toEqual([])` e apague o comentário que justificava a exceção.
- [ ] **Step 4: Run, verify the unit test passes.** O e2e roda na Tarefa 5.
- [ ] **Step 5: Commit** — `fix: linhas fora da vez passam no contraste / waiting combat rows pass contrast`

### Task 5: Axe nos dois temas e e2e do tema

**Files:**
- Create: `e2e/support/axe.ts`, `e2e/theme.spec.ts`
- Modify: `e2e/a11y.spec.ts`, `e2e/conditions.spec.ts`, `e2e/delete-account.spec.ts`, `e2e/parties.spec.ts:385`, `e2e/profile.spec.ts:105` (trocam o `AxeBuilder` local pelo helper)

**Interfaces:**
- Consumes: `THEMES` (Tarefa 3) e o seletor `data-theme` (Tarefa 2).
- Produces: `violations(page: Page, opts?: { include?: string; disabledRules?: string[] }): Promise<{ theme: Theme; id: string; impact: string; nodes: string[] }[]>`. Roda o axe com as tags `wcag2a`, `wcag2aa`, `wcag21a` e `wcag21aa`, uma vez por tema: põe `document.documentElement.dataset.theme` e espera dois `requestAnimationFrame` antes de cada análise. Filtra `serious` e `critical`, e no fim restaura o tema de antes.

- [ ] **Step 1: Write `e2e/support/axe.ts`** e troque os cinco helpers locais por ele. Cada `expect(await violations(...)).toEqual([])` continua igual, e agora cobre os dois temas.
- [ ] **Step 2: Acrescente ao teste de cores de `a11y.spec.ts`** (linha 84) as cores prontas `#ef4444`, `#3b82f6`, `#ec4899` e `#a855f7`, ao lado de `#fde047`, `#1e1b4b` e `#7f1d1d`. Atualize o comentário: o texto se ajusta nos dois temas.
- [ ] **Step 3: Write `e2e/theme.spec.ts`:**
  - `abre escuro sem cookie, mesmo com o sistema em claro`: `test.use({ colorScheme: 'light' })` e `goto('/')`, e `html` tem `data-theme="dark"`.
  - `o botão troca, grava e a página recarrega no tema escolhido`: clica em "Use light theme" (com `hydrated`), e `data-theme` vira `light`. O cookie `theme` vale `light`, `reload()` mantém `light`, e no reload o atributo já está `light` em `page.waitForLoadState('domcontentloaded')`, antes da hidratação.
  - `cookie inválido abre escuro`: `context.addCookies([{ name: 'theme', value: 'neon', url: BASE_URL }])` e `data-theme` fica `dark`.
  - `navegação sem recarregar mantém o tema`: liga o claro em `/`, clica no link para `/features` e `data-theme` continua `light`.
  - `linha em espera com hover continua passando`: num combate com duas linhas, como em `conditions.spec.ts`, `hover()` na linha em espera e `violations(page, { include: '[aria-label="Combat order"]' })` vazio.
- [ ] **Step 4: Run** — `npm run test:e2e -- e2e/a11y.spec.ts e2e/conditions.spec.ts e2e/theme.spec.ts e2e/profile.spec.ts e2e/parties.spec.ts e2e/delete-account.spec.ts`. Expected: todos passam. Precisa do banco de teste local (veja a memória de ambiente: `.env.test`, o lock do `next dev`). Se o axe apontar contraste no claro, corrija o token na Tarefa 2 e rode a Tarefa 2 de novo.
- [ ] **Step 5: Commit** — `test: axe nos temas claro e escuro / axe on light and dark themes`

### Task 6: Screenshots, documentação e PR

**Files:**
- Modify: `e2e/visual/screens.visual.spec.ts`, os baselines em `e2e/visual/__screenshots__/`, `ACCESSIBILITY.md`

- [ ] **Step 1: Acrescente os screenshots do claro:** uma página pública (`/`), a ficha do `heroCharacter` e o combate. Use os mesmos passos dos screenshots escuros, com o cookie `theme=light` posto antes do `goto`, e o nome com sufixo `-light`.
- [ ] **Step 2: Run** `npm run test:visual -- --update-snapshots` e confira as imagens novas e as alteradas. O escuro só pode mudar no combate, nos controles nativos (`color-scheme`) e no texto sobre cor cheia que deixou de ser branco. Qualquer outra diferença no escuro é um bug: volte à tarefa que a causou.
- [ ] **Step 3: `ACCESSIBILITY.md`.** Em "Como verificamos": o axe roda nos dois temas, os tokens e as cores livres têm teste de contraste. Em "Limitações conhecidas": troque "Só tema escuro" por "Sem modo de alto contraste", e acrescente a reserva para navegadores sem `oklch(from …)`, que é só melhor esforço.
- [ ] **Step 4: Verificação completa** — `npm run lint`, `npx tsc --noEmit`, `npm run test:unit` e `npm run test:e2e`. Expected: tudo passa.
- [ ] **Step 5: Commit** — `docs: tema claro na acessibilidade e screenshots / light theme in accessibility docs and screenshots`
- [ ] **Step 6: Push e PR.** O título e o corpo vão em pt e en. O corpo traz screenshots de antes e depois nos dois temas, a lista de mudanças visíveis no escuro (texto preto em vermelho, azul, rosa e roxo claro; combate; controles nativos), e "Refs #151" (a issue continua aberta para foco, teclado e leitor de tela).
