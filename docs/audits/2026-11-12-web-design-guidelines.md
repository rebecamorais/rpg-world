# Auditoria Web Interface Guidelines — 2026-11-12

Base: regras da Vercel (`vercel-labs/web-interface-guidelines`), lidas no código, sem rodar o app.
Excluídos de propósito: Title Case (app é pt-BR), virtualização, preload de fontes.
Já OK: redução de movimento global, skip link, foco visível nos primitivos (`focus-ring`),
toasts com `aria-live`, ícones lucide com `aria-hidden`, remoções destrutivas com `confirm`/desfazer.

Gravidade: **alta** = trava teclado/leitor de tela/toque ou perde dados · **média** = violação clara · **baixa** = polimento.

## Pacote 1 — Perda de dados e bloqueios (alta)

- `src/frontend/hooks/useUnsavedChanges.ts:9-50` — o guard só cobre `beforeunload` e clique em `<a>`; Voltar do navegador/gesto do Android descarta o rascunho da ficha sem aviso → tratar `popstate` (entrada sentinela no histórico enquanto houver alterações).
- `src/frontend/components/character/sheet/SaveControls.tsx` + `inventory/page.tsx:19`, `SpellsTab.tsx:50`, `LoreTab.tsx:49` — rascunho do personagem sobrevive à troca de aba, mas Magias/Inventário não mostram barra de salvar nem aviso (Lore mostra só o rascunho de lore) → barra no `CharacterSheetShell` sempre que `isDirty`. (média, mas mesma família)
- `src/frontend/components/ui/dialog.tsx:42` — `DialogContent` sem `max-h`/`overflow-y-auto`/`overscroll-contain`; só 2 de 15 diálogos adicionam. Diálogo alto em celular deitado fica cortado sem rolagem → pôr na base.
- `src/frontend/components/character/spells/SpellSearchDialog.tsx:405-413, 448-456` — botões anterior/próxima página só com ícone, sem `aria-label`. Páginas `:429-443` lidas como "2", "3" → "Página N".

## Pacote 2 — Global e primitivos (média)

- `app/[locale]/layout.tsx` — sem `export const viewport`: falta `themeColor` (#09090b; o script de tema troca para #fafafa no claro) e `viewportFit: 'cover'`. Sem `cover`, todos os `env(safe-area-inset-*)` (sonner, SheetTabBar, SaveControls) valem 0 no iPhone.
- `app/globals.css` — sem `touch-action: manipulation` nem `-webkit-tap-highlight-color`; sem `scroll-padding-top/bottom` (barras fixas da ficha e header sticky da demo cobrem o campo focado); headings sem `text-wrap: balance`.
- `ui/sheet.tsx:34,40` — sem `overflow-y-auto overscroll-contain`; variante `bottom` sem padding de safe-area (afeta Ajustar PV).
- `ui/select.tsx:75` — `overscroll-contain` no conteúdo (baixa).
- `ui/dialog.tsx:42` — `w-[calc(100%-2rem)]` para não encostar nas bordas (baixa).
- `ui/number-stepper.tsx:54` — `focus-within` → `has-[input:focus-visible]` (anel duplo) (baixa).
- `transition-all` → propriedades explícitas (18 ocorrências): `ui/progress.tsx:21`, `ui/health-bar.tsx:23,33`, `ui/select.tsx:24`, `ui/ghost-input.tsx:23` (anima padding), `layout/Sidebar.tsx:87`, `ProfileForm.tsx:208`, `auth/LoginForm.tsx:131,141`, `character/CharacterCard.tsx:53,58`, `CharacterNavSection.tsx:38`, `CharacterKindTabs.tsx:29`, `spell-card/parts/SpellActions.tsx:25`, `magic-system/SpellPoints.tsx:71`, `magic-system/SpellSlots.tsx:94`, `stats/ProficiencyLegend.tsx:23`, `(public)/page.tsx:57` (remover).

## Pacote 3 — Formulários de conta (média)

- `auth/ResetPasswordForm.tsx:123` — `{t('processing')}...` + string já com "..." → mostra "Atualizando......". Spinner sem `aria-hidden`/`role="status"`.
- Senhas sem `autoComplete="new-password"`: `ResetPasswordForm.tsx:163,181`, `SignUpForm.tsx:152,171`, `change-password/page.tsx:85,104`.
- E-mails sem `autoComplete="email" spellCheck={false}`: `SignUpForm.tsx:133`, `ForgotPasswordForm.tsx:111`, `LoginForm.tsx:160`, `feedback/ContactForm.tsx:118` (também sem `type="email"`).
- Usernames sem `spellCheck={false} autoCapitalize="none"` (celular capitaliza e o padrão é `[a-z0-9_]`): `ChooseUsernameForm.tsx:61-68`, `party/PartyManagement.tsx:97-105`, `profile/DeleteAccountCard.tsx:234`.
- `auth/LoginForm.tsx:129-148` — alternância link mágico/senha sem `aria-pressed` nem foco visível; `:236-244` login Google é navegação em `<button>`; `:269` SVG sem `aria-hidden`.
- `feedback/ContactForm.tsx:63-65,84,94-101` — mensagens do zod em inglês padrão, erros do servidor só em toast → `setError` + mensagens traduzidas.
- `ProfileForm.tsx:114-118` — "username em uso" só em toast, não inline. `:203-215` swatches sem `focus-ring`.
- `auth/confirm/page.tsx:67-76` — troca spinner→erro não anunciada; redireciona sozinho sem link.
- `change-password/page.tsx:63` — "voltar" aponta para /login numa página logada.
- Turnstile desabilita o submit antes do pedido (`SignUpForm.tsx:188`, `ForgotPasswordForm.tsx:127`, `ContactForm.tsx:177`) (baixa).
- `layout/FooterContent.tsx:82-87`, `party/PartyManagement.tsx:60-63` — `clipboard.writeText` sem `await`/catch; toast de sucesso mesmo se falhar.

## Pacote 4 — Toque e leitor de tela na mesa (média)

- `combat/GmCombatPanel.tsx:108-117` — campo de quantidade força "1" a cada tecla (apagar volta a 1, digitar 5 vira 15).
- `combat/GmCombatPanel.tsx:215-220` — "Encerrar turno" não anuncia quem joga a seguir.
- `combat/NpcControls.tsx:109` — select `h-9` sem tamanho de toque.
- `combat/NpcFateControls.tsx:27,38` — áreas de toque dos testes contra a morte se sobrepõem ~12px.
- `party/PartyPage.tsx:89-92` — abas Role Play/Combate ~32px no celular → `pointer-coarse:min-h-11`.
- `party/PartyList.tsx:97-103,142-149`, `PartyRequests.tsx`, `PartyPage.tsx:79-80` — recusar convite/cancelar pedido sem confirmação nem desfazer; botões repetidos sem o nome da pessoa/mesa no rótulo.
- `combat/CombatRow.tsx:156-159` — PV lido como "12 / 20" sem rótulo.
- `combat/CombatConnection.tsx:13`, `PlayerCombatPanel.tsx:64` — `role="status"` montado junto com o texto (não anuncia).
- `combat/NumberCell.tsx:34-39` — Enter não confirma.
- Botões sem `loading`: `GmCombatPanel.tsx:272-291`, `PartyGmClaim.tsx:110-118` (baixa).
- Nomes longos sem `truncate`: `CollapsedDeadRow.tsx:33`, `PlayerTurnRow.tsx:85,112` (baixa).

## Pacote 5 — Toque e leitor de tela na ficha (média)

- `magic-system/SpellSlots.tsx:85-98` — espaços de magia com 8px no mouse e áreas de toque sobrepostas; `aria-pressed` significa "disponível" (confuso) → rótulo "disponível/gasto". `:81` "º" fixo aparece em inglês.
- `inventory/ItemRow.tsx:77-104` — −/+ de quantidade com 24px sem `touch-target`.
- `stats/CombatStatsSection.tsx:74-84` — iniciativa aceita negativo, mas teclado numérico do iPhone não tem "−".
- Campos da ficha sem `autoComplete="off"` (Chrome oferece autofill pessoal): `CharacterHeader.tsx:144-152`, `LoreSection.tsx:88-94`, `NewCharacterForm.tsx:94`.
- `SaveControls.tsx:53-56` — `role="status"` escondido no celular.
- Tooltips só no hover: `stats/AttributeCard.tsx:81-105`, `stats/SavingThrowsSection.tsx:71-89`.
- `autoFocus` abre o teclado no celular: `inventory/AddItemDialog.tsx:121` (esconde a lista). CoinPouch/AttributeCard são justificáveis.
- `90vh`/`100vh`/`h-screen` → `dvh`: `AddItemDialog.tsx:102`, `SpellSearchDialog.tsx:187`, `character/[id]/loading.tsx:5`, `SheetBackdrop.tsx:12` (baixa).
- Números crus fora de `Intl`: `CoinPouch.tsx:43-46`, `CharacterHeader.tsx:193` (baixa).
- `CombatStatsDialog.tsx:119,146` — `<Label>` sem `htmlFor` (baixa).
- `DeleteCharacterDialog.tsx:55-76` — Enter não confirma; sem `spellCheck={false}` (baixa).
- `AddItemDialog.tsx:217-219` — `aria-label` esconde preço/peso da linha (baixa).
- `CharacterCard.tsx:103` — "DnD 5e" do id interno, sem tradução (baixa).

## Pacote 6 — Texto (baixa)

- "..." → "…" em 28 chaves de `messages/pt.json` e `en.json` (`common.saving`, `common.loading`, `*.processing`, `loadingMessages.*`, placeholders do cabeçalho etc.). Um sed resolve.
- Sem reticências: `spellsDrawer.loading`, `characters.loadingList`, placeholders de busca.
- `characters.loadErrorTitle` ("Ocorreu um erro") não diz o que fazer.
- `translate="no"` em "Rebs Tech Studio" e na chave Pix (`FooterContent.tsx:146,231`).
- `JoinPartyCard.tsx:79` — nome da mesa em `<p>` em vez de `<h2>`.
- `shared/ImageUpload.tsx:81-89,103,119` — sem `focus-ring`, overlay só no hover, `id` fixo.
