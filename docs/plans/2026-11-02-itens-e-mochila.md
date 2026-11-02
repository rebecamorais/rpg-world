# Itens comuns e mochila

**Data:** 2026-11-02
**Status:** design aprovado; implementação a seguir.
**Issue:** #105, parte 2 (itens). A parte 1 (condições) saiu no #134.
**Planos relacionados:** `2026-10-15-5etools-e-traducoes.md` (passo 5),
`2026-10-15-conteudo-e-homebrew.md`, `2026-11-01-condicoes-e-tags.md`.

## Por quê

O jogador quer anotar na ficha o que o personagem carrega. Hoje a aba Inventário tem só a algibeira
(entregue nesta mesma branch, com as moedas no `system_data` e salvando pela barra de salvar) e um
"Adicionar item" desativado.

Os itens vêm do SRD, como as magias e as condições: em arquivo, com o texto em inglês do 5etools e o
português pelo Crowdin. O jogador escolhe da lista; ele não cria nem edita item nesta parte.

## Objetivos

1. **Itens comuns do SRD em arquivo** (5.1 e 5.2): armas, armaduras, equipamento de aventura,
   ferramentas, kits, montarias e veículos, comida e serviços que forem item. Com o mesmo formato,
   esquema zod e catálogo em memória das condições.
2. **Inventário em tabela**: algibeira, mochila e baú como lugares do personagem; a algibeira passa
   a guardar as moedas ali.
3. **Mochila na aba Inventário**, logo abaixo da algibeira: todo personagem tem uma, que começa
   vazia. O jogador adiciona itens da lista, muda a quantidade e remove.
4. **Tag `{@item …}`** nos textos de regra (magias, condições, os próprios itens) vira um botão com
   popover quando aponta para um item comum do mesmo livro, como já acontece com
   `{@condition …}`.

## Fora do escopo

- **Itens mágicos** (decisão da Rebeca). O importador pula tudo que tem raridade diferente de
  `none`; uma tag `{@item}` que aponta para item mágico continua texto normal.
- **Item próprio, criar ou editar item** (decisão da Rebeca). Isso é o homebrew, numa parte
  seguinte: o item fica guardado com o jogador e guarda de onde veio (`based_on`, ver
  `2026-10-15-conteudo-e-homebrew.md`). O item padrão nunca muda.
- Equipamento inicial de antecedente ou classe, pacotes que abrem em vários itens (o "Kit de
  Estudioso" entra como um item só).
- Na tela: mais de uma mochila, criar baú, mover entre lugares, "equipado", sintonia (as tabelas
  já preveem, ver "Inventário no banco").
- Comprar com o dinheiro da algibeira, trocas e mercado (plano futuro, decisão da Rebeca).
- Carga e capacidade de carregar, efeito mecânico (CA da armadura na ficha, ataque da arma).
- Compartilhar, importar e exportar itens.

## O que não pode acontecer

- Item padrão editável, por qualquer caminho.
- `{@item …}` cru em qualquer tela, metadado ou texto para leitor de tela.
- Rodar o importador de novo sobrescrever tradução pt revisada.
- Um item da mochila sumir porque a chave mudou: a chave de um item publicado não muda.
- Um personagem ficar sem algibeira ou sem mochila.

## Decisões

### Itens em arquivo

- `content/dnd5e/srd-5.1/items.json` e `content/dnd5e/srd-5.2/items.json` (dados) e
  `i18n/<locale>/items.json` (texto), como as condições.
- **Fonte:** `items-base.json` e `items.json` do 5etools, na versão fixada em
  `scripts/content/5etools-source.ts` (hoje v2.38.0). Só entradas `srd` (5.1) ou `srd52` (5.2) e sem
  raridade (`rarity` ausente ou `none`). Na v2.38.0 isso dá uns 230 itens por livro.
- **Chave:** `dnd5e:<livro>:item:<id>`, com `id` em kebab-case do nome em inglês (`plate-armor`,
  `rope-hempen`), como `conditionKey`.
- **Dados** (o que a Rebeca pediu, mais o que o 5etools já traz):
  - categoria (arma, armadura, escudo, equipamento, ferramenta, kit, montaria…), a partir do `type`
    do 5etools;
  - **preço** em peças de cobre (`value` do 5etools já vem em PC); item sem preço fica sem;
  - **peso** em libras, opcional;
  - **pré-requisito**: por enquanto só a Força mínima da armadura (`strength`); desvantagem em
    Furtividade vai junto como dado da armadura;
  - dados de regra para mostrar, não para calcular: CA da armadura ou escudo; dano, tipo de dano e
    propriedades da arma.
- **Texto:** nome e descrição. A descrição guarda as tags do 5etools, como as magias. Muita arma e
  armadura não tem descrição no 5etools; aí a tela mostra só os dados.
- **Português** (decisão do Claude, igual às condições): os nomes em pt entram neste PR, traduzidos
  e revisados à mão no diff; as descrições ficam para o Crowdin. Item sem descrição pt mostra o
  inglês com o selo "não traduzido" que as magias já usam.
- Comando irmão dos outros: `npm run content:items`. Rodar de novo só mexe no en e nos dados.

### Inventário no banco

Decisão da Rebeca: inventário em tabela desde já, porque o personagem vai ter mais de uma mochila,
baú, mover coisas entre eles, equipar e, mais à frente, trocar com outros jogadores. O catálogo de
itens continua em arquivo; o banco guarda só o que é do personagem (como `character_spells`).

- **`character_containers`**: os lugares onde o personagem guarda coisas.
  - `id`, `character_id`, `kind` (`coin_pouch`, `backpack`, `chest`), `name` opcional ("Mochila do
    cavalo"), `position` (ordem na tela), `coins` (`{ cp, sp, ep, gp, pp }`, inteiros ≥ 0).
  - **Algibeira** (`coin_pouch`): exatamente uma por personagem, garantida no banco (índice único
    parcial); não se apaga. É onde ficam as moedas.
  - **Mochila** (`backpack`): todo personagem começa com uma, vazia. Pode haver mais de uma depois.
  - **Baú** (`chest`): o tipo já existe, mas a tela desta parte não cria baú.
  - As moedas ficam no lugar, não no personagem: hoje só a algibeira mostra moedas; quando o baú
    chegar, "guardei 500 PO no baú" é o mesmo formato.
- **`character_items`**: as entradas.
  - `id`, `character_id`, `container_id`, `item_ref` (texto: `dnd5e:srd-5.2:item:rope`; depois
    `homebrew:<uuid>`, na mesma coluna), `quantity` (inteiro de 1 a 9999), `created_at`.
  - Cada entrada tem `id` próprio: é o que deixa mover parte de uma pilha ou equipar uma espada
    específica depois. `equipped` entra no plano de equipar, não agora.
  - Sem chave estrangeira para o catálogo (ele é arquivo). A rota da API confere `item_ref` contra o
    catálogo de itens comuns antes de gravar, como o grimório faz com magias.
  - Adicionar um item que já está no mesmo lugar soma a quantidade.
- **Criar os lugares padrão:** algibeira e uma mochila para todo personagem novo, e por migração
  para os que já existem.
- **Moedas saem do `system_data`** sem cópia (decisão da Rebeca: em produção ninguém tem moedas
  ainda; a algibeira na ficha não chegou a ser publicada). O campo `coins` sai do esquema de
  atualização da ficha, da entidade e dos tipos. O seed de desenvolvimento passa a criar as moedas
  do Alatar (50 PP e 120 PO) na algibeira dele.
- **RLS:** o dono lê e escreve; o mestre de uma mesa onde o personagem está lê (como a ficha
  somente leitura); mais ninguém vê. Limites: até 20 lugares e 500 entradas por personagem.
- **Salva na hora**, cada ação na sua rota (como aprender e esquecer magia), não pela barra de
  salvar: adicionar item, mudar quantidade, remover, e as moedas da algibeira (Pagar, Receber e a
  edição à mão). O cálculo do troco não muda; a tela mostra o resultado na hora (otimista) e volta
  atrás com aviso se o servidor recusar.
- Testes de integração da migração (todo personagem existente ganha algibeira e mochila) e da RLS: dono mexe; mestre da mesa só lê; outro jogador da
  mesa e quem não é da mesa não veem; a algibeira não se apaga nem duplica.

### Tela

- **A aba Inventário não tem mais a barra de salvar**: tudo nela salva na hora.
- **Mochila** é um cartão abaixo da algibeira, com o "Adicionar item" (o botão que hoje está
  desativado vai para o cabeçalho do cartão). Vazia, mostra um estado vazio com o mesmo botão.
- **Cada linha:** nome no idioma de quem lê, quantidade (editável, com − e +), peso e preço quando
  tiver. Tocar no nome abre os detalhes: categoria, preço, peso, pré-requisito, CA ou dano e
  propriedades, descrição pelo componente de texto de regra. Remover fica nos detalhes; como
  salva na hora, o aviso de "removido" traz um "Desfazer" (decisão do Claude).
- **Preço** na maior moeda em que o valor fecha inteiro (1500 PC = "15 PO", 5 PC = "5 PC"), com a
  sigla do idioma de quem lê, como na algibeira (decisão do Claude).
- **Rodapé da mochila:** peso total (soma de peso × quantidade). Só a soma; sem capacidade.
- **Adicionar item:** uma janela de busca como a de magias: campo de nome (sem acento, em pt e en),
  filtro de categoria e de edição, a lista com nome, preço e peso. Escolher um item põe 1 na mochila
  (ou soma 1, se já estiver). A edição começa na que já domina a mochila; vazia, em 2024 (decisão do
  Claude; a edição da mesa só existe dentro de uma mesa).
- Mesmo estilo da algibeira e da ficha (fantasia sóbria, só escuro), celular primeiro.

### Tag `{@item}`

- O renderizador de texto de regra (`shared/content/tags.ts` e `RulesText`) ganha o tipo `item`,
  resolvido no mesmo livro da entrada, como a condição. Popover com os mesmos detalhes da mochila.
- Tag que aponta para item mágico, item de outro livro ou id que não existe: texto normal. Um teste
  de conteúdo lista as tags `{@item}` sem item comum correspondente, só para conferência (não falha
  por item mágico).

## O que fica para quem constrói

- O formato exato dos arquivos e do esquema zod, desde que siga o das condições.
- Como mapear o `type` do 5etools para as categorias, e quais tipos ficam de fora (por exemplo,
  `$` tesouro e `TG` mercadorias, se não fizer sentido na mochila).
- O id quando dois itens do mesmo livro dariam o mesmo kebab-case.
- Popover ou drawer no celular para os detalhes.
- A ordem dos commits, um por assunto: importador e arquivos, nomes pt, catálogo, tabelas e
  migração, algibeira no banco, mochila, tag `{@item}`.
- Os nomes exatos das rotas e se o inventário vem num endpoint só (lugares + entradas).

## Processo

Na branch `feat/algibeira` (a algibeira já está nela), PR único no fim, descrição em pt e en. TDD
(unit para importador, catálogo, validação e a tela; integração para migração, RLS e rotas). Conferir
no app no desktop e no celular, como dono e como mestre lendo a ficha. Depois do merge: rodar a
Action do Crowdin para subir os textos novos.
