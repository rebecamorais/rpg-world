# Plano de review de UX/UI por tela

Plano de 2026-11-15. Cobre as 31 telas únicas e os 20 modais do app. Continua a [revisão de telas](README.md): os achados já anotados nela entram aqui como ponto de partida, e o review de cada tela confirma, completa e fecha esses achados.

## Como cada review acontece

Cada tela ou modal é revista numa sessão própria, nesta ordem:

1. **Tarefa.** Escrever em uma frase o que a pessoa vai fazer ali, e fazer essa tarefa do começo ao fim no app rodando.
2. **Matriz de estados.** Passar pela tela em cada combinação que se aplica a ela:

   | Eixo    | Valores                                                                       |
   | ------- | ----------------------------------------------------------------------------- |
   | Tema    | escuro e claro                                                                |
   | Largura | 390px, 768px e 1280px                                                         |
   | Papel   | visitante, jogador, mestre e demo (só os que abrem a tela)                    |
   | Dados   | carregando, vazio, com poucos dados, com muitos dados e textos longos, e erro |
   | Idioma  | pt e en (en é o mais longo nos botões); es e sv só para ver se nada quebra    |

3. **Checklist comum** (abaixo), item por item.
4. **Pontos da tela:** as perguntas específicas da tabela de cada tela.
5. **Registro.** Cada achado vai para o documento da área (`telas-*.md`) com severidade, `arquivo:linha` e uma proposta, no formato que já existe. Os prints de antes ficam no PR.
6. **Fechamento.** A tela está revista quando todas as linhas da matriz foram vistas e cada achado tem um destino: corrigido, issue no Project 1 ou descartado com o motivo.

Uma tela por PR quando houver correção. Telas pequenas da mesma área podem ir juntas.

### Checklist comum

| Grupo          | O que conferir                                                                                                                                                    |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hierarquia     | Um H1 só. Dá para dizer em 3 segundos onde se está e qual é a ação principal. Uma ação primária por área.                                                         |
| Alinhamento    | Margens e espaçamentos da escala (`gap-2/4/6`). Cards da mesma linha com a mesma altura. Ícone e texto alinhados na linha de base. Nada colado na borda em 390px. |
| Cores          | Só tokens. Contraste AA nos dois temas. Camadas (fundo, card, campo) se distinguem no tema claro. Vermelho só para destruir, nunca para enfeitar.                 |
| Tipografia     | `text-label` só em rótulos curtos, nunca em frases nem em botões. Cinzel nos nomes próprios (personagem, mesa). Números formatados no idioma.                     |
| Componentes    | Usa os primitivos (`Button`, `SectionCard`, `EmptyState`, `Field`) em vez de classes à mão. O mesmo controle tem o mesmo estilo em todo lugar.                    |
| Estados        | Carregando com skeleton do mesmo tamanho do conteúdo. Vazio com explicação e ação. Erro que diz o que fazer. Sucesso com retorno (toast ou mudança visível).      |
| Ações          | Destrutivas seguem a [regra](acoes-destrutivas.md). Botão em loading enquanto salva. Nada salva sem a pessoa saber se salvou ou não.                              |
| Acessibilidade | Tudo funciona no teclado, com foco visível e na ordem da leitura. Alvos de toque com 44px. Ícone sozinho tem `aria-label`. Erro de campo ligado ao campo.         |
| Texto          | Sem inglês na interface em pt, sem "party" no lugar de "mesa". Frases em caixa normal, sem Title Case. Nenhum texto fixo no código.                               |
| Responsivo     | Sem rolagem horizontal. Nada fixo cobre o conteúdo. Nomes longos truncam com `title` ou quebram, sem empurrar os botões.                                          |

## Ordem sugerida

A ordem vem do uso: primeiro o que se usa durante a sessão de jogo, depois o que se usa toda semana e por último o que se usa uma vez.

| Fase | Telas                                                                           | Por quê                                                                      |
| ---- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 1    | Ficha (Status, Grimório, Inventário), aba Combate, modais da ficha e do combate | Usadas no meio da sessão, no celular, com pressa. Erro aqui custa a partida. |
| 2    | Aba Mesa, Baú, Diário, ficha vista pela mesa, lista de personagens e de mesas   | Toda semana, antes e depois da sessão.                                       |
| 3    | Configurações da mesa, perfil, novo personagem, convite, Lore e Aparência       | De vez em quando.                                                            |
| 4    | Landing, features, login, cadastro, senha, username, `/auth/*`, legais, demo    | Uma vez por pessoa, mas é a primeira impressão.                              |
| 5    | Telas que faltam: 404 e erro inesperado                                         | Hoje caem nas telas padrão do Next.                                          |

## Telas

Coluna **Achados**: os números dos documentos de área que ainda estão abertos. Os que o #227 já resolveu estão riscados.

### Ficha do personagem

A mesma ficha aparece em três lugares: a ficha própria (`/system/[sistema]/character/[id]/…`, editável), a ficha vista pela mesa (`/parties/[mesa]/characters/[id]/…`) e a demo (`/demo/characters/[id]/…`). Rever cada aba primeiro na ficha própria e depois só o que muda nos outros dois lugares.

| Tela            | Fase | Tarefa                                                         | Pontos da tela                                                                                                                                                                                                                                                         | Achados                                    |
| --------------- | ---- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| Status          | 1    | Levar dano, gastar um espaço de magia e descansar, no celular. | Os números de combate têm nome visível? Os alvos de toque dos espaços de magia e dos testes contra a morte têm 44px? A `VitalsBar` fixa cobre algo? A barra de salvar fica clara para quem não sabe que precisa salvar? Classes sem magia veem um card de magia vazio? | [ficha](telas-personagens-e-ficha.md) 1–11 |
| Grimório        | 1    | Achar uma magia, aprender, preparar e esquecer.                | O cabeçalho cabe em 390px? Dá para ver de longe quais estão preparadas? Com 40 magias, a lista ainda se navega (filtro, nível, busca)? O vazio explica por onde começar?                                                                                               | ficha 19, ~~20~~, 21                       |
| Inventário      | 1    | Adicionar um item, mudar a quantidade, pagar com moedas.       | Nomes longos em 390px. Separar remover de diminuir. Peso e moedas aparecem sem abrir nada? Os três steppers viram um?                                                                                                                                                  | ficha 15–18                                |
| Lore            | 3    | Escrever a história e salvar.                                  | Um estilo de campo só. Texto longo: o campo cresce ou rola? As duas barras de salvar (lore e ficha) ao mesmo tempo.                                                                                                                                                    | ficha 22–23                                |
| Aparência       | 3    | Trocar a foto e a cor do personagem.                           | Ainda não revista. Recorte da imagem, a cor escolhida aparece onde? Contraste da cor do personagem nos dois temas.                                                                                                                                                     | nenhum                                     |
| Modo só leitura | 2    | Mestre e demo olhando a ficha de outra pessoa.                 | Nenhum controle que parece editável e não faz nada. "Voltar para a mesa" igual em todo lugar. Header da demo sobre a `VitalsBar` em 390px.                                                                                                                             | ficha 12–14, [mesas](telas-mesas.md) 32–33 |

### Mesas

| Tela                  | Fase | Tarefa                                                       | Pontos da tela                                                                                                                                                            | Achados                |
| --------------------- | ---- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| Combate (mestre)      | 1    | Montar o combate, passar turnos, aplicar condição, encerrar. | O turno atual se vê de longe? A ordem de iniciativa é clara ao editar? Adicionar a mesa toda de uma vez dá retorno de erro por personagem? "Reconectando…" chama atenção? | mesas 13–17            |
| Combate (jogador)     | 1    | Acompanhar a rodada e agir no próprio turno.                 | O jogador sabe quando é a vez dele, inclusive em outra aba? O que ele pode mudar e o que só o mestre muda fica claro?                                                     | mesas 10, 15           |
| Aba Mesa              | 2    | Ver quem está na mesa e abrir uma ficha.                     | Cards com a mesma altura. Retorno ao aprovar ou recusar pedido. "Sair da mesa" achável. Selo de combate nas abas do celular.                                              | mesas 6–12             |
| Baú                   | 2    | Guardar e tirar itens e moedas da mesa.                      | "Party" no texto. O jogador entende que o baú é de todos? Mesmos pontos do Inventário da ficha.                                                                           | mesas 20–21            |
| Diário                | 2    | Ler o diário da campanha.                                    | O vazio leva direto ao card do diário nas configurações. O documento embutido cabe em 390px?                                                                              | mesas 18–19            |
| Configurações da mesa | 3    | Convidar, renomear, trocar a imagem, apagar a mesa.          | Dicas em caixa alta. `aria-label` com o nome do jogador em "Tirar". Copiar o link sem retorno de erro. Salvar o nome e a edição do mesmo jeito. Um nome só para a tela.   | mesas ~~22–24~~, 25–31 |
| Lista de mesas        | 2    | Criar uma mesa ou aceitar um convite.                        | Dois títulos para o mesmo campo. Skeleton no lugar do loading de tela cheia. Convites e pedidos pendentes aparecem antes das mesas?                                       | mesas 1–3              |
| Entrar por convite    | 3    | Abrir o link de convite e pedir para entrar.                 | Nome da mesa em Cinzel. Cancelar o pedido dali. Link vencido e mesa cheia explicam o que fazer?                                                                           | mesas 4–5              |

### Personagens e perfil

| Tela             | Fase | Tarefa                                 | Pontos da tela                                                                                                                                        | Achados                                               |
| ---------------- | ---- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Meus personagens | 2    | Achar um personagem e abrir a ficha.   | CTA de novo personagem no cabeçalho, como nos NPCs. Nome truncado encostando no selo. Skeleton sem avatar. Com 20 personagens ainda dá para achar um? | ficha 24–27, ~~28~~                                   |
| NPCs             | 2    | Criar e organizar NPCs para o combate. | Abas "Meus personagens / Meus NPCs" com o mesmo estilo das abas da mesa. NPC morto se distingue?                                                      | mesas 34                                              |
| Novo personagem  | 3    | Criar um personagem e cair na ficha.   | Altura igual entre input e select. Select de sistema com uma opção só. O que acontece depois de criar fica claro?                                     | ficha 29–31                                           |
| Perfil           | 3    | Trocar o nome, a foto e a senha.       | A cor do tema não faz nada. Swatch selecionado. Onde trocar a senha e ver o e-mail. "Meu perfil" e "Configurações" para a mesma tela.                 | [públicas](telas-publicas-e-conta.md) 1–5, ~~6~~, 7–8 |

### Conta e autenticação

| Tela                           | Fase | Tarefa                                   | Pontos da tela                                                                                      | Achados            |
| ------------------------------ | ---- | ---------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------ |
| Login                          | 4    | Entrar com link mágico, senha ou Google. | Saída depois de enviar o link mágico. Seletor de modo com 44px. "Esqueceu a senha?" com foco.       | públicas 12–16     |
| Cadastro                       | 4    | Criar conta.                             | Regra da senha antes de enviar. Google também aqui. O sucesso mostra o e-mail e diz para abrir.     | públicas 18–19, 23 |
| Esqueci a senha                | 4    | Pedir o link de nova senha.              | Mensagem de erro que não é o label. Retorno de envio igual para e-mail que existe e que não existe. | públicas 17        |
| Nova senha                     | 4    | Definir a senha pelo link.               | Link vencido. Depois de salvar, vai para onde?                                                      | nenhum             |
| Trocar senha                   | 3    | Trocar a senha já logada.                | Dois "Voltar". O form limpa e sai depois de salvar. O aviso de senha temporária só quando for.      | públicas 20–22     |
| Escolher username              | 4    | Escolher o username no primeiro acesso.  | Usar `Form/FormField`. Disponibilidade enquanto digita. Regras do username visíveis antes do erro.  | públicas 24        |
| `/auth/confirm`, `/auth/error` | 4    | Voltar do link do e-mail.                | Link vencido oferece pedir outro ali mesmo. Spinner com texto para leitor de tela. Margens iguais.  | públicas 25–27     |
| Confirmar exclusão da conta    | 3    | Confirmar pelo link do e-mail.           | Saída "Manter minha conta". Link inválido sem sessão explica por que vai para o login.              | públicas 9–11      |

### Públicas e demo

| Tela                    | Fase | Tarefa                            | Pontos da tela                                                                                                   | Achados        |
| ----------------------- | ---- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------- | -------------- |
| Landing                 | 4    | Entender o que é o app e começar. | CTAs em 390px. "Começar a jogar" leva ao cadastro, não ao login. Prévia da ficha com labels cortados.            | públicas 28–31 |
| Features                | 4    | Ver o que o app faz.              | Buraco no grid de 11 itens. CTA igual ao da landing.                                                             | públicas 31–32 |
| Suporte                 | 4    | Achar ajuda ou mandar feedback.   | Ainda não revista. Discord e formulário no mesmo lugar? O que esperar depois de enviar?                          | nenhum         |
| Privacidade, Termos     | 4    | Ler.                              | Texto em `muted` inteiro. Parágrafos longos. Índice para pular para a seção.                                     | públicas 40    |
| Demo                    | 4    | Experimentar sem conta.           | Quando o convite para criar conta aparece, e se ele irrita. Navegação duplicada no celular. Header fixo grande.  | ficha 13–14    |
| Header, sidebar, footer | 2    | Navegar entre as áreas.           | "Voltar" fixo para `/characters`. Idiomas no próprio idioma. Ícones do header do mesmo tamanho. Links no footer. | públicas 33–39 |

### Telas que faltam

| Tela            | Fase | O que fazer                                                                                                                    |
| --------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------ |
| 404             | 5    | Criar `not-found.tsx` com o visual do app, explicando que a página não existe e com um link para a área certa (logado ou não). |
| Erro inesperado | 5    | Criar `error.tsx` com "tentar de novo" e o link de suporte, sem mostrar detalhes técnicos.                                     |

## Modais

Nenhum modal foi revisto um por um na primeira revisão. Além do checklist comum, todo modal confere:

- **Abrir e fechar:** título que diz o que é, `Esc` e o X fecham, o foco volta para o botão que abriu.
- **Foco inicial:** no primeiro campo; em confirmação destrutiva, em Cancelar.
- **Celular:** cabe em 390px com o teclado aberto, o botão principal continua visível, e rola por dentro sem rolar a página.
- **Rascunho:** fechar sem querer perde o que foi digitado? Se perde muito, perguntar antes.
- **Ação principal:** o botão diz o verbo ("Adicionar", "Pagar"), fica em loading enquanto salva, e o modal fecha com retorno.

| Modal                                                 | Onde abre               | Fase | Pontos do modal                                                                                                                |
| ----------------------------------------------------- | ----------------------- | ---- | ------------------------------------------------------------------------------------------------------------------------------ |
| Ajustar PV (`AdjustHitPoints`)                        | Ficha, Status           | 1    | Um toque para abrir e um para aplicar. Teclado numérico no celular. Dano em PV temporário fica claro. Desfazer o valor errado. |
| Condições (`ConditionsPicker`)                        | Combate                 | 1    | Achar uma condição sem rolar tudo. Exaustão com nível. Abas por edição só quando importam.                                     |
| Ver a ficha (`SheetPreview`)                          | Aba Mesa e Combate      | 1    | Painel lateral no desktop e de baixo no celular. Mesmos pontos do modo só leitura. Fechar volta ao mesmo lugar da mesa.        |
| Buscar magia (`SpellSearchDialog`)                    | Grimório                | 1    | Busca com resultado enquanto digita. Filtro por nível e classe. Estado de "aprendida" sem depender de hover.                   |
| Adicionar item (`AddItemDialog`)                      | Inventário e Baú        | 1    | Busca, item próprio que não está no SRD, quantidade antes de adicionar.                                                        |
| Moedas (`CoinPouch`)                                  | Inventário e Baú        | 1    | Pagar com troco explicado. Valor maior que o que se tem. Resultado antes de confirmar.                                         |
| Editar atributo (`AttributeCard`)                     | Ficha, Status           | 1    | Mostra o modificador enquanto edita. Limites do valor.                                                                         |
| Editar todos os atributos (`AttributesSection`)       | Ficha, Status           | 3    | Seis campos em 390px. Ordem do teclado. Diferença para o editar de um.                                                         |
| Configurar card (`CombatStatsDialog`)                 | Ficha, Status           | 3    | A pessoa entende que precisa salvar a ficha depois. Nomes das opções.                                                          |
| Minha participação (`MyPartyMenu`)                    | Aba Mesa (jogador)      | 2    | O nome do botão diz que é ali que se sai da mesa. Sair separado de escolher personagens.                                       |
| Confirmação (`ConfirmDialog`)                         | Ações destrutivas       | 2    | Já segue a regra. Conferir textos de cada uso: dizem o que se perde?                                                           |
| Excluir personagem (`DeleteCharacterDialog`)          | Lista de personagens    | 2    | Já é bom. Conferir em 390px e com nome longo.                                                                                  |
| Pedir exclusão da conta (`RequestDeletionDialog`)     | Perfil                  | 3    | Senha e link: as duas etapas ficam claras? Sem senha (Google) o caminho funciona?                                              |
| Recortar imagem (`ImageCropDialog`)                   | Perfil, Aparência, mesa | 3    | Arrastar e zoom no toque. Prévia do resultado. Imagem grande demais.                                                           |
| Ver imagem (`ImageViewerDialog`)                      | 8 lugares               | 3    | Pinça no celular. Fechar tocando fora. Texto alternativo.                                                                      |
| Feedback (`HeaderSupportLink`)                        | Header                  | 3    | Formulário embutido carrega? Retorno depois de enviar. Funciona sem login?                                                     |
| Convite da demo (`DemoInvite`)                        | Demo                    | 4    | Aparece só quando tenta mudar algo, e não toda vez. Fechar continua a demo.                                                    |
| Menu no celular (`Sidebar`)                           | Header no celular       | 2    | Item atual marcado. Fecha ao navegar. "Sair" neutro.                                                                           |
| Balões (`ResourcesCard`, `ConditionHint`, `ItemHint`) | Ficha e combate         | 1    | Abrem no toque e não só no hover. Fecham ao tocar fora. Não cobrem o que a pessoa está editando.                               |

## Acompanhamento

O status de cada tela fica no [GitHub Project 1](https://github.com/users/rebecamorais/projects/1), um item por fase, e não neste documento. Este plano só muda quando uma tela ou modal novo entrar no app.
