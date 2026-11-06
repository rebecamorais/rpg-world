# Imagem completa do personagem

Continuação do projeto [zoom e reajuste](2026-11-06-imagem-zoom-e-reajuste-design.md), já em produção pelo PR #152.

## Intenção

A dona do projeto quer guardar duas versões da imagem de um personagem: a completa e a recortada para o avatar. Assim, o "ver ampliado" mostra a arte inteira, e o reajuste recupera o que ficou fora do primeiro recorte sem novo upload.

## Objetivos

- Um novo upload de imagem de personagem ou NPC guarda a imagem completa e o avatar recortado.
- O "ver ampliado" mostra a imagem completa quando ela existe, em todas as telas onde já abre.
- "Ajustar imagem" abre o recorte com a imagem completa.
- Listas, cards e combate continuam usando só o avatar recortado, sem ficar mais pesados.

## Fora deste projeto

- Avatar do perfil e imagem da mesa. Decisão do autor: quem pediu falou de personagem.
- Recuperar o original de imagens já enviadas. Ele não existe mais.
- Lembrar a posição do último recorte. O recorte sempre abre centralizado.
- Mudanças visuais do modal além do necessário para arte não quadrada.

## O que seria um fracasso

- A imagem completa levar localização GPS ou outros metadados da foto para o armazenamento.
- O job diário apagar imagens completas em uso.
- Arquivos completos ficarem para trás quando o avatar é trocado ou o personagem é excluído.
- Personagens antigos ficarem sem imagem no modal.
- Um upload terminar com avatar novo e imagem completa de outra versão.

## Como guardar

Decisão da dona: **sem migração e sem coluna nova**. A imagem completa fica com o nome normal, e o recorte ganha o sufixo `-avatar`:

```
<userId>/characters/<characterId>-<versão>.webp          completa
<userId>/characters/<characterId>-<versão>-avatar.webp   avatar
```

`avatar_url` continua guardando o avatar recortado, agora com o sufixo. Assim, ficha, listas, elenco, cartão de interpretação e combate funcionam sem mudança.

O nome também separa novos de antigos: uma URL sem `-avatar` é de antes deste projeto e não tem imagem completa, então nem há tentativa de buscá-la.

## Comportamento

### Upload

- Só com alvo `character`. No navegador, além do recorte atual, gera a imagem completa pelo canvas, o que remove EXIF e GPS.
- Limite da completa: **2048px no maior lado e 2 MB**. O avatar continua com 1024px e 800 KB.
- O envio é um único POST para `/api/characters/<id>/avatar`, com os campos `file` e `full`. `full` é opcional, para clientes antigos ainda abertos.
- O servidor valida `full` com as mesmas regras de tamanho (5 MB) e tipo de `file`, e rejeita o envio se os dois tipos forem diferentes. Isso garante que os dois nomes tenham a mesma extensão.
- Com `full`, o recorte é gravado com `-avatar` e a completa com o nome normal, na mesma versão. Sem `full`, o nome é o de hoje. O avatar só é devolvido se os dois forem gravados. Se a segunda gravação falhar, o erro é o de sempre e nada vai para o rascunho.

### Modal

- Um helper recebe a URL do avatar e, se ela terminar em `-avatar.<ext>`, tira o sufixo e devolve a da imagem completa. Qualquer outra (imagem antiga, perfil, demo, seed local) continua igual e não gera 404.
- Se a imagem completa não carregar por outro motivo, o `<img>` troca para o avatar, sem mensagem de erro.
- Enquanto há arte não quadrada, a área continua quadrada com `object-contain` e fundo sólido.

### Reajuste

- Lê a imagem completa quando a URL tem `-avatar`. Se essa leitura falhar, mostra o erro e não abre o recorte: abrir com o avatar e salvar apagaria a imagem completa para sempre. Nos demais casos, lê o avatar, como hoje.
- Ao confirmar, envia o novo recorte e a imagem completa que foi lida, sem recodificar, para não perder qualidade a cada ajuste. Exceção, decisão do autor: se o navegador gerar o recorte em outro formato, como JPEG onde não há WebP, a imagem completa é recodificada só nesse caso, porque os dois arquivos precisam ter a mesma extensão. Se só havia o avatar, nenhum `full` é enviado e o caso segue como hoje.
- Na ficha, continua indo para o rascunho e grava só com Salvar.

### Limpeza

- `removeCharacterAvatar` apaga o avatar e, quando a URL tem `-avatar`, a imagem completa. Vale para troca e exclusão.
- **Cuidado com o job diário:** `orphan_avatar_objects` considera órfão todo arquivo que nenhuma linha do banco cita, e a imagem completa nunca é citada. Sem tratamento, ele apagaria toda imagem completa em uso depois de um dia.
- Em vez de mudar a função SQL, `CleanupOrphanAvatarsUseCase` filtra a lista: um arquivo com nome normal em `/characters/` só é apagado se o `-avatar` dele também estiver na lista de órfãos. Se o par não está na lista, ele está em uso, e o arquivo fica. Na dúvida, o filtro sempre guarda em vez de apagar.
- Custo aceito: um arquivo antigo abandonado nas 24 horas antes do deploy, ou cuja remoção falhou, deixa de ser limpo. São poucos e não afetam ninguém.
- Personagem duplicado não muda: a cópia já começa sem imagem (`duplicate_character` não copia `avatar_url`).

## Risco a confirmar

A cota de armazenamento do Supabase não foi verificada. O limite de 2 MB fica em uma constante para ser reduzido sem outra mudança. Cada personagem pode passar de cerca de 800 KB para até 2,8 MB, e cada reajuste não salvo deixa arquivos por quase dois dias, porque o job roda uma vez por dia e ignora arquivos com menos de um dia.

## Qualidade

- Unitários: helper de nome, geração da imagem completa (limites e proporção), fluxo do hook com e sem imagem completa, validação do upload, remoção dos dois arquivos e filtro do job (completa em uso fica, par órfão sai, avatar antigo órfão com sufixo sai).
- Integração: com o job de verdade, a imagem completa de um avatar em uso continua no bucket.
- E2E: envia uma imagem não quadrada, o modal mostra a completa, o reajuste a reaproveita e salvar remove o par anterior.
- Nenhuma migração. A descrição do PR deve dizer isso e destacar que o job de limpeza mudou.

## Deixado para quem construir

- Como `ImageUpload` e `useImageCrop` recebem a opção de guardar a imagem completa.
- A assinatura do upload no `FileUploaderContext`.

## Entrega

Branch `feat/imagem-completa`, commits por assunto e PR com descrição em português e inglês. O merge é feito pela dona do projeto.
