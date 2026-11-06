# Imagem do personagem: zoom e reajuste do recorte

Primeiro de três projetos. Os outros dois estão em [2026-11-06-personalizacao-e-combate-decisoes.md](2026-11-06-personalizacao-e-combate-decisoes.md).

## Intenção

Ao abrir a própria ficha ou os NPCs da campanha, a pessoa quer olhar de perto a imagem de um personagem. Depois de um upload, também quer corrigir uma imagem que ficou mal alinhada, centralizando e aproximando, sem precisar procurar o arquivo de novo.

## Objetivos

- O modal "ver ampliado" permite dar zoom e mover a imagem ampliada.
- Quem pode editar o personagem reajusta a imagem já salva, sem reenviar o arquivo.
- O modal pode ser aberto onde o personagem aparece nas telas principais, não só no cabeçalho da ficha.

## Fora deste projeto

- Guardar a imagem original. O reajuste trabalha só com a imagem salva. O que ficou fora do primeiro recorte só volta com um novo upload, e a dona do produto aceitou essa limitação.
- Mostrar a arte inteira no modal. Ele mostra a imagem salva.
- A tela de combate do jogador, que ganha imagens no projeto de combate.
- Mudar o formato dos avatares. Isso é do projeto de personalização.

## O que seria um fracasso

- O zoom funcionar só com mouse, sem opção por toque ou teclado.
- O botão de reajuste aparecer para quem só pode ler a ficha (o mestre vendo a ficha de um jogador) ou na demo salvar alguma coisa.
- Um reajuste com falha apagar ou trocar a imagem atual.

## Como funciona hoje

- `src/frontend/components/shared/ImageViewerDialog.tsx`: modal sem zoom, usado por `CharacterHeader` e `ImageUpload`.
- `src/frontend/components/shared/ImageUpload.tsx`: escolhe o arquivo, abre `ImageCropDialog`, recorta com `cropImage` e envia.
- `src/frontend/lib/crop-image.ts`: gera a imagem final, com até 1024px no maior lado e cerca de 800 KB.
- `src/backend/contexts/characters/application/upload-avatar/`: o upload cria um arquivo versionado. Ao salvar a nova URL, o arquivo anterior é removido.
- `CharacterHeader` já recebe `readOnly` de `useSheetSource`.

## Comportamento

### Modal com zoom

- Mostra a imagem ajustada à tela ao abrir, sempre sem zoom.
- Aproxima pela roda do mouse e por pinça no toque. Também tem botões de aproximar, afastar e voltar ao ajuste, acessíveis por teclado.
- Com zoom, arrastar move a imagem, sem deixá-la sair toda da área visível. Pelo teclado, as setas fazem o mesmo.
- Usuários com `prefers-reduced-motion` não veem animação de zoom.
- Botões têm nome acessível e os textos existem em `en` e `pt`.

### Onde o modal abre

Decisão do autor deste documento, a ser conferida:

- Cabeçalho da ficha e `ImageUpload`, onde já existe.
- Cards de personagem e de NPC (`CharacterCard`).
- Elenco da mesa (`PartyRoster`).
- Linha de combate do mestre (`CombatRow`).
- Cartão de interpretação do mestre (`RolePlayCard`). O elenco só aparece na visão do jogador, então sem ele o mestre não amplia ninguém na página da mesa fora do combate.

O menu lateral fica de fora. Só aparece quando há imagem, e o emblema de classe não abre o modal.

Nos cards, um link cobre o card inteiro. O botão de ampliar fica acima dele, como o menu de ações do `CharacterCard`. Abrir o modal nunca navega para a ficha nem expande a linha de combate.

### Reajustar

- "Ajustar imagem" só aparece no modal aberto pelo cabeçalho da ficha e pela tela de personalização, para quem pode editar. Decisão da dona: nos cards, no elenco, no cartão de interpretação e no combate, o modal é só para ver. O `ImageViewerDialog` recebe esse comportamento por uma prop opcional, então o padrão é não mostrar.
- O botão abre `ImageCropDialog` com a imagem salva, reaproveitando `cropImage` e o envio atual.
- Decisão da dona: confirmar o recorte funciona como o upload de hoje. A nova URL vai para o rascunho da ficha (`update({ avatarUrl })`) e só é gravada com o botão Salvar, então descartar o rascunho desfaz o ajuste. O arquivo anterior só é removido quando o Salvar acontece. Sair sem salvar perde o ajuste, como já acontece com um upload.
- Cancelar não muda nada. Se carregar ou enviar falhar, a imagem atual continua e aparece uma mensagem de erro traduzida.
- O recorte continua redondo neste projeto. A mudança para quadrado com cantos arredondados vem com o projeto de personalização.
- Como `ImageUpload` é compartilhado, o avatar do perfil também ganha zoom e reajuste. A imagem da mesa usa outro componente e não muda.

## Risco técnico a resolver primeiro

Em produção, as URLs salvas apontam para `images.rpgworldapp.com`, e `cropImage` precisa ler os bytes da imagem. Ler desse domínio pelo navegador seria bloqueado: o `connect-src` de `shared/http/security-headers.ts` não o inclui. O caminho previsto é ler pela rota `/api/images` no domínio do próprio app. Ela não tem bloqueio para produção e `next.config.ts` já redireciona `images.rpgworldapp.com` para ela. O primeiro passo do plano é confirmar esse caminho em produção. Não é permitido enviar uma URL arbitrária para o servidor baixar.

A demo usa imagens próprias e não salva nada, por isso "Ajustar imagem" não aparece lá.

## Qualidade

- Testes unitários do modal (controles, prop de reajuste) e do fluxo de reajuste (confirmar, cancelar, falhar).
- Teste e2e cobrindo o reajuste, com verificação axe WCAG AA do modal.
- Cada recompressão perde um pouco de qualidade, e aproximar reduz os pixels disponíveis. Isso é aceito neste projeto.

## Deixado para quem construir

- Implementar o zoom à mão ou com uma biblioteca pequena. Dependência nova precisa de justificativa, e `react-easy-crop` já carrega só sob demanda como referência.
- Zoom máximo, que pode seguir os 5x do recorte.
- Aparência dos controles, dentro do tema atual.

## Entrega

Branch própria, commits por assunto e PR com descrição em português e inglês. O merge é feito pela dona do projeto.
