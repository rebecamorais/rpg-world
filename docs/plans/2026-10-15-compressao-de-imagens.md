# Compressão das imagens enviadas

**Data:** 2026-10-15
**Status (2026-10-21):** compressão no navegador entregue, junto com recorte/zoom antes de salvar
e visualização em tela cheia. Decisões na implementação: recorte quadrado com `react-easy-crop`,
1024 px no maior lado (para a tela cheia não ficar borrada), alvo de 800 KB, WebP com JPEG de
reserva, sem Web Worker por enquanto. Pendentes: itens 4 e 5 da ordem abaixo.

**Status anterior:** planejamento, nada implementado. Detalha o item de imagens do plano
`2026-10-15-limites-de-uso.md`.

Objetivo: **toda imagem enviada é comprimida antes de subir e fica sempre abaixo de 2 MB**, sem o
usuário precisar fazer nada. Na prática, um avatar deve ficar na casa de dezenas a poucas centenas
de KB.

## Como está hoje

- Todos os uploads passam por um só lugar: `FileUploaderContext.upload`
  (`src/frontend/context/FileUploaderContext.tsx`), usado pelo `ImageUpload`. Destinos: perfil
  (`/api/profile/avatar`), personagem (`/api/characters/[id]/avatar`) e um `item` ainda sem rota.
- O arquivo vai como veio. O `<input>` aceita `image/jpeg,image/png,image/webp`.
- O servidor **recusa** acima de 2 MB (`character_error_avatar_file_too_large` e o equivalente no
  perfil), em vez de reduzir. Uma foto de celular (3–8 MB) simplesmente falha.
- Arquivos acima de ~4,5 MB nem chegam à API: é o limite de corpo das funções da Vercel.
- Fotos de celular carregam **metadados EXIF, inclusive localização GPS**, e hoje vão para um
  bucket público sem tratamento.
- O proxy `app/api/images/[...path]` serve o arquivo do jeito que está, com cache de 1 ano.

## Proposta

### 1. Comprimir no navegador (principal)

Um utilitário `compressImage(file, preset)` chamado dentro de `FileUploaderContext.upload`, antes
de montar o `FormData`. Assim todos os destinos ganham a compressão de uma vez.

- **Decodificar** com `createImageBitmap` (respeita a orientação do EXIF nos navegadores atuais,
  então a foto não sai deitada).
- **Redimensionar** para a dimensão máxima do preset, mantendo a proporção:
  - avatar (perfil e personagem): 512 px no maior lado;
  - item e futuras imagens maiores: 1024–1600 px.
- **Codificar em WebP** (qualidade inicial ~0,85) via `OffscreenCanvas.convertToBlob` ou
  `canvas.toBlob`. Isso também **remove o EXIF**, inclusive o GPS.
- **Garantir o teto:** se o resultado passar do alvo do preset (ex.: 300 KB para avatar), tentar de
  novo com qualidade menor (0,75 → 0,6); se ainda passar, reduzir a dimensão em 25% e repetir.
  Parar quando ficar abaixo do alvo ou depois de poucas tentativas, nunca acima de 2 MB.
- **Fallback de formato:** alguns Safari não geram WebP no canvas (devolvem PNG). Conferir o
  `blob.type`; sem WebP, usar JPEG (sem transparência) ou PNG quando a imagem tiver transparência.
- **Não piorar:** se o arquivo original já for pequeno e menor que o comprimido, enviar o original
  (ainda assim reencodado se tiver EXIF).
- **Rodar fora da thread principal** com um Web Worker + `OffscreenCanvas` quando existir, para a
  tela não travar com fotos grandes; senão, no canvas comum.
- **Interface:** o `ImageUpload` já mostra "carregando"; a compressão entra nesse mesmo estado. A
  pré-visualização pode usar a imagem já comprimida.
- **HEIC (iPhone):** com o `accept` atual o iOS costuma converter para JPEG ao escolher a foto;
  conferir num aparelho real. Se não converter, mostrar erro claro ("formato não suportado").

Implementar à mão (~80 linhas, sem dependência) ou usar `browser-image-compression`, que já faz o
laço de qualidade/dimensão em worker. Preferência por escrever à mão: é pouco código e fácil de
testar.

### 2. Servidor continua sendo a garantia

O navegador pode ser contornado (upload direto ou chamada manual à API), então o servidor não
confia na compressão:

- Mantém a recusa acima de 2 MB e a lista de tipos, nos casos de uso
  (`UploadCharacterAvatarUseCase`, `UploadAvatarUseCase`).
- Bucket `avatars` com `file_size_limit` de 2 MB e `allowed_mime_types` (já previsto no plano de
  limites), para valer também no upload direto ao Storage.
- **Opcional, depois:** reencodar no servidor com `sharp` (tirar EXIF e padronizar em WebP mesmo
  quando o arquivo não passou pelo navegador). Só se aparecer upload sem compressão na prática,
  porque aumenta o pacote e o tempo da função.

### 3. Mensagens

- Erro de tamanho no servidor deixa de ser comum; a mensagem fica para casos raros ("imagem muito
  grande mesmo depois de reduzida").
- Erro de decodificação (arquivo corrompido ou formato que o navegador não lê) ganha código e
  tradução próprios.

## Testes

- **Unit** do `compressImage` (no ambiente de testes com canvas simulado ou no navegador do
  Vitest/Playwright):
  - foto grande (ex.: 4000×3000, 6 MB) → WebP ≤ alvo, maior lado = 512 px, proporção mantida;
  - PNG com transparência mantém a transparência;
  - imagem pequena não é aumentada;
  - EXIF/GPS não sobrevive;
  - arquivo inválido gera o erro de decodificação.
- **Unit** do `FileUploaderContext`: o `FormData` enviado contém o arquivo comprimido.
- **E2E:** subir uma foto de ~6 MB como avatar funciona e o arquivo salvo tem menos de 2 MB
  (hoje esse caso falha).

## Ordem sugerida

1. `compressImage` com presets e testes.
2. Ligar no `FileUploaderContext.upload` (todos os destinos).
3. Worker + `OffscreenCanvas` e fallback de formato no Safari.
4. Limites no bucket (junto com o plano de limites).
5. `sharp` no servidor só se for necessário.
