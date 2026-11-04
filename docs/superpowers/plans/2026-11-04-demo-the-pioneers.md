# Demo The Pioneers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Abrir `/demo` sem login, na mesa The Pioneers, com as telas reais do app em modo só leitura.

**Architecture:** O `rpgWorldApi` ganha um transporte trocável. Dentro de `/demo`, um `DemoProvider` instala um transporte que responde os GETs com um catálogo no código e recusa toda escrita, abrindo o convite para criar conta. O provider usa um `QueryClient` próprio. Links passam por `AppLink`, que traduz caminhos do app para caminhos da demo.

**Tech Stack:** Next.js (App Router), next-intl, TanStack Query, Vitest, Playwright, sharp.

**Spec:** `docs/superpowers/specs/2026-11-04-demo-the-pioneers-design.md`

## Global Constraints

- Antes de escrever código de rota, ler o guia relevante em `node_modules/next/dist/docs/` (exigência do `AGENTS.md`).
- Sem migration, sem usuário e sem nada novo no banco.
- Nenhuma chamada de rede a partir da demo, exceto `GET /api/auth/session`, que só lê.
- Dados históricos e fictícios ficam em arquivos separados; o lore nunca aparece como biografia.
- Nomes públicos: Maren Hamilton e Mirela Pardan. Arquivos e dados de personagem não contêm os nomes reais delas; estes só existem em `inspirations.ts`.
- Textos em en e pt (`routing.locales` é `['en', 'pt']`).
- Fora do escopo: diário, combate, tela de galeria e textos de exemplo do app logado.
- Usar tokens do design system, nunca a paleta crua do Tailwind.
- Mensagens de commit no padrão do repositório, com tópicos pt / en.

## Review Focus

- Sair da demo para `/register` ou para o app: o transporte é removido e nenhum dado da demo aparece na conta real. Teste na Task 2.
- Visitante já logado abre `/demo`: a sessão continua intacta e o banner oferece voltar ao app. Testes nas Tasks 2 e 6.
- URL de API não prevista no catálogo: responde 404 local e nunca chega à rede. Teste na Task 2.
- Abrir ou recarregar direto `/demo/characters/<id>`, com id inválido ou `/demo?mode=combat`: a ficha carrega, o id inválido dá 404 e o combate não aparece. Testes nas Tasks 5 e 6.
- Celular (375 px): a navegação da demo e o botão de criar conta continuam alcançáveis, sem rolagem horizontal. Teste na Task 6.

---

### Task 1: Branch, imagens e catálogo

**Files:**

- Create: `public/demo/pioneers/*.webp`, `src/frontend/demo/ids.ts`, `src/frontend/demo/data/heroes.ts`, `src/frontend/demo/data/inspirations.ts`, `src/frontend/demo/data/sheets.ts`, `src/frontend/demo/data/build.ts`, `src/frontend/demo/types.ts`
- Test: `src/frontend/demo/data/catalog.unit.test.ts`

**Interfaces:**

- Produces: `DEMO_PARTY_ID = 'the-pioneers'`; `DEMO_USER: User`; `buildDemoData(locale: 'en' | 'pt'): DemoData`.
- `DemoData`: `{ party: PartyView; parties: MyParties; characters: Record<string, DnD5eCharacter>; lore: Record<string, LoreData>; spells: Record<string, unknown>; inventories: Record<string, InventoryDto>; chest: InventoryDto; npcs: CharacterSummary[]; inspirations: Record<string, Inspiration> }`. `Inspiration`: `{ realName; period; contribution; sources: {label; url}[] }`.

- [ ] **Step 1:** A partir da `main` atualizada, criar a branch `feat/demo-the-pioneers` e commitar o spec e este plano.
- [ ] **Step 2:** Converter com `sharp` as 13 imagens da pasta do spec para `public/demo/pioneers/`, mantendo os nomes, com largura máxima de 768 px e qualidade 80. Expected: cada arquivo abaixo de 300 KB.
- [ ] **Step 3: Escrever o teste que falha**

```ts
it.each(['en', 'pt'] as const)('catálogo %s', (locale) => {
  const data = buildDemoData(locale);
  expect(Object.keys(data.characters)).toHaveLength(13);
  expect(data.party.roster).toHaveLength(6);
  expect(data.npcs).toHaveLength(7);
  expect(data.party.role).toBe('gm');
  expect(data.party.hasGm).toBe(true);
  // fotos existem em public/, e o nome real não vaza fora de inspirations
  for (const c of Object.values(data.characters)) {
    expect(existsSync(`public${c.avatarUrl}`)).toBe(true);
  }
  const fiction = JSON.stringify({ ...data, inspirations: undefined });
  expect(fiction).not.toMatch(/Perlman|Radia|Margaret/);
});
```

Acrescentar testes: toda referência de magia e item (`dnd5e:...`) existe em `content/`; `ideals`, `bonds` e `flaws` não ficam vazios nas 13 fichas; o lore pt é diferente do en.

- [ ] **Step 4:** Rodar `npx vitest run --config ./test/vitest.config.unit.ts src/frontend/demo/data`. Expected: FAIL, módulo inexistente.
- [ ] **Step 5:** Implementar. `heroes.ts` recebe nome, título, classe, cor, personalidade, item, imagem e lore en (texto exato do spec) mais a tradução pt. `inspirations.ts` traz fatos e fontes verificadas. `sheets.ts` traz nível, atributos, magias e inventário; classe da Ada é o texto livre "Artífice" / "Artificer", com habilidades originais. Níveis entre 3 e 5. `ownerUsername` de todos: `the_pioneers`. Magias e itens são resolvidos de `content/` no servidor, pelo mesmo leitor que os contextos usam.
- [ ] **Step 6:** Rodar o teste. Expected: PASS.
- [ ] **Step 7:** Commit `feat(demo): catálogo The Pioneers / The Pioneers catalog`.

### Task 2: Transporte e provider

**Files:**

- Modify: `src/frontend/lib/api-client/apiClient.ts`
- Create: `src/frontend/demo/transport.ts`, `src/frontend/demo/DemoContext.tsx`
- Test: `src/frontend/lib/api-client/apiClient.unit.test.ts`, `src/frontend/demo/transport.unit.test.ts`, `src/frontend/demo/DemoContext.unit.test.tsx`

**Interfaces:**

- Consumes: `DemoData`.
- Produces: `ApiClient.setTransport(t: ApiTransport | null): void`, com `ApiTransport = (method: string, url: string) => Promise<unknown> | undefined` (`undefined` = segue para a rede); `createDemoTransport(data: DemoData, onBlockedWrite: () => void): ApiTransport`; `<DemoProvider data>`; `useDemo(): { isDemo: boolean; data: DemoData | null; openInvite(): void; inviteOpen: boolean; setInviteOpen(open: boolean): void }`, que fora do provider retorna `isDemo: false`.

- [ ] **Step 1: Escrever os testes que falham**

```ts
const t = createDemoTransport(data, blocked);
await expect(t('GET', `/api/parties/${DEMO_PARTY_ID}`)).resolves.toEqual(data.party);
await expect(t('GET', `/api/parties/${DEMO_PARTY_ID}/encounter`)).resolves.toEqual({});
await expect(t('GET', '/api/spells?level=1')).resolves.toEqual([]);
expect(t('GET', '/api/auth/session')).toBeUndefined();
await expect(t('GET', '/api/qualquer-coisa')).rejects.toMatchObject({ status: 404 });
await expect(t('POST', '/api/auth/signout')).rejects.toMatchObject({
  status: 403,
  message: 'demo_read_only',
});
expect(blocked).toHaveBeenCalledTimes(1);
```

Rotas GET a cobrir: `/api/parties`, a mesa, `/encounter`, `/chest`, `/characters?kind=npc`, e cada ficha via `/api/parties/<id>/characters/<cid>` com `/lore`, `/spells` e `/inventory`, ignorando a query string. `/api/items`, `/api/conditions` e `/api/spells` respondem `[]`; se o formato real for outro, seguir o tipo do hook.

Em `apiClient.unit.test.ts`: com transporte ativo, `fetch` não é chamado; com `undefined` ou `null`, é.

Em `DemoContext.unit.test.tsx`: montado, `rpgWorldApi.get('/api/parties')` devolve o catálogo; desmontado, chama `fetch`; o `QueryClient` de dentro não é o de fora; `useDemo()` fora dá `isDemo: false`.

- [ ] **Step 2:** Rodar os testes. Expected: FAIL.
- [ ] **Step 3:** Implementar. `fetchWrapper` consulta o transporte antes do `fetch`. O provider instala o transporte só no navegador (`typeof window !== 'undefined'`), no inicializador do `useState`, reinstala em `useEffect` e limpa no cleanup, para funcionar no StrictMode e nunca contaminar o servidor. Adicionar `demo_read_only` em `common.errors` no `en.json` e no `pt.json`.
- [ ] **Step 4:** Rodar os testes. Expected: PASS.
- [ ] **Step 5:** Commit `feat(demo): transporte somente leitura / read-only transport`.

### Task 3: Links dentro da demo

**Files:**

- Create: `src/frontend/demo/href.ts`, `src/frontend/demo/AppLink.tsx`
- Modify, trocando `next/link` por `AppLink`: `components/party/RolePlayCard.tsx`, `components/party/PartyPage.tsx`, `components/character/sheet/CharacterSheetShell.tsx`, `components/character/CharacterCard.tsx`, `components/character/spells/Spellbook.tsx`, e os links de `PartyChestPage` e `CharacterList` que houver.
- Test: `src/frontend/demo/href.unit.test.ts`

**Interfaces:**

- Produces: `toDemoHref(href: string): string`; `<AppLink>`, com as mesmas props de `next/link`.

- [ ] **Step 1: Escrever o teste que falha**

```ts
it.each([
  ['/parties/the-pioneers', '/demo'],
  ['/parties/the-pioneers/inventory', '/demo/inventory'],
  ['/parties/the-pioneers/characters/ada/lore', '/demo/characters/ada/lore'],
  ['/system/dnd5e/character/joan/spells', '/demo/characters/joan/spells'],
  ['/characters/npcs', '/demo/npcs'],
  ['/characters/new?kind=npc', '/register'],
  ['/settings/profile', '/register'],
])('%s vira %s', (from, to) => expect(toDemoHref(from)).toBe(to));
```

- [ ] **Step 2:** Rodar. Expected: FAIL.
- [ ] **Step 3:** Implementar. `AppLink` aplica `toDemoHref` quando `useDemo().isDemo`; fora da demo é igual ao `Link`.
- [ ] **Step 4:** Rodar o teste e os testes dos componentes alterados. Expected: PASS.
- [ ] **Step 5:** Commit `feat(demo): links dentro da demo / links stay in the demo`.

### Task 4: Telas reais em modo demo

**Files:**

- Modify: `src/frontend/hooks/useSheetSource.ts`, `src/frontend/hooks/usePartyChannel.ts`, `src/frontend/components/party/PartyPage.tsx`
- Test: `useSheetSource` e `usePartyChannel` (criar ou ampliar o `.unit.test`), `PartyPage.unit.test.tsx`

**Interfaces:**

- Consumes: `useDemo`, `DEMO_PARTY_ID`.
- Produces: na demo, `useSheetSource(id)` retorna `{ readOnly: true, partyId: DEMO_PARTY_ID, apiPath: '/api/parties/the-pioneers/characters/<id>', pagesPath: '/demo/characters/<id>' }`.

- [ ] **Step 1: Escrever os testes que falham**
  - `useSheetSource` dentro do provider retorna o objeto acima; fora, o comportamento atual não muda.
  - `usePartyChannel` na demo nunca chama `getSupabaseBrowserClient` e retorna `live: false`.
  - `PartyPage` na demo mostra os cards de Role Play, sem a aba Combate e sem o link de configurações, mesmo com `?mode=combat`.
- [ ] **Step 2:** Rodar. Expected: FAIL.
- [ ] **Step 3:** Implementar os três desvios com `useDemo().isDemo`. No `GmView`, em modo demo renderizar direto a lista de cards, fora de `Tabs`.
- [ ] **Step 4:** Rodar. Expected: PASS, incluindo os testes atuais desses arquivos.
- [ ] **Step 5:** Commit `feat(demo): telas reais em modo demo / real screens in demo mode`.

### Task 5: Rotas de `/demo`

Ler antes em `node_modules/next/dist/docs/` os guias de layouts e metadata.

**Files:**

- Create em `app/[locale]/(demo)/demo/`: `layout.tsx`, `page.tsx`, `inventory/page.tsx`, `npcs/page.tsx`, `characters/[id]/layout.tsx`, `characters/[id]/page.tsx`, `characters/[id]/lore/page.tsx`, `characters/[id]/spells/page.tsx`, `characters/[id]/inventory/page.tsx`
- Create: `src/frontend/demo/DemoInspiration.tsx`
- Modify: `messages/en.json`, `messages/pt.json`
- Test: `src/frontend/demo/DemoInspiration.unit.test.tsx`, `src/frontend/demo/demo-routes.unit.test.ts`

**Interfaces:**

- Consumes: `buildDemoData`, `DemoProvider`, `PartyPage`, `PartyChestPage`, `CharacterList`, `CharacterProvider`, `CharacterSheetShell`, `UserProvider`.

- [ ] **Step 1: Escrever os testes que falham**
  - `DemoInspiration` mostra o nome real, período, contribuição, links de fonte e o aviso de homenagem fictícia, em en e pt.
  - O `metadata` do layout tem `robots: { index: false, follow: false }`; `sitemap()` não contém `/demo`.
- [ ] **Step 2:** Rodar. Expected: FAIL.
- [ ] **Step 3:** Implementar.
  - `layout.tsx`: `buildDemoData(locale)` envolvendo `DemoProvider` e `UserProvider user={DEMO_USER}`, sem passar pelo layout do dashboard.
  - `page.tsx` e `inventory/page.tsx`: mesma composição das rotas `parties/[partyId]`, com `partyId = DEMO_PARTY_ID`.
  - `npcs/page.tsx`: `CharactersProvider kind="npc"` e `CharacterList`.
  - `characters/[id]/layout.tsx`: `notFound()` para id desconhecido; senão `CharacterProvider initialCharacter`, `CharacterSheetShell`, `DemoInspiration` e `children`. As abas reexportam as páginas de `system/[system_name]/character/[id]/`, como faz a rota da mesa.
  - Textos no namespace `demo`, com o aviso exato do spec.
- [ ] **Step 4:** Rodar os testes e `npm run build`. Expected: PASS e build sem erros.
- [ ] **Step 5:** Commit `feat(demo): rotas de /demo / demo routes`.

### Task 6: Moldura, convite e entradas

**Files:**

- Create: `src/frontend/demo/DemoFrame.tsx`, `src/frontend/demo/DemoInvite.tsx`, `e2e/demo.spec.ts`
- Modify: `app/[locale]/(demo)/demo/layout.tsx`, `src/frontend/components/layout/HeroCTA.tsx`, `src/frontend/components/features/FeaturesCta.tsx`, testes destes, `messages/en.json`, `messages/pt.json`, `e2e/a11y.spec.ts`

**Interfaces:**

- Consumes: `useDemo`, `useSession`, `AppLink`.
- Produces: `DemoFrame`, com cabeçalho próprio, banner fixo e navegação (Visão geral, Baú, NPCs, mais as abas via `CharacterNavSection` quando há ficha aberta). Não usa `Sidebar`, `MobileMenu`, `GlobalHeader` nem perfil.

- [ ] **Step 1: Escrever os testes que falham**

Unitários: o banner mostra "Criar conta" (`/register`) sem sessão e "Voltar ao app" (`/characters`) com sessão; `openInvite` abre o `DemoInvite`; `HeroCTA` e `FeaturesCta` têm link `/demo`.

`e2e/demo.spec.ts`:

- anônimo abre `/demo`, vê as 6 personagens, sem redirect para `/login`;
- abre a ficha da Ada, passa pelas 4 abas e a URL fica em `/demo/characters/...`;
- os campos da ficha estão desabilitados; `/demo/npcs` lista 7; `/demo/inventory` mostra o baú;
- `page.on('request')` registra as chamadas `/api/*`: só `GET /api/auth/session` é permitida;
- recarregar `/demo/characters/rootweaver` funciona; `/demo/characters/inexistente` dá 404; `/demo?mode=combat` não mostra combate;
- "Criar conta" chega a `/register` sem redirect;
- usuário logado abre `/demo`, volta a `/characters` e vê só os próprios personagens, com a sessão ativa;
- em 375 px, navegação e botão estão visíveis e `scrollWidth <= innerWidth`;
- `/demo` entra na lista de páginas do `a11y.spec.ts`.

- [ ] **Step 2:** Rodar `npm run test:unit` para os novos e `npx playwright test e2e/demo.spec.ts`. Expected: FAIL.
- [ ] **Step 3:** Implementar. O botão "Ver demo" é secundário, ao lado do CTA atual, em `HeroCTA` e `FeaturesCta`.
- [ ] **Step 4:** Rodar os mesmos comandos. Expected: PASS.
- [ ] **Step 5:** Commit `feat(demo): moldura, convite e entradas / frame, invite and entry points`.

### Task 7: Verificação e PR

**Files:**

- Modify: `NOTICE.md` (uma linha sobre as imagens geradas com IA), `docs` de roadmap se houver item correspondente.

- [ ] **Step 1:** Rodar `npm run lint`, `npm run test:unit`, `npm run build` e `npx playwright test`. Expected: tudo passa.
- [ ] **Step 2:** Abrir `/demo` no navegador em en e pt, desktop e 375 px, e conferir as 13 fichas com `superpowers:verification-before-completion`.
- [ ] **Step 3:** Commit, push e PR com corpo em pt e en. Incluir no corpo o checklist que bloqueia o merge: Rebeca revisou conteúdo e os 13 retratos; políticas da OpenAI sobre pessoas reais conferidas; decisão sobre revisão jurídica. Não fazer merge.
