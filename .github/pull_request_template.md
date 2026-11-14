## O que muda / What changes

<!-- Uma ou duas frases: o que o PR faz e por quê. Se fecha uma issue, escreva "Closes #123". -->
<!-- One or two sentences: what the PR does and why. If it closes an issue, write "Closes #123". -->

## Como testar / How to test

<!-- Passo a passo para quem for revisar reproduzir localmente. / Steps for the reviewer to reproduce locally. -->

1.
2.

## Testado / Tested

- [ ] Caminho feliz funciona do começo ao fim / Happy path works end to end
- [ ] Erros (campo vazio, valor inválido, sem permissão) mostram uma mensagem clara / Errors (empty field, invalid value, no permission) show a clear message
- [ ] Casos de borda (lista vazia, texto longo, clique duplo) / Edge cases (empty list, long text, double click)
- [ ] Celular ou modo responsivo / Mobile or responsive mode
- [ ] Nenhum erro no console do navegador / No errors in the browser console

## Vídeo ou prints / Video or screenshots

<!-- Arraste aqui uma gravação de tela do caminho feliz e de um erro. Antes/depois ajuda em mudança visual. -->
<!-- Drag a screen recording of the happy path and of an error here. Before/after helps for visual changes. -->

## Checklist

- [ ] `npm run test` passa localmente / passes locally
- [ ] Textos novos passam pelo `next-intl` (pt e en) / New strings go through `next-intl` (pt and en)
- [ ] Inclui migration (vai para produção sozinha no merge) / Includes a migration (ships to production on merge)
