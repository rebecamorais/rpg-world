# Mochila com cara de RPG: cor, imagens e duas visualizações

Legenda: **(dona)** foi decidido por ela. **(decisão do builder)** é escolha técnica ou de detalhe que não muda o que ela pediu.

Mockups da conversa: `.superpowers/brainstorm/*/content/mochila-direcoes.html` (opções B e C).

## Por quê

A mochila hoje é uma lista cinza: nome, − / +, peso e preço. Funciona, mas é sem graça e pouco amigável. Falta cor, não há nada visual que diferencie uma arma de uma pena de escrita, o botão "Remover X" escondido nos detalhes é um passo a mais, e o aviso de "em inglês" é uma linha cinza solta que pesa no meio do texto.

Sucesso é a mochila parecer um inventário de RPG: dá para bater o olho e achar as coisas pela cor e pelo ícone, mudar quantidade e remover sem abrir nada, e ler a descrição sem o aviso de tradução competir com ela.

## Decisões

1. **(dona)** Duas visualizações, com um botão no cabeçalho da mochila para alternar:
   - **Lista agrupada** (opção B do mockup): itens separados em grupos por tipo, cada grupo com sua cor, título e peso total do grupo. Cada linha: ícone, nome, controle de quantidade, preço. Clicar no nome abre os detalhes abaixo da linha, como hoje.
   - **Grade** (opção C): cada item é um quadrado com a imagem, borda na cor do grupo, quantidade no canto (só quando maior que 1) e o nome embaixo. Clicar seleciona o item e abre os detalhes num painel abaixo da grade, com o controle de quantidade e a descrição. Um quadrado tracejado "+" no fim abre o diálogo de adicionar item.
2. **(dona)** Mais cor: cada grupo tem uma cor própria, usada no ícone, no título do grupo e na borda do quadrado.
3. **(dona)** Remover pelo "−": quando a quantidade é 1, o botão "−" vira uma lixeira (mesma posição, cor de perigo) e remove o item. O botão "Remover X" dos detalhes sai. O toast com "Desfazer" que já existe continua.
   - **(decisão do builder)** O item que saiu do catálogo (`item: null`) segue a mesma regra: o "−" em 1 vira lixeira, e a lixeira separada de hoje sai. Na lista ele aparece em "Outros", com um ícone genérico de "desconhecido" e o texto `unknownHint`. Na grade é um quadrado com esse mesmo ícone, e selecionar abre o painel só com nome, `unknownHint` e controle de quantidade.
4. **(dona)** Aviso de tradução vira um cartão de informação discreto: fundo levemente tingido, borda sutil, ícone de info, texto "Descrição em inglês por enquanto" e o link para ajudar no Crowdin. Fica acima da descrição, chamando menos atenção que ela. Vale para os detalhes do item (`ItemDetails`), inclusive quando ele aparece no popover de item dentro de textos de regra (`ItemHint`, com `nested`). **(decisão do builder)**: é o mesmo componente e o mesmo aviso, então muda junto, e o cartão pode ficar mais compacto no modo `nested`. Se o mesmo padrão de aviso aparecer em outro lugar (magias), usar o mesmo componente, mas trocar lá fica fora deste escopo.
5. **(dona)** Imagem do item, por ordem de prioridade:
   1. **Imagem enviada pela jogadora** — só o espaço fica pronto agora (ver decisão 6).
   2. **Arte nossa daquele item** — SVG no repositório (código vetorial gerado pelo Claude Code, aprovado pela dona, como no Grimoire), ligado à chave do item.
   3. **Ícone do Game Icons** — um por item quando houver um bom (`spell-book`, `spyglass`, `quill`…), senão o ícone da categoria.
6. **(dona)** Envio de imagem pela jogadora **não** entra agora. Chega junto com o homebrew da [#91](https://github.com/rebecamorais/rpg-world/issues/91). Agora só a estrutura que aceita uma imagem vinda de fora: o componente de imagem do item recebe uma URL opcional que, quando existe, vence o resto. Nada de coluna no banco, upload ou storage nesta entrega.
7. **(dona)** Peso: fica como hoje, só o peso total no rodapé (e agora também o peso por grupo na lista). Sem barra de carga, sem limite por Força, sem impacto nas regras.
8. **(dona)** O Game Icons é o padrão. Ele já está no projeto (`@iconify-json/game-icons`, sprite gerado por `npm run icons`). A licença é CC BY 3.0 e exige atribuição, que hoje falta no `NOTICE.md`: esta entrega adiciona o crédito.
9. **(decisão do builder)** Visualização inicial: lista agrupada. A escolha fica lembrada no navegador (`localStorage`), sem salvar na conta: uma chave para as mochilas de personagem e outra para o baú da mesa, já que no baú a escolha pode ser diferente. Leitura protegida com try/catch; sem o storage, abre na lista.
10. **(decisão do builder)** Grupos (juntam as 14 categorias de `item.schema` para não sobrar grupo de um item só), nesta ordem:

    | Grupo               | Categorias                                           |
    | ------------------- | ---------------------------------------------------- |
    | Armas               | `weapon`, `ammunition`                               |
    | Armaduras e escudos | `armor`, `shield`                                    |
    | Magia               | `focus`                                              |
    | Ferramentas e kits  | `tool`, `kit`, `instrument`                          |
    | Equipamento         | `gear`, `food`, `trade-good`                         |
    | Outros              | `mount`, `vehicle`, `other`, e item fora do catálogo |

    Grupo vazio não aparece. Dentro do grupo, a ordem é a de hoje (ordem em que foram adicionados). A grade usa a mesma ordem de grupos, sem títulos.
    Observação: o Grimório é `gear` no SRD, então cai em Equipamento, não em Magia. Aceitável; não criar exceções por item.

11. **(decisão do builder)** Cores dos grupos: tokens novos no tema (claro e escuro), com contraste AA garantido do ícone sobre o fundo tingido, seguindo a "fantasia sóbria" (tons dessaturados, como no mockup). Nada de cor fixa nos componentes.
12. **(decisão do builder)** Ícone por item: um mapa `id do item → nome do Game Icon` no front, cobrindo os itens do SRD 5.1 e 5.2 que tenham um ícone que faça sentido. O que não estiver no mapa usa o ícone da categoria (um mapa `categoria → Game Icon`). O mapa é por `id` (sem a fonte), então o mesmo item nas duas edições usa o mesmo ícone. Cobertura total não é exigida; os ícones mais comuns (armas, armaduras, foco, kits, grimório, corda, tocha, rações) são.
13. **(decisão do builder)** Arte própria por item: pasta de SVGs por `id` do item, com o mesmo contrato do Grimoire (sem cor fixa, a cor vem do token via `mask-image` ou `currentColor`). Começa vazia: o código só precisa procurar ali primeiro. Gerar as artes fica para depois, em lotes, quando ela pedir.
14. **(decisão do builder)** Os mesmos componentes servem a mochila do personagem, o baú da mesa (`PartyChestPage` via `ItemList`) e a ficha só de leitura do mestre (`SheetFieldset` desabilitado). No modo só leitura, as duas visualizações funcionam, os botões de quantidade ficam desabilitados como hoje, e o mestre continua conseguindo abrir os detalhes (atenção ao comentário em `ItemRow`: o gatilho dos detalhes não pode ser um `<button>` dentro do fieldset desabilitado; o mesmo vale para o quadrado da grade).
15. **(decisão do builder)** A grade tem número de colunas responsivo (cerca de 4 no celular, mais no desktop). No celular, a lista agrupada esconde o peso de cada linha se faltar espaço; peso por grupo e total continuam.

## Fora do escopo

- Upload de imagem pela jogadora, itens homebrew, coluna de imagem no banco (#91).
- Barra de carga e regras de carga.
- Arrastar itens, ordenar manualmente, contêineres dentro da mochila.
- Mudar o diálogo de adicionar item (pode ganhar os ícones depois, mas não agora).
- Trocar o aviso de tradução nas magias (o popover de item dentro do texto da magia muda, porque é o `ItemDetails`; o aviso do card da magia em si, não).

## Anti-objetivos

- Ficar carnavalesco: cor demais, brilho, animação em loop. A cor marca o grupo, não pinta a linha inteira.
- Perder acessibilidade: a lixeira precisa de `aria-label` próprio ("Remover X"), o quadrado da grade precisa ser alcançável e operável pelo teclado e anunciar nome e quantidade, e o botão de alternar visualização precisa dizer qual está ativa.
- Esconder o desfazer: remover pelo "−" sem o toast seria pior que hoje.

## Restrições

- Textos novos em `messages/pt.json` e `messages/en.json` (`es`/`sv` pelo Crowdin). O guard `hardcoded-text.unit.test.ts` falha com texto fixo na UI.
- Ícones Game Icons novos pedem `npm run icons`.
- Testes existentes (`Backpack.unit.test.tsx`, `ItemDetails.unit.test.tsx`, e2e do inventário) precisam ser atualizados para o novo fluxo de remover. O e2e instável da [#192](https://github.com/rebecamorais/rpg-world/issues/192) não é responsabilidade desta entrega, mas não pode piorar.
- Funciona nos temas claro e escuro.

## O que fica com o builder

- Nome e formato dos componentes (`ItemImage`, `ItemGrid`, `GroupedItemList` ou o que fizer sentido), como dividir `ItemRow`.
- Quais Game Icons para cada item e categoria.
- Os valores exatos das cores dos grupos, respeitando a decisão 11.
- O texto final das mensagens novas.
