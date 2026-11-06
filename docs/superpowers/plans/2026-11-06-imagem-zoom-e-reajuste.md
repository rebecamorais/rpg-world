# Zoom e reajuste de imagem: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dar zoom no modal da imagem do personagem, abri-lo nas telas principais e permitir reajustar a imagem salva a partir da ficha.

**Architecture:** A matemática do zoom fica em funções puras e o `ImageViewerDialog` cuida dos gestos. Um hook (`useImageCrop`) passa a concentrar o fluxo recortar-e-enviar, usado pelo `ImageUpload` e pelo reajuste. O reajuste lê a imagem salva pela rota `/api/images` do próprio domínio.

**Tech Stack:** Next.js, React, next-intl, Radix Dialog, react-easy-crop, Vitest, Playwright e axe.

**Spec:** `docs/superpowers/specs/2026-11-06-imagem-zoom-e-reajuste-design.md`

## Global Constraints

- Sem dependência nova: o zoom usa Pointer Events e CSS `transform`.
- Zoom de 1x a 5x, igual ao recorte.
- Textos novos em `messages/en.json` e `messages/pt.json`. `es` e `sv` seguem pelo Crowdin.
- "Ajustar imagem" só aparece no modal aberto pelo cabeçalho da ficha (quando `readOnly` é falso) e pelo `ImageUpload`.
- No cabeçalho da ficha, o reajuste chama só `update({ avatarUrl })`: vai para o rascunho e é gravado com Salvar.
- Nenhuma URL arbitrária vai para o servidor baixar. A leitura usa o caminho `/api/images/...`, já validado pela rota.
- Trabalhar na branch `feat/imagem-zoom-reajuste`. Nomes de teste em português, como no restante do projeto.
- A rota responde em produção: `GET https://www.rpgworldapp.com/api/images/avatars/00000000/nao-existe.webp` devolveu 404 JSON `Asset not found` em 2026-11-06. Falta confirmar com uma imagem real depois do deploy (Task 6).

## Review Focus

- URL antiga ou de outro host no `avatarUrl`: mostra erro traduzido e mantém a imagem (Task 1 e Task 4).
- Rota responde 200 com conteúdo que não é imagem: tratado como erro, sem abrir o recorte (Task 1).
- Reajustar com outras edições não salvas na ficha: só `avatarUrl` muda no rascunho (Task 4).
- Afastar depois de mover a imagem, ou reabrir o modal: volta a 1x e centralizada (Task 2 e Task 3).
- Clicar em ampliar ou dentro do modal num card ou na linha de combate: não navega nem expande a linha (Task 5).

---

### Task 1: Ler a imagem salva

**Files:**

- Create: `src/frontend/lib/stored-image.ts`
- Test: `src/frontend/lib/stored-image.unit.test.ts`

**Interfaces:**

- Produces: `storedImagePath(url: string): string` e `loadStoredImage(url: string): Promise<Blob>`, que rejeita com erro quando a leitura falha.

- [ ] **Step 1: Escrever os testes**

```ts
expect(storedImagePath('https://images.rpgworldapp.com/avatars/u/c-1.webp')).toBe(
  '/api/images/avatars/u/c-1.webp',
);
expect(storedImagePath('http://localhost:3000/api/images/avatars/u/c-1.webp')).toBe(
  '/api/images/avatars/u/c-1.webp',
);
// loadStoredImage, com fetch simulado:
// - busca em storedImagePath(url) e devolve o Blob quando é 200 com `image/webp`
// - rejeita com 404
// - rejeita com 200 `application/octet-stream` (a rota serve assim o que não é imagem)
```

- [ ] **Step 2: Confirmar a falha**

Run: `npx vitest run --config ./test/vitest.config.unit.ts src/frontend/lib/stored-image.unit.test.ts`
Expected: FAIL, módulo não encontrado.

- [ ] **Step 3: Implementar em `src/frontend/lib/stored-image.ts`**

`storedImagePath` usa só o `pathname` da URL, tira um prefixo `/api/images` existente e coloca o prefixo de volta. Assim, o host da URL nunca é usado na leitura.

- [ ] **Step 4: Confirmar que passa**

Mesmo comando. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/frontend/lib/stored-image.ts src/frontend/lib/stored-image.unit.test.ts
git commit -m "feat(imagem): leitura da imagem salva pelo próprio domínio / read stored images through the app's own origin"
```

### Task 2: Matemática do zoom

**Files:**

- Create: `src/frontend/lib/image-zoom.ts`
- Test: `src/frontend/lib/image-zoom.unit.test.ts`

**Interfaces:**

- Produces:
  - `MIN_ZOOM = 1`, `MAX_ZOOM = 5`, `ZOOM_STEP = 0.5`, `PAN_STEP = 40`
  - `type ZoomState = { zoom: number; x: number; y: number }`
  - `type Size = { width: number; height: number }`
  - `INITIAL_ZOOM: ZoomState`, com `{ zoom: 1, x: 0, y: 0 }`
  - `zoomTo(state: ZoomState, zoom: number, viewport: Size, focus?: { x: number; y: number }): ZoomState`
  - `panBy(state: ZoomState, dx: number, dy: number, viewport: Size): ZoomState`

- [ ] **Step 1: Escrever os testes**

Use `viewport = { width: 400, height: 400 }`. O `focus` é medido a partir do centro da área, e `x` e `y` são o deslocamento do centro da imagem. O limite do deslocamento é `(zoom - 1) * lado / 2`, o que mantém a área coberta.

```ts
expect(zoomTo(INITIAL_ZOOM, 9, viewport).zoom).toBe(5);
expect(zoomTo(INITIAL_ZOOM, 0.2, viewport).zoom).toBe(1);
expect(panBy(INITIAL_ZOOM, 50, 50, viewport)).toEqual(INITIAL_ZOOM); // 1x não move
expect(panBy({ zoom: 2, x: 0, y: 0 }, 500, -500, viewport)).toEqual({ zoom: 2, x: 200, y: -200 });
expect(zoomTo({ zoom: 3, x: 300, y: -300 }, 1, viewport)).toEqual(INITIAL_ZOOM); // afastar recentraliza
expect(zoomTo(INITIAL_ZOOM, 2, viewport, { x: 100, y: 0 })).toEqual({ zoom: 2, x: -100, y: 0 }); // o ponto sob o cursor não sai do lugar
```

- [ ] **Step 2: Confirmar a falha**

Run: `npx vitest run --config ./test/vitest.config.unit.ts src/frontend/lib/image-zoom.unit.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar em `src/frontend/lib/image-zoom.ts`**

Com foco: `x' = focus.x - (focus.x - x) * (novoZoom / zoomAtual)`, e o mesmo para `y`. Depois aplica o limite de deslocamento.

- [ ] **Step 4: Confirmar que passa**

Mesmo comando. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/frontend/lib/image-zoom.ts src/frontend/lib/image-zoom.unit.test.ts
git commit -m "feat(imagem): cálculo de zoom e deslocamento / zoom and pan math"
```

### Task 3: Modal com zoom

**Files:**

- Modify: `src/frontend/components/shared/ImageViewerDialog.tsx`
- Modify: `messages/en.json`, `messages/pt.json` (em `avatarUpload`)
- Test: `src/frontend/components/shared/ImageViewerDialog.unit.test.tsx`

**Interfaces:**

- Consumes: Task 2.
- Produces: `ImageViewerDialog({ src, alt, open, onOpenChange, onAdjust?: () => void })`. Sem `onAdjust`, o botão de ajustar não aparece. Ao clicar nele, chama `onOpenChange(false)` e depois `onAdjust()`.
- Textos novos:

| Chave             | en                                                     | pt                                                              |
| ----------------- | ------------------------------------------------------ | --------------------------------------------------------------- |
| `zoomIn`          | Zoom in                                                | Aproximar                                                       |
| `zoomOut`         | Zoom out                                               | Afastar                                                         |
| `zoomFit`         | Fit to screen                                          | Ajustar à tela                                                  |
| `adjust`          | Adjust image                                           | Ajustar imagem                                                  |
| `viewOf`          | View {name}'s image                                    | Ver imagem de {name}                                            |
| `adjustLoadError` | Couldn't load the saved image. Try uploading it again. | Não foi possível carregar a imagem salva. Tente enviar de novo. |

- [ ] **Step 1: Escrever os testes**

Testes usam `renderWithProviders` e `messages.avatarUpload`:

- `abre sem zoom`: o botão `zoomOut` e o `zoomFit` ficam desabilitados, e o `zoomIn` habilitado.
- `aproxima e afasta pelos botões`: depois de clicar em `zoomIn`, a imagem tem `transform` com `scale(1.5)`. Clicar em `zoomFit` volta a `scale(1)`.
- `não passa de 5x`: depois de 8 cliques em `zoomIn`, o botão fica desabilitado.
- `setas movem a imagem quando há zoom`: com foco na área e zoom 2x, `{ArrowRight}` muda o `translate`. Em 1x, não muda.
- `reabrir volta ao início`: aproxima, fecha com `open={false}`, reabre e vê `scale(1)`.
- `sem onAdjust não mostra o botão de ajustar`.
- `com onAdjust fecha o modal e chama onAdjust`.

jsdom não mede layout, então simule `getBoundingClientRect` da área com 400 por 400.

- [ ] **Step 2: Confirmar a falha**

Run: `npx vitest run --config ./test/vitest.config.unit.ts src/frontend/components/shared/ImageViewerDialog.unit.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar**

- Um componente interno `ZoomStage` fica dentro do `DialogContent`, e o Radix o desmonta ao fechar. Isso reinicia o estado sem efeito extra.
- A área tem `tabIndex={0}`, `touch-none` e `overflow-hidden`, com nome acessível vindo de `viewTitle`.
- Roda do mouse: listener nativo com `{ passive: false }` em `useEffect`, porque o `onWheel` do React não pode chamar `preventDefault`. Pinça e arrasto: Pointer Events com `setPointerCapture`, guardando os ponteiros ativos em `useRef`.
- Setas chamam `panBy` com `PAN_STEP`. `motion-safe:transition-transform` respeita `prefers-reduced-motion`, e o arrasto ativo fica sem transição.
- A imagem ajusta a `object-contain`, e os controles ficam abaixo dela, com fundo sólido para o contraste não depender da imagem.

- [ ] **Step 4: Confirmar que passa**

Mesmo comando, mais `src/frontend/components/shared/ImageUpload.unit.test.tsx`. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/frontend/components/shared/ImageViewerDialog.tsx src/frontend/components/shared/ImageViewerDialog.unit.test.tsx messages/en.json messages/pt.json
git commit -m "feat(imagem): zoom no modal de ver ampliado / zoom in the image viewer"
```

### Task 4: Reajustar a imagem salva

**Files:**

- Create: `src/frontend/hooks/useImageCrop.ts`
- Create: `src/frontend/components/shared/LazyImageCropDialog.tsx`
- Create: `src/frontend/components/character/AdjustableAvatarViewer.tsx`
- Modify: `src/frontend/components/shared/ImageUpload.tsx`
- Modify: `src/frontend/components/character/CharacterHeader.tsx:98-115`
- Test: `src/frontend/hooks/useImageCrop.unit.test.tsx`, `src/frontend/components/shared/ImageUpload.unit.test.tsx`, `src/frontend/components/character/StatusView.unit.test.tsx`

**Interfaces:**

- Consumes: `loadStoredImage` (Task 1), `onAdjust` (Task 3), `cropImage`.
- Produces:

```ts
useImageCrop(options: {
  upload: (file: File) => Promise<{ url: string }>;
  onUploaded: (url: string) => void;
  onUploadError?: (err: unknown) => void;
}): {
  preview: string | null;
  cropSource: string | null;
  isLoadingSource: boolean;
  pickFile(file: File): void;
  adjust(url: string): Promise<void>;
  cancel(): void;
  confirm(area: CropArea | null): Promise<void>;
};
```

- `LazyImageCropDialog`: o mesmo `dynamic(..., { ssr: false })` que hoje está em `ImageUpload.tsx:19-22`.
- `AdjustableAvatarViewer({ characterId, src, alt, open, onOpenChange })`: junta o modal, o hook e o recorte. Usa `useFileUploader().upload({ file, target: 'character', id: characterId })`, e `onUploaded` chama `useCharacterActions().update({ avatarUrl: url })`.

- [ ] **Step 1: Escrever os testes**

`useImageCrop.unit.test.tsx`, com `cropImage` e `loadStoredImage` simulados como em `ImageUpload.unit.test.tsx`:

- `adjust abre o recorte com a imagem salva`: `cropSource` fica preenchido e `isLoadingSource` volta a falso.
- `falha ao carregar não abre o recorte`: `loadStoredImage` rejeita, `toast.error` recebe `adjustLoadError`, `cropSource` fica nulo e `onUploaded` não é chamado.
- `cancelar não envia nada`: `upload` não é chamado e o object URL é revogado.
- `confirmar envia e avisa a nova URL`.
- `falha no envio não avisa nova URL`: `onUploaded` não é chamado e `onUploadError` é.

`ImageUpload.unit.test.tsx`: `ver imagem e ajustar reabre o recorte com a imagem atual`. Os testes atuais do arquivo continuam passando sem mudança.

`StatusView.unit.test.tsx`:

- `dono ajusta pelo modal do cabeçalho`: o botão `adjust` aparece. Ao confirmar, o rascunho muda só em `avatarUrl`, e outro campo editado antes continua no rascunho.
- `mestre não vê ajustar`: em `params.value = { partyId: 'p' }`, o modal abre sem o botão.

- [ ] **Step 2: Confirmar a falha**

Run: `npx vitest run --config ./test/vitest.config.unit.ts src/frontend/hooks/useImageCrop.unit.test.tsx src/frontend/components/shared/ImageUpload.unit.test.tsx src/frontend/components/character/StatusView.unit.test.tsx`
Expected: FAIL nos testes novos.

- [ ] **Step 3: Implementar**

- Mover o fluxo de `ImageUpload.tsx:54-115` para o hook, sem mudar o comportamento. `pending.file` passa a ser `Blob`, e `cropImage` já aceita `Blob`.
- `ImageUpload` usa o hook e passa `onAdjust={() => adjust(currentUrl)}` ao modal quando há `currentUrl`.
- No `CharacterHeader`, `readOnly` renderiza o `ImageViewerDialog` atual e os demais renderizam `AdjustableAvatarViewer`. O `useFileUploader` lança erro sem provider, e por isso não pode rodar na demo nem na visão do mestre. Se os testes falharem com `must be used within a FileUploaderProvider`, envolva `renderWithCharacter` em `test/helpers/character.tsx` com `FileUploaderProvider`.

- [ ] **Step 4: Confirmar que passa**

Mesmo comando. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/frontend/hooks/useImageCrop.ts src/frontend/hooks/useImageCrop.unit.test.tsx src/frontend/components/shared src/frontend/components/character test/helpers/character.tsx
git commit -m "feat(imagem): reajustar a imagem salva pela ficha / re-crop the saved image from the sheet"
```

### Task 5: Abrir o modal nas outras telas

**Files:**

- Create: `src/frontend/components/shared/ViewImageButton.tsx`
- Modify: `src/frontend/components/character/CharacterCard.tsx:64-68`
- Modify: `src/frontend/components/party/PartyRoster.tsx`
- Modify: `src/frontend/components/party/RolePlayCard.tsx:76-85`
- Modify: `src/frontend/components/combat/CombatRow.tsx:70-78`
- Test: `CharacterCard.unit.test.tsx`, `RolePlayCard.unit.test.tsx`, `CombatRow.unit.test.tsx` e `PartyRoster.unit.test.tsx`, ao lado de cada componente (crie o último se não existir)

**Interfaces:**

- Consumes: `ImageViewerDialog` (Task 3), texto `viewOf`.
- Produces: `ViewImageButton({ src, name, className }: { src?: string | null; name: string; className?: string })`. Devolve `null` sem `src`. Renderiza um botão redondo com o ícone `Maximize2`, como o de `CharacterHeader.tsx:99-106`, e o modal sem `onAdjust`.

- [ ] **Step 1: Escrever os testes**

Em cada um dos quatro arquivos:

- `amplia a imagem`: clicar no botão com o nome `viewOf` abre o diálogo com a imagem.
- `sem imagem não mostra o botão`.

Além disso:

- `CombatRow`: `ampliar não abre os detalhes`: depois de abrir e fechar o modal, o chevron continua com `aria-expanded="false"` em uma linha que não é o turno atual.
- `CharacterCard` e `RolePlayCard`: `ampliar não é um link`: o botão não fica dentro de nenhum `a` (`button.closest('a')` é `null`).

- [ ] **Step 2: Confirmar a falha**

Run: `npx vitest run --config ./test/vitest.config.unit.ts src/frontend/components/character/CharacterCard.unit.test.tsx src/frontend/components/party src/frontend/components/combat/CombatRow.unit.test.tsx`
Expected: FAIL nos testes novos.

- [ ] **Step 3: Implementar**

- O botão tem `relative z-10`, para ficar acima do link que cobre o card.
- `CharacterCard` e `CombatRow`: envolver o retrato em um `div` `relative shrink-0`, com o botão no canto. Em `CombatRow`, o `div` assume `self-stretch` para o retrato continuar esticado, e o `closest('a, button, input')` de `CombatRow.tsx:141` já impede que o clique abra a linha.
- `RolePlayCard`: como o retrato fica dentro do link, o botão é irmão do link, no canto superior direito do card.
- `PartyRoster`: o botão fica ao lado de `CharacterIdentity`, em uma linha `flex justify-between`.

- [ ] **Step 4: Confirmar que passa**

Mesmo comando. Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/frontend/components/shared/ViewImageButton.tsx src/frontend/components/character src/frontend/components/party src/frontend/components/combat
git commit -m "feat(imagem): ver ampliado em cards, mesa e combate / image viewer on cards, party and combat"
```

### Task 6: Verificação de ponta a ponta

**Files:**

- Modify: `e2e/profile.spec.ts`
- Modify: o spec de ficha que já cria personagem com `createCharacter`, se ele cobrir a aba Status. Se não, `e2e/a11y.spec.ts`.

**Interfaces:**

- Consumes: seletores por nome acessível das Tasks 3 e 4 e a fixture `AVATAR` de `e2e/profile.spec.ts:7`.

- [ ] **Step 1: Escrever os testes**

- `ajusta a imagem salva sem reenviar o arquivo` no perfil: envia o avatar, clica em ver imagem, usa `Adjust image` e salva o recorte. A `src` muda e `naturalWidth` é maior que 0.
- `ajustar na ficha só grava com Salvar`: envia a imagem e salva a ficha. Ajusta, recarrega sem salvar e vê a `src` anterior. Ajusta de novo, salva, recarrega e vê a `src` nova.
- `modal de imagem sem violações de acessibilidade`: com zoom 2x, roda axe com `withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])` e espera nenhuma violação séria ou crítica.

- [ ] **Step 2: Rodar**

Run: `npm run test:e2e -- e2e/profile.spec.ts`, mais o spec da ficha escolhido.
Expected: PASS. Pare o `next dev` antes, por causa da trava do Next.

- [ ] **Step 3: Rodar tudo**

Run: `npm run lint && npx tsc --noEmit && npm run test:unit`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add e2e
git commit -m "test(imagem): zoom e reajuste de ponta a ponta / end-to-end zoom and re-crop"
```

- [ ] **Step 5: Abrir o PR**

Push da branch e PR em português e inglês, com capturas do modal. O merge fica com a dona do projeto. A descrição deve lembrar de testar, depois do deploy, o reajuste de uma imagem real em `www.rpgworldapp.com`.
