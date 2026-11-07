# Aparência da ficha

Projeto 2 do [registro de decisões](2026-11-06-personalizacao-e-combate-decisoes.md), que continua valendo. Este documento só acrescenta o que foi decidido depois dele.

## Intenção

Quem abre a página precisa entender que ali só muda o visual da ficha. A cor é o destaque, com as cores do sistema primeiro e a opção de qualquer cor.

## Decisões da dona

- A engrenagem abre a página "Aparência da ficha".
- Layout B: controles de um lado, prévia do outro, sempre à vista no computador.
- "Qualquer cor" tem linha própria, com o código da cor.

## Decisões do autor

A dona pediu para começar sem revisar estes pontos:

- **Celular:** a prévia vai para o topo, fixa e mais curta.
- **Salvar:** tudo vai para o rascunho da ficha e só grava com Salvar, como os outros campos.
- **Código da cor:** pode ser digitado ou colado, com ou sem `#`. Um código inválido avisa e mantém a cor atual.
- **Rota:** `/system/<sistema>/character/<id>/appearance`. Ela só existe na rota do dono, então quem só lê a ficha não chega nela.
- **Armazenamento do fundo:** coluna `sheet_background_url`, porque `background` já é o antecedente de D&D. Os arquivos ficam em `<dono>/characters/<id>-background-<versão>.<ext>`. Ao contrário do avatar, não há imagem completa nem recorte.
- **Duplicar personagem:** o fundo não é copiado, porque o arquivo pertence a um único personagem.
- **Contraste do fundo:** véu de 85% da cor de fundo sobre a arte. É o que mantém o texto secundário perto do AA com uma imagem branca. A arte fica discreta, e esse valor é o ajuste a fazer se ela pedir mais destaque.
- **Fundo em páginas longas:** a arte ocupa uma tela e acompanha a rolagem, em vez de esticar com a página.

## Fora deste projeto

- **Molduras oficiais em PNG e o molde para produzi-las:** dependem das artes da dona. A moldura padrão já está pronta, e nenhuma tela de escolha foi criada antes de existirem opções.
- **Restringir o endereço do fundo ao armazenamento do app:** o fundo aceita qualquer URL http(s), como o avatar. O achado L3 do relatório de segurança trata do mesmo risco, e a correção deve valer para os dois.
