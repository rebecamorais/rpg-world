# Diário da mesa (Google Docs): plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** o Mestre cola o link de um Google Docs nas configurações da mesa, e o Mestre e os jogadores ativos abrem esse documento dentro da página da mesa (computador) ou pelo botão "Abrir no Google Docs" (sempre; é o único caminho no celular).

**Architecture:** uma tabela nova `party_journals` (mesa → ID do documento) com RLS: só o Mestre e os jogadores ativos leem, só o Mestre grava. O ID entra no `PartyView` como `journalDocId`, e o `PATCH /api/parties/[partyId]` aceita `journalUrl`. No front há um componente de diário (iframe + botão + aviso no celular), uma aba nova no `GmView`, uma seção no `PlayerView` e um bloco nas configurações.

**Tech Stack:** Next.js (App Router), Supabase/Postgres (RLS), TanStack Query, next-intl, Vitest, Playwright.

**Spec:** `docs/plans/2026-10-15-party-e-notas.md`, seção "Diário da mesa no Google Docs", com as decisões finais da conversa de 2026-11-03 (tabela separada, aba no `GmView`, aviso ao remover jogador, spike primeiro).

## Global Constraints

- Tudo na branch `feat/diario-mesa`, num PR só, com um commit por tópico. O corpo do PR vai em pt e en.
- Textos novos em `messages/en.json` e `messages/pt.json`. `es` e `sv` ficam com o Crowdin.
- O app guarda **só o ID** do documento: não cria documento, não mexe no compartilhamento, não guarda texto.
- O link só chega ao Mestre e aos jogadores com `status = 'active'`. Convidados, quem pediu para entrar, a página de convite e "minhas mesas" nunca recebem o link.
- URL de edição: `https://docs.google.com/document/d/{id}/edit`. O iframe usa a mesma URL.
- "Computador" = `(min-width: 1024px)` (breakpoint `lg` do Tailwind). Abaixo disso, nada de iframe.
- O CSP precisa de `https://docs.google.com` em `frame-src`.
- Migração nova em `database/migrations/` com nome `20261103120000_party_journals.sql`. Comentários em pt, no estilo de `20261031155304_parties.sql` (RLS + REVOKE/GRANT explícitos).

## Review Focus

1. **Link colado de jeitos diferentes** (`/edit?usp=sharing`, `/u/1/d/...`, `/view`, `/preview`, sem `https`, com espaços nas pontas): tem que ser aceito e virar o mesmo ID. Os testes de `parseGoogleDocId` (Tarefa 2) cobrem isso.
2. **Link que não é de documento** (Planilhas, Drive `/file/d/`, outro site, `javascript:`): tem que ser recusado com mensagem traduzida, sem salvar nada. Coberto na Tarefa 2 e na Tarefa 3 (rota responde 400 ou erro de validação).
3. **Jogador removido ou que saiu**: deixa de receber o `journalDocId` na mesma hora. Coberto no teste de RLS da Tarefa 1 (linha apagada → select vazio).
4. **Primeira renderização no computador**: sem "piscar" o aviso de celular antes do iframe. O hook devolve `null` no servidor e o componente não mostra nem aviso nem iframe enquanto for `null`. Coberto na Tarefa 5.
5. **O Mestre remove o link**: o diário volta ao estado vazio para todos, sem erro. Coberto nas Tarefas 3 (`journalUrl: null`) e 5 (estado vazio).

---

### Task 0: Spike (descartável) do Docs dentro de iframe

**Files:** nenhum no repositório. Usar `/tmp/claude-1000/-home-rebs-Github-rpg-world/d4d9ef5f-36e7-426d-b5ec-ec666d20cc55/scratchpad/journal-spike.html`.

- [ ] **Step 1:** pedir à Rebeca dois documentos de teste: um com "Qualquer pessoa com o link → Editor" e um restrito a e-mails.
- [ ] **Step 2:** criar o HTML com dois iframes (`https://docs.google.com/document/d/{id}/edit`, `allow="clipboard-read; clipboard-write"`), servir com `npx serve` e abrir com o Playwright (Chromium, sem login no Google).
- [ ] **Step 3:** anotar o resultado. Esperado: o documento aberto carrega e permite editar como anônimo, e o restrito mostra erro de login ou "recusou a conexão". Pedir à Rebeca para abrir a mesma página logada no Chrome e, se puder, no Safari.
- [ ] **Step 4:** se o documento aberto **não** carregar no iframe (por exemplo, `X-Frame-Options`), **parar** e levar o resultado para a Rebeca antes da Tarefa 1. Se carregar, registrar o resultado em uma linha na seção do spec e seguir.

### Task 1: Tabela `party_journals` com RLS

**Files:**
- Create: `database/migrations/20261103120000_party_journals.sql`
- Modify: `lib/types/database.ts` (gerado)
- Create: `src/backend/contexts/parties/infrastructure/party-journals-rls.integration.test.ts`

**Interfaces:**
- Produces: tabela `public.party_journals (party_id uuid PK → parties ON DELETE CASCADE, doc_id text NOT NULL CHECK (doc_id ~ '^[A-Za-z0-9_-]{20,100}$'), updated_at timestamptz NOT NULL DEFAULT now())`, com trigger `handle_updated_at`.
- RLS: `SELECT` com `private.is_party_gm(party_id) OR private.is_party_member(party_id)`. `INSERT`, `UPDATE` e `DELETE` com `private.is_party_gm(party_id)`.
- Grants: `REVOKE ALL ... FROM anon, authenticated, service_role`. Para `authenticated`: `SELECT, INSERT, DELETE` e `UPDATE (doc_id)`. Para `service_role`: tudo.

- [ ] **Step 1: testes de RLS que falham.** Seguir o padrão de `parties-rls.integration.test.ts` (sessões `gm`, `player`, `stranger` e helpers `createParty`/`addMember`). Constante `DOC = '1AbCdEfGhIjKlMnOpQrStUvWxYz_0123456789-ab'`. Casos:
  - `o mestre grava, troca e apaga o diário`: um upsert do gm devolve a linha, o update muda `doc_id` e o delete devolve 1 linha.
  - `jogador ativo lê, mas não grava`: com `addMember(partyId, player.userId, 'active')`, o select devolve `[{ doc_id: DOC }]`; o insert e o update do player falham ou não afetam nada (`data ?? []` igual a `[]` ou `error` não nulo).
  - `convidado, quem pediu e estranho não leem`: para `'invited'`, `'requested'` e sem vínculo, o select devolve `[]`.
  - `quem sai da mesa deixa de ler`: o player ativo lê; depois de `admin().from('party_members').delete()...`, o select devolve `[]`.
  - `doc_id fora do formato é recusado`: `'curto'` e `'tem espaço aaaaaaaaaaaaaaaaaaaa'` dão `error` não nulo.
  - `apagar a mesa apaga o diário`: depois do delete da mesa, o `admin` não acha mais a linha.
- [ ] **Step 2:** rodar `npm run test:integration -- party-journals-rls`. Esperado: FAIL (a tabela não existe).
- [ ] **Step 3:** escrever a migração.
- [ ] **Step 4:** aplicar nos dois bancos e gerar os tipos:
  `npx supabase migration up --local --workdir database/db-dev && npx supabase migration up --local --workdir database/db-test`, depois o comando "Update Types" de `scripts/infra.ts` e `npx prettier --write lib/types/database.ts`. Se `npx tsx scripts/setup-symlinks.ts` for necessário para o db-test enxergar a migração, rodar antes.
- [ ] **Step 5:** rodar `npm run test:integration -- party-journals-rls`. Esperado: PASS.
- [ ] **Step 6:** commit `feat(db): tabela party_journals com RLS para o diário da mesa`.

### Task 2: Domínio (ID do Docs), repositório e caso de uso

**Files:**
- Create: `shared/google-docs.ts`, `shared/google-docs.unit.test.ts`
- Create: `src/backend/contexts/parties/application/set-journal.use-case.ts`
- Modify: `src/backend/contexts/parties/domain/PartyError.ts` (código `JOURNAL_URL_INVALID: 'party_error_journal_url_invalid'`)
- Modify: `src/backend/contexts/parties/domain/repository/party.repo.ts`, `infrastructure/supabase-party.repository.ts`, `application/PartyContext.ts`, `application/get-party.use-case.ts`, `domain/PartyView.ts`, `index.ts`
- Test: `application/parties.use-cases.unit.test.ts`, `infrastructure/supabase-party.repository.integration.test.ts`

**Interfaces:**
- Produces (`shared/google-docs.ts`):
  - `parseGoogleDocId(input: string): string | null`: aceita `docs.google.com/document/(u/N/)?d/{id}` com ou sem `https://`, qualquer sufixo (`/edit`, `/view`, `?usp=...`, `#...`), espaços nas pontas e o ID puro (`^[A-Za-z0-9_-]{20,100}$`). Qualquer outra coisa devolve `null`.
  - `googleDocUrl(docId: string): string` → `https://docs.google.com/document/d/${docId}/edit`.
- Produces (repo): `journalDocId(partyId: string): Promise<string | null>` (RLS decide; sem linha devolve `null`) e `setJournal(partyId: string, docId: string | null): Promise<void>` (upsert com `onConflict: 'party_id'`, ou delete quando `null`; erro → `fail('save journal', error)`).
- Produces (context): `setJournal(partyId: string, userId: string, url: string | null): Promise<void>`.
- Produces (`PartyView`): `journalDocId: string | null`, preenchido para Mestre e jogador ativo.

- [ ] **Step 1: testes que falham em `shared/google-docs.unit.test.ts`.** O ID de teste é `ID = '1AbCdEfGhIjKlMnOpQrStUvWxYz_0123456789-ab'`.
  - `parseGoogleDocId` devolve `ID` para: `https://docs.google.com/document/d/${ID}/edit?usp=sharing`, `docs.google.com/document/d/${ID}`, `https://docs.google.com/document/u/1/d/${ID}/view#heading=h.x`, `  https://docs.google.com/document/d/${ID}/preview  ` e `ID`.
  - Devolve `null` para: `https://docs.google.com/spreadsheets/d/${ID}/edit`, `https://drive.google.com/file/d/${ID}/view`, `https://evil.com/document/d/${ID}`, `https://docs.google.com.evil.com/document/d/${ID}`, `javascript:alert(1)`, `''` e `'curto'`.
  - `googleDocUrl(ID)` é igual a `https://docs.google.com/document/d/${ID}/edit`.
- [ ] **Step 2: testes de caso de uso que falham** em `parties.use-cases.unit.test.ts` (adicionar `journalDocId` e `setJournal` ao mock do repo):
  - `SetJournalUseCase` com uma URL válida chama `repo.setJournal(PARTY, ID)`.
  - Com `null`, chama `repo.setJournal(PARTY, null)`.
  - Com uma URL inválida, rejeita com `party_error_journal_url_invalid` e não chama `setJournal`.
  - Para quem não é o `gmId` de `findParty` (ou se `findParty` devolve `null`), rejeita com `party_error_not_found`.
  - `GetPartyUseCase` devolve `journalDocId` vindo de `repo.journalDocId`, tanto para o Mestre quanto para o jogador ativo.
- [ ] **Step 3:** rodar `npm run test:unit -- google-docs parties.use-cases`. Esperado: FAIL.
- [ ] **Step 4:** implementar `shared/google-docs.ts`, o código de erro, `SetJournalUseCase.execute(partyId, userId, url)` (`findParty` → confere o gm → `parseGoogleDocId` → `setJournal`), o campo no `PartyView`, a busca no `Promise.all` de `GetPartyUseCase` e a ligação em `index.ts`.
- [ ] **Step 5:** teste de integração do repositório em `supabase-party.repository.integration.test.ts`: o Mestre grava e `journalDocId` devolve o ID; com `null`, devolve `null`.
- [ ] **Step 6:** rodar `npm run test:unit -- google-docs parties.use-cases && npm run test:integration -- supabase-party.repository`. Esperado: PASS.
- [ ] **Step 7:** commit `feat(parties): diário da mesa no domínio e no repositório`.

### Task 3: API (`PATCH journalUrl`) e CSP

**Files:**
- Modify: `src/backend/contexts/parties/interfaces/parties.schemas.ts`, `interfaces/parties.api.ts`, `app/api/parties/[partyId]/route.ts`
- Modify: `shared/http/security-headers.ts` (`GOOGLE_DOCS_ORIGIN = 'https://docs.google.com'` em `frame-src`)
- Modify: `messages/en.json` e `messages/pt.json` (`errors.party_error_journal_url_invalid`)
- Test: `app/api/parties/[partyId]/route.unit.test.ts`, `shared/http/security-headers.unit.test.ts`

**Interfaces:**
- Consumes: `PartyContext.setJournal` (Tarefa 2).
- Produces: `partyPatchSchema` com `journalUrl: z.string().max(500).nullable()` como opcional (o `refine` passa a aceitar qualquer um dos três). `partiesApi.setJournal(partyId, userId, url)`. A rota chama `partiesApi.setJournal(params.partyId, user.id, body.journalUrl)` quando `journalUrl !== undefined`.

- [ ] **Step 1: testes que falham.**
  - Em `route.unit.test.ts`: `patch({ journalUrl: 'https://docs.google.com/document/d/x/edit' })` responde 204 e chama `setJournal(PARTY, <user id do mock>, url)` sem chamar `rename`. `patch({ journalUrl: null })` responde 204 com `null`. `patch({ journalUrl: 'x'.repeat(501) })` responde 400.
  - Em `security-headers.unit.test.ts`: `directive(csp, 'frame-src')` contém `https://docs.google.com`.
- [ ] **Step 2:** rodar `npm run test:unit -- parties/\[partyId\]/route security-headers`. Esperado: FAIL.
- [ ] **Step 3:** implementar. Mensagem em en: "Paste the link of a Google Docs document (docs.google.com/document/…)." Em pt: "Cole o link de um documento do Google Docs (docs.google.com/document/…)."
- [ ] **Step 4:** rodar os mesmos testes. Esperado: PASS.
- [ ] **Step 5:** commit `feat(api): link do diário no PATCH da mesa e Google Docs no CSP`.

### Task 4: Configurações (o Mestre cola, troca e remove o link)

**Files:**
- Create: `src/frontend/components/party/JournalSettings.tsx`, `JournalSettings.unit.test.tsx`
- Modify: `src/frontend/hooks/useParty.ts` (mutation `setJournal`)
- Modify: `src/frontend/components/party/PartySettings.tsx` (renderiza `<JournalSettings party={party} />` depois de `PartyManagement`)
- Modify: `src/frontend/components/party/PartyManagement.tsx` (aviso ao remover jogador)
- Modify: `messages/en.json`, `messages/pt.json` (`parties.journal.*`, `parties.manage.removeConfirmJournal`)

**Interfaces:**
- Consumes: `PartyView.journalDocId`, `googleDocUrl`, `parseGoogleDocId`.
- Produces: `useParty(...).setJournal: UseMutation<(url: string | null)>` → `rpgWorldApi.patch(base, { journalUrl: url })`.

Comportamento: `SectionCard` com ícone `BookOpen` e título "Diário da mesa".
- Campo com label "Link do Google Docs", pré-preenchido com `googleDocUrl(journalDocId)` quando já existe link.
- Botão "Salvar", desabilitado enquanto `parseGoogleDocId(valor)` for `null` ou o ID não mudar.
- Botão "Remover", só quando existe link, com `window.confirm`.
- Abaixo, a explicação em três linhas fixas. Texto pt:
  1. "No Google Docs, clique em **Compartilhar**."
  2. "**Link aberto (mais fácil):** em Acesso geral, escolha *Qualquer pessoa com o link* → *Editor*. Funciona sem login."
  3. "**Só convidados (mais seguro):** adicione o e-mail de cada jogador. Cada um precisa estar logado no Google neste navegador; se o diário não abrir aqui, use *Abrir no Google Docs*."

  Em en, o equivalente.
- Ao remover um jogador com `party.journalDocId` preenchido, o confirm usa `removeConfirmJournal`. Texto pt: "Tirar {name} da mesa? Os personagens continuam com essa pessoa. Ela pode ter guardado o link do diário: para cortar o acesso, restrinja o compartilhamento no Google Docs."

- [ ] **Step 1: testes que falham** (`JournalSettings.unit.test.tsx`, no padrão de `PartySettings.unit.test.tsx`):
  - Sem link: o campo vem vazio, "Salvar" desabilitado e não há "Remover".
  - Digitar uma URL válida habilita "Salvar", e o clique chama `setJournal` com a URL.
  - Digitar `https://drive.google.com/file/d/...` deixa "Salvar" desabilitado.
  - Com `journalDocId`: o campo mostra `googleDocUrl(id)`, e "Remover" com confirm chama `setJournal(null)`.
  - O texto "Qualquer pessoa com o link" aparece.
- [ ] **Step 2:** rodar `npm run test:unit -- JournalSettings`. Esperado: FAIL.
- [ ] **Step 3:** implementar o componente, a mutation, a ligação em `PartySettings` e o confirm em `PartyManagement`.
- [ ] **Step 4:** rodar `npm run test:unit -- JournalSettings PartySettings`. Esperado: PASS.
- [ ] **Step 5:** commit `feat(parties): link do diário nas configurações da mesa`.

### Task 5: O diário na página da mesa

**Files:**
- Create: `src/frontend/hooks/useMediaQuery.ts` (`useMediaQuery(query: string): boolean | null`, com `useSyncExternalStore` no estilo de `useOrigin` em `PartyManagement`; o snapshot do servidor é `null`)
- Create: `src/frontend/components/party/PartyJournal.tsx`, `PartyJournal.unit.test.tsx`
- Modify: `src/frontend/components/party/PartyPage.tsx` (`GmMode` ganha `'journal'`; `useGmMode` aceita `?mode=journal`; terceira `TabsTrigger`; `PlayerView` ganha uma `<section aria-labelledby="party-journal">` depois de `PlayerCombatPanel`)
- Modify: `messages/en.json`, `messages/pt.json` (`combat.modeJournal` ou `parties.journal.tab`, `parties.journal.*`)

**Interfaces:**
- Consumes: `PartyView.journalDocId`, `PartyView.role`, `googleDocUrl`.
- Produces: `PartyJournal({ docId, role, partyId }: { docId: string | null; role: PartyRole; partyId: string })`.

Comportamento:
- Sem `docId`: para o Mestre, `EmptyState` com o link "Configurar o diário" → `/parties/${partyId}/settings`. Para o jogador, "O Mestre ainda não configurou o diário".
- Com `docId`: botão "Abrir no Google Docs" sempre visível (`<a target="_blank" rel="noopener noreferrer">`). Depois:
  - Se `useMediaQuery('(min-width: 1024px)')` for `true`: `<iframe src={googleDocUrl(docId)} title="Diário da mesa" allow="clipboard-read; clipboard-write" className="h-[75vh] w-full rounded-md border">`.
  - Se for `false`: aviso "No celular o diário abre direto no Google Docs. Para editar aqui dentro, use o computador."
  - Se for `null`: só o botão.

- [ ] **Step 1: testes que falham** (`PartyJournal.unit.test.tsx`, mockando `window.matchMedia`):
  - O desktop com `docId` renderiza um iframe com `src` igual a `googleDocUrl(ID)` e o link "Abrir no Google Docs" com `href` igual e `target="_blank"`.
  - O celular com `docId` não renderiza iframe, mostra o aviso e o link.
  - Sem `docId`, o jogador vê "ainda não configurou" e nenhum iframe.
  - Sem `docId`, o Mestre vê o link para `/parties/{id}/settings`.
- [ ] **Step 2:** rodar `npm run test:unit -- PartyJournal`. Esperado: FAIL.
- [ ] **Step 3:** implementar o hook, o componente e a ligação no `PartyPage`.
- [ ] **Step 4:** rodar `npm run test:unit -- PartyJournal`. Esperado: PASS.
- [ ] **Step 5:** e2e em `e2e/parties.spec.ts`, no padrão do arquivo: o Mestre cola o link nas configurações; o jogador ativo abre a mesa no desktop e vê `iframe[title="…"]` com o `src` esperado (só o atributo, sem carregar o Google); na viewport de celular, vê o aviso e nenhum iframe. Se o fixture bloqueia frames externos, seguir o mesmo tratamento do iframe do GitHub Sponsors em `e2e/support/fixtures.ts`.
- [ ] **Step 6:** rodar `npm run test:e2e -- parties`. Esperado: PASS.
- [ ] **Step 7:** commit `feat(parties): diário na página da mesa, com aviso no celular`.

### Task 6: Política de Privacidade

**Files:**
- Modify: `messages/en.json`, `messages/pt.json` (`privacy.lastUpdated`, `privacy.sections.data.items`, `privacy.sections.sharing.content`)

Hoje a política não cita as mesas e diz que os personagens e o perfil são "visíveis só para você", o que já não é verdade desde #124–#126. Como o diário é um dado da mesa, a correção vai junto (decisão minha; ver o handoff).
- `data.items`: novo item depois de "Characters". Texto pt: "Mesas: nome, edição de regras, quem é Mestre e jogador, convites, personagens levados e o link do diário (um documento do Google Docs que o Mestre escolhe; o conteúdo fica no Google, não no RPG World)."
- `sharing.content`: trocar a última frase por "Seu perfil (nome de usuário e avatar) e um resumo dos personagens que você leva para uma mesa são vistos pelas pessoas dessa mesa; o Mestre também vê a ficha desses personagens. O link do diário é visto só pelo Mestre e pelos jogadores ativos. O resto continua visível só para você; as imagens de avatar ficam num endereço público que não é listado em lugar nenhum." Conferir os campos exatos em `RosterCharacter` e `RolePlayCard` antes de fechar o texto.
- `lastUpdated`: "Última atualização: 3 de novembro de 2026" / "Last updated: November 3, 2026".

- [ ] **Step 1:** editar as duas línguas.
- [ ] **Step 2:** rodar `npm run test:unit -- messages` (ou o teste de paridade de chaves que existir) e `npm run test:e2e -- static-pages`. Esperado: PASS.
- [ ] **Step 3:** commit `docs(privacy): mesas e diário na Política de Privacidade`.

### Task 7: Fechamento

- [ ] **Step 1:** rodar `npm run lint && npx tsc --noEmit && npm run knip && npm test`. Esperado: tudo verde.
- [ ] **Step 2:** atualizar o status no topo de `docs/plans/2026-10-15-party-e-notas.md` (diário entregue) e marcar o item no `2026-10-20-roadmap.md`, se houver.
- [ ] **Step 3:** commit `docs(plans): diário da mesa entregue`, push e PR com corpo em pt + en. A Rebeca faz o merge.
