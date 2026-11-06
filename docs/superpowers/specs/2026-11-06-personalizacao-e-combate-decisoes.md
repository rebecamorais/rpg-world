# Personalização e combate: decisões já tomadas

Registro da conversa de 2026-11-06. Cada projeto ainda vai ganhar um documento de design e um plano próprios, depois do projeto de [imagem](2026-11-06-imagem-zoom-e-reajuste-design.md).

Legenda: **(dona)** foi decidido por ela. **(suposição aprovada)** foi proposto e aprovado na revisão geral.

## Projeto 2: personalização

### Tela de configurações da ficha

- **(dona)** Sai o modal "Personalizar Personagem". Cor, imagem, background, moldura e o que vier depois ficam em uma página própria da ficha, como Inventário e Grimório.
- **(dona)** Essa página não aparece no menu da ficha. Ela abre só pelo ícone de engrenagem.
- Quem só lê a ficha, como o mestre vendo a de um jogador, não vê a engrenagem. O mestre vê nos próprios NPCs.

### Cor

- **(dona)** Seletor de cor livre ao lado das cores prontas, na tela de personalização do personagem.
- A ficha já aceita qualquer hex (`safeAccentColor`). Hoje a tela só oferece `ACCENT_COLORS`.

### Background da ficha

- **(dona)** A imagem é enviada pelo jogador e fica só na ficha de quem enviou. Conteúdo compartilhado publicamente fica para depois.
- **(dona)** Opção B: a arte ocupa a página inteira e os painéis continuam sólidos, o que garante o contraste com qualquer imagem.
- **(suposição aprovada)** Vale em todas as abas da ficha e pode ser removido. NPCs também têm. O mestre vê ao abrir a ficha de um jogador.

### Formato do avatar

- **(dona)** Sempre quadrado com cantos arredondados, em todos os lugares, inclusive no combate.
- Hoje o cabeçalho da ficha é redondo e a linha de combate é um retângulo esticado. Os dois mudam. A imagem salva já é quadrada, então nenhuma imagem antiga precisa ser refeita.
- O recorte (`ImageCropDialog`) passa a mostrar o novo formato.

### Molduras

- **(dona)** A moldura padrão é a cor do personagem com brilho suave.
- **(dona)** As molduras oficiais são PNGs vazados e quadrados, feitos pelo time. Ficam por cima da imagem, cobrindo um pouco as bordas, com o meio vazado.
- **(suposição aprovada)** Os PNGs entram no código do projeto, sem tela de administração. Quem vê o avatar também vê a moldura escolhida.
- A dona vai fornecer os PNGs. O projeto precisa entregar um molde com tamanho do arquivo e do furo central. Cada arte deve ser testada em 48px, o menor tamanho em uso.

## Projeto 3: combate

### Identificação

- **(dona)** Todos, mestre e jogadores, veem o tipo de cada participante: jogador, aliado ou inimigo.
- **(suposição aprovada)** Cada tipo tem ícone, texto e cor, para não depender só da cor.
- Os dados já têm `Side` (`player`, `ally`, `enemy`). Hoje a etiqueta de NPC some no turno dele, trocada por "turno atual", e isso precisa mudar.

### O que o jogador vê

- **(dona)** A lista de iniciativa, para saber quando é a vez de cada um.
- **(dona)** As pessoas da party sempre aparecem, na ordem.
- **(dona)** De um NPC visível, o jogador vê só nome e imagem, além do tipo. Nunca abre a ficha nem vê PV, CA ou atributos.
- **(suposição aprovada)** Pode ampliar a imagem de quem está visível. NPC anônimo ou oculto não tem zoom.

### O que o mestre controla

- **(suposição aprovada)** Três estados para cada NPC, aliado ou inimigo:
  - **Visível:** nome, imagem e tipo.
  - **Anônimo:** aparece como "Inimigo desconhecido", sem nome nem imagem. Corresponde à "ficha escondida" que a dona pediu.
  - **Oculto:** não aparece para os jogadores. Serve para a surpresa.
- **(dona)** Controle por ícones, com o texto da ação ("Ocultar", "Anonimizar") ao passar o mouse. O texto também precisa aparecer em toque e foco, e existir para leitor de tela.
- **(dona)** NPCs novos sempre entram como ocultos.
- **(suposição aprovada)** O mestre muda o estado a qualquer momento. Combates já em andamento mantêm os NPCs visíveis.
- **(dona)** No turno de um NPC oculto, a lista fica sem destaque e aparece a mensagem "O mestre está conduzindo o turno".

### Exigência de segurança

Esconder precisa ser feito no servidor. Dados de NPC oculto ou anônimo nunca podem chegar ao navegador do jogador, inclusive no tempo real. Hoje `encounter_turns` já não envia PV, CA nem iniciativa, e passaria a respeitar a visibilidade.

## Depois

Modo claro e revisão completa de WCAG ficam em uma issue própria. Até lá, tudo que for novo nasce em AA.
