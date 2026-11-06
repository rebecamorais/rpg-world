# Imagem completa do personagem: plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Guardar a imagem completa de personagens e NPCs ao lado do avatar recortado e usá-la no modal e no reajuste.

**Architecture:** O nome do arquivo liga os dois: `X.ext` é a completa e `X-avatar.ext` é o avatar, que continua sendo a URL salva no banco. Um helper compartilhado faz a conversão. O job de limpeza filtra a lista em código, sem migração.

**Tech Stack:** Next.js, React, Supabase Storage, Vitest e Playwright.

**Spec:** `docs/superpowers/specs/2026-11-06-imagem-completa-design.md`

> **Mudança depois da revisão final:** o filtro em código da Task 3 foi trocado por uma migração em `orphan_avatar_objects`, porque ele nunca apagaria imagens de contas excluídas. O design é a referência atual.

## Global Constraints

- Sem migração e sem coluna nova.
- Imagem completa: 2048px no maior lado e 2 MB, em constantes de `crop-image.ts`. Avatar: segue 1024px e 800 KB.
- A imagem completa sempre passa pelo canvas ao ser gerada, o que remove EXIF e GPS.
- Vale só para personagens e NPCs. Perfil e imagem da mesa não mudam.
- Na dúvida, o job de limpeza guarda o arquivo em vez de apagar.
- Branch `feat/imagem-completa`. Nomes de teste em português.

## Review Focus

- Upload em que a gravação do avatar falha depois da completa: nada vai para o rascunho e a completa não fica para trás (Task 2).
- `full` maior que 5 MB, com tipo proibido ou diferente de `file`: envio recusado com o erro de sempre (Task 2).
- Imagem antiga, perfil, demo e seed local: o modal não tenta buscar arquivo inexistente (Task 1 e Task 6).
- Reajuste com a imagem completa indisponível: mostra o erro e não abre o recorte, para não perder a imagem completa (Task 5).
- Trocar a imagem de um personagem novo por um upload ou excluí-lo: os dois arquivos saem (Task 3).

---

### Task 1: Nomes dos arquivos

**Files:**

- Create: `shared/avatar-files.ts`
- Test: `shared/avatar-files.unit.test.ts`

**Interfaces:**

- Produces:
  - `fullImageUrl(avatarUrl: string): string | null`: a URL da completa, ou `null` sem o sufixo em `/characters/`.
  - `avatarPathOf(fullPath: string): string`: `a/b-1.webp` vira `a/b-1-avatar.webp`.
  - `isFullImageCandidate(path: string): boolean`: está em `/characters/` e não termina em `-avatar.<ext>`.

- [ ] **Step 1: Escrever os testes**

```ts
const AVATAR = 'https://images.rpgworldapp.com/avatars/u/characters/c-1-avatar.webp';
expect(fullImageUrl(AVATAR)).toBe('https://images.rpgworldapp.com/avatars/u/characters/c-1.webp');
expect(fullImageUrl('https://x.test/avatars/u/characters/c-1.webp')).toBeNull(); // imagem antiga
expect(fullImageUrl('https://x.test/avatars/u/avatar-1-avatar.webp')).toBeNull(); // perfil
expect(fullImageUrl('/demo/pioneers/golden-oath.webp')).toBeNull();
expect(avatarPathOf('u/characters/c-1.webp')).toBe('u/characters/c-1-avatar.webp');
expect(isFullImageCandidate('u/characters/c-1.webp')).toBe(true);
expect(isFullImageCandidate('u/characters/c-1-avatar.webp')).toBe(false);
expect(isFullImageCandidate('u/avatar-1.webp')).toBe(false);
expect(isFullImageCandidate('u/parties/p-1.webp')).toBe(false);
```

- [ ] **Step 2: Confirmar a falha**

Run: `npx vitest run --config ./test/vitest.config.unit.ts shared/avatar-files.unit.test.ts`
Expected: FAIL, módulo não encontrado.

- [ ] **Step 3: Implementar em `shared/avatar-files.ts`**

- [ ] **Step 4: Confirmar que passa**, com o mesmo comando.

- [ ] **Step 5: Commit** `feat(imagem): nomes da imagem completa e do avatar / full image and avatar file names`

### Task 2: Gravar os dois arquivos no servidor

**Files:**

- Modify: `src/backend/contexts/characters/application/upload-avatar/upload-character-avatar.use-case.ts`
- Modify: `src/backend/contexts/characters/application/CharacterContext.ts:25`, `src/backend/contexts/characters/index.ts:142`, `src/backend/contexts/characters/interfaces/characters.api.ts:45`
- Modify: `app/api/characters/[id]/avatar/route.ts`
- Test: `upload-character-avatar.use-case.unit.test.ts`

**Interfaces:**

- Produces: `execute(characterId: string, userId: string, file: Blob, full?: Blob): Promise<string>`, devolvendo a URL do avatar. O campo `full` do formulário é opcional, e um valor que não seja `File` é ignorado.

- [ ] **Step 1: Escrever os testes**, com `newVersion` fixo em `v1`:

- `com full grava a completa com o nome normal e o avatar com sufixo`: `upload` recebe `owner-1/characters/char-1-v1.webp` e `owner-1/characters/char-1-v1-avatar.webp`, e o retorno é a URL do segundo.
- `sem full o nome é o de hoje`: só `owner-1/characters/char-1-v1.webp`.
- `recusa full acima do limite`: `AVATAR_FILE_TOO_LARGE`, sem nenhum `upload`.
- `recusa full de tipo proibido`: `AVATAR_INVALID_TYPE`, sem nenhum `upload`.
- `recusa tipos diferentes entre os dois`: `AVATAR_INVALID_TYPE`, sem nenhum `upload`.
- `se gravar o avatar falhar, apaga a completa e repassa o erro`: `storage.remove` recebe o caminho da completa.

- [ ] **Step 2: Confirmar a falha**

Run: `npx vitest run --config ./test/vitest.config.unit.ts src/backend/contexts/characters/application/upload-avatar`
Expected: FAIL nos testes novos.

- [ ] **Step 3: Implementar**

Grava a completa primeiro e depois o avatar. A remoção de limpeza é de melhor esforço, como em `removeReplacedAsset`, e a falha dela não esconde o erro original.

- [ ] **Step 4: Confirmar que passa**, com o mesmo comando.

- [ ] **Step 5: Commit** `feat(imagem): salvar imagem completa e avatar / store full image and avatar`

### Task 3: Remoção e job de limpeza

**Files:**

- Modify: `src/backend/contexts/characters/application/upload-avatar/character-avatar-file.ts`
- Modify: `src/backend/shared/application/cleanup-orphan-avatars.use-case.ts`
- Test: `cleanup-orphan-avatars.use-case.unit.test.ts`, `update-character.use-case.unit.test.ts`, `delete-character.use-case.unit.test.ts`, `supabase-orphan-avatar-finder.integration.test.ts`

**Interfaces:**

- Consumes: `fullImageUrl`, `avatarPathOf` e `isFullImageCandidate` (Task 1).

- [ ] **Step 1: Escrever os testes**

Job:

```ts
const inUse = 'u/characters/c-1.webp'; // o -avatar dele não está na lista: está em uso
const pair = ['u/characters/c-2.webp', 'u/characters/c-2-avatar.webp'];
const profile = 'u/avatar-3.webp';
// useCase.execute() com [inUse, ...pair, profile]
expect(removed).toEqual([...pair, profile]);
```

- Teste `avatar com sufixo órfão sai mesmo sem a completa na lista`.
- `removeCharacterAvatar`: `trocar remove avatar e completa`, `excluir remove os dois` e `avatar antigo remove só ele`.
- Integração, com o bucket de teste: um personagem usa `X-avatar.webp`, `X.webp` existe e os dois têm a idade mínima. Depois de rodar finder e use case de verdade, `X.webp` continua no bucket.

- [ ] **Step 2: Confirmar a falha**

Run: `npx vitest run --config ./test/vitest.config.unit.ts src/backend/shared/application src/backend/contexts/characters/application`
Expected: FAIL nos testes novos.

- [ ] **Step 3: Implementar**

- O job monta um `Set` da lista e descarta o caminho que for candidato e cujo `avatarPathOf` não esteja no conjunto.
- `removed` conta só o que foi apagado.
- `removeCharacterAvatar` chama `removeReplacedAsset` também para `fullImageUrl(previousUrl)`, quando houver, comparando com `fullImageUrl(character.avatarUrl)`.

- [ ] **Step 4: Confirmar que passa**, com o mesmo comando e `npm run test:integration -- supabase-orphan-avatar-finder`.

- [ ] **Step 5: Commit** `fix(imagem): limpeza preserva a imagem completa em uso / cleanup keeps the full image in use`

### Task 4: Gerar a imagem completa no navegador

**Files:**

- Modify: `src/frontend/lib/crop-image.ts`
- Test: `src/frontend/lib/crop-image.unit.test.ts`

**Interfaces:**

- Produces: `FULL_MAX_SIDE = 2048`, `FULL_MAX_BYTES = 2 * 1024 * 1024` e `fullImage(file: Blob): Promise<File>`.

- [ ] **Step 1: Escrever o teste** `fullImage mantém a imagem inteira e a proporção`

Com `createImageBitmap` simulado em 4000 por 2000 e um canvas falso, `drawImage` recebe `(bitmap, 0, 0, 4000, 2000, 0, 0, 2048, 1024)`. Também `não aumenta imagem pequena`: em 800 por 600, o destino é 800 por 600.

- [ ] **Step 2: Confirmar a falha**

Run: `npx vitest run --config ./test/vitest.config.unit.ts src/frontend/lib/crop-image.unit.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**, reaproveitando o desenho e a codificação de `cropImage`, em uma função interna que recebe a área.

- [ ] **Step 4: Confirmar que passa**, com o mesmo comando.

- [ ] **Step 5: Commit** `feat(imagem): gerar a imagem completa / generate the full image`

### Task 5: Enviar e reaproveitar a imagem completa

**Files:**

- Modify: `src/frontend/hooks/useImageCrop.ts`
- Modify: `src/frontend/context/FileUploaderContext.tsx`
- Modify: `src/frontend/components/shared/ImageUpload.tsx`
- Modify: `src/frontend/components/character/CharacterCustomizationDialog.tsx`, `src/frontend/components/character/AdjustableAvatarViewer.tsx`
- Test: `src/frontend/hooks/useImageCrop.unit.test.tsx`, `src/frontend/components/shared/ImageUpload.unit.test.tsx`

**Interfaces:**

- Consumes: `fullImageUrl` (Task 1), `fullImage` (Task 4), `loadStoredImage`.
- Produces:
  - `useImageCrop` ganha `keepFull?: boolean`, e `upload` passa a ser `(file: File, full?: File) => Promise<{ url: string }>`.
  - `UploadParams` ganha `full?: File`, enviado no campo `full`.
  - `ImageUpload` ganha `keepFullImage?: boolean`, ligado na tela de personalização.

- [ ] **Step 1: Escrever os testes** do hook, com `keepFull: true`:

- `arquivo novo envia recorte e completa gerada`: `fullImage` recebe o arquivo escolhido.
- `sem keepFull não gera nem envia completa`.
- `ajuste lê a completa e reenvia sem recodificar`: com URL `-avatar`, `loadStoredImage` recebe a URL completa, e `fullImage` não é chamado quando os tipos batem.
- `ajuste em outro formato recodifica a completa`: com a completa em `image/webp` e o recorte em `image/jpeg`, `fullImage` é chamado.
- `falha ao ler a completa avisa e não abre o recorte com o avatar`: a leitura rejeita, aparece o erro e nada é enviado.
- `imagem antiga não tenta a completa`: `loadStoredImage` é chamado uma vez, com a URL original.

`ImageUpload`: `com keepFullImage o formulário leva o campo full`.

- [ ] **Step 2: Confirmar a falha**

Run: `npx vitest run --config ./test/vitest.config.unit.ts src/frontend/hooks/useImageCrop.unit.test.tsx src/frontend/components/shared/ImageUpload.unit.test.tsx`
Expected: FAIL nos testes novos.

- [ ] **Step 3: Implementar**

`pending` guarda de onde vem a completa: `generate` (arquivo novo), `reuse` (lida do armazenamento) ou `none`. A leitura em `adjust` usa `fullImageUrl(url)` quando existe, sem recorrer ao avatar se falhar, e `url` com `none` nos demais casos.

- [ ] **Step 4: Confirmar que passa**, com o mesmo comando mais `StatusView.unit.test.tsx`.

- [ ] **Step 5: Commit** `feat(imagem): enviar e reaproveitar a imagem completa / upload and reuse the full image`

### Task 6: Mostrar a imagem completa no modal

**Files:**

- Modify: `src/frontend/components/shared/ImageViewerDialog.tsx`
- Test: `src/frontend/components/shared/ImageViewerDialog.unit.test.tsx`

**Interfaces:**

- Consumes: `fullImageUrl` (Task 1). `src` continua sendo a URL do avatar, então quem chama o modal não muda.

- [ ] **Step 1: Escrever os testes**

- `avatar novo abre a imagem completa`: `src` da imagem sem `-avatar`.
- `imagem antiga abre como está`.
- `se a completa não carregar, mostra o avatar`: `fireEvent.error(image())`, e `src` passa a ser a do avatar.

- [ ] **Step 2: Confirmar a falha**

Run: `npx vitest run --config ./test/vitest.config.unit.ts src/frontend/components/shared/ImageViewerDialog.unit.test.tsx`
Expected: FAIL nos testes novos.

- [ ] **Step 3: Implementar em `ZoomStage`**, com um estado `failed` e `object-contain` para arte não quadrada.

- [ ] **Step 4: Confirmar que passa**, com o mesmo comando.

- [ ] **Step 5: Commit** `feat(imagem): modal mostra a imagem completa / viewer shows the full image`

### Task 7: Ponta a ponta e PR

**Files:**

- Modify: `e2e/sheet-save.spec.ts`

- [ ] **Step 1: Escrever o teste** `guarda a imagem completa, usa no modal e limpa o par anterior`

Envia uma imagem não quadrada e salva. Confere que o modal abre a URL sem `-avatar`, com `naturalWidth` maior que a altura natural. Ajusta e salva. Pelo `adminClient`, lista `<user>/characters` e confere que só o par novo ficou.

- [ ] **Step 2: Rodar**

Run: `npx playwright test e2e/sheet-save.spec.ts e2e/profile.spec.ts e2e/demo-image.spec.ts`
Expected: PASS.

- [ ] **Step 3: Rodar a verificação da CI**

Run: `npx tsc --noEmit && npm run lint && npm run knip && npm run test:coverage && npm run test:integration && npx playwright test && npm run test:visual`
Expected: tudo passa. Integração e e2e rodam em sequência, porque dividem o banco de teste.

- [ ] **Step 4: Commit** `test(imagem): imagem completa de ponta a ponta / end-to-end full image`

- [ ] **Step 5: Abrir o PR**

Push e PR em português e inglês. A descrição diz que não há migração, destaca a mudança no job de limpeza e pede para olhar a cota do Supabase depois do deploy.
