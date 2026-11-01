# Condições e tags no texto

**Data:** 2026-11-01
**Status:** entregue (PR a abrir).
**Issue:** #105 (este plano cobre as condições; itens ficam para um segundo PR, que reaproveita
o mesmo formato).
**Planos relacionados:** `2026-10-15-5etools-e-traducoes.md` (passo 5), `2026-10-21-magias-em-arquivo.md`,
`2026-10-21-magias-por-edicao.md`, `2026-10-15-traducoes-comunitarias.md`.

## Por quê

Uma magia diz "o alvo fica amedrontado" e quem lê precisa lembrar o que isso faz. No combate, o
mestre e os jogadores precisam saber quem está caído, envenenado, contido. Hoje o app não tem nada
de condição: o importador do 5etools joga fora as tags `{@condition …}` e o combate não guarda
estado nenhum além de PV.

A ideia central é que **o texto guardado carrega referências**. O formato do 5etools,
`{@condition frightened}`, vira o padrão de todo texto de regra no app: magias agora, itens no
próximo PR, homebrew no banco (#91) e outros sistemas (F&M, #94) depois. A interface lê a tag,
mostra o nome no idioma de quem lê e, quando sabe o que fazer com aquele tipo, deixa tocar.

## Objetivos

1. **Condições em arquivo**, como as magias: SRD 5.1 e 5.2, dados e texto em en, pt pelo Crowdin.
2. **Tags guardadas no texto** de toda entrada de conteúdo, com um renderizador único na interface.
   Tocar numa condição mostra o texto dela.
3. **Magias 5.1 ganham tags** (o texto delas veio de outra fonte, sem tags), em en e pt.
4. **Selos de condição na magia**, tirados das tags do próprio texto, e filtro por condição.
5. **Condições no combate**: o mestre liga e desliga em qualquer participante; o jogador, nos
   próprios personagens. Todo mundo da mesa vê, em tempo real.

## Fora do escopo

- Página ou lista de regras. Quem joga confere no livro; a condição só aparece onde é citada ou
  marcada.
- Duração automática ("até o fim do seu próximo turno"). Por enquanto é ligar e desligar; automatizar
  fica para depois.
- Efeito mecânico (desvantagem automática, velocidade zero…).
- Condição na ficha fora do combate.
- Itens (segundo PR do #105), doenças e `status` do 5etools.

## O que não pode acontecer

- Alguém ver `{@condition …}` cru em qualquer tela, página pública, metadado ou texto para leitor de
  tela.
- Rodar o importador de novo sobrescrever tradução pt revisada.
- Uma tradução pt perder ou trocar uma tag sem ninguém perceber.

## Decisões

### Formato da tag

- O formato do 5etools, sem mudança: `{@tipo corpo|fonte|exibição}`. Exemplos:
  `{@condition frightened}`, `{@condition frightened|XPHB}`, `{@condition frightened||amedrontada}`.
- **Todas as tags do 5etools ficam no texto**, inclusive as que a interface ainda não usa
  (`{@damage}`, `{@dice}`, `{@spell}`, `{@b}`…). O importador para de chamar `stripTags` na hora de
  gravar.
- **A tag aponta para o registro, não para a palavra.** O corpo é o id da entrada (`frightened`).
  A interface mostra a exibição, se houver; senão, o corpo, como o 5etools (no inglês o corpo já é a
  palavra do texto). Nas traduções, a palavra em português vai na exibição; o popover mostra o nome
  da condição no idioma de quem lê.
- **A referência se resolve dentro do mesmo livro** da entrada que contém o texto: uma magia SRD 5.2
  aponta para a condição SRD 5.2. A parte da fonte (`XPHB`, `PHB`) não é usada por enquanto.
- **Tag sem tela própria** (qualquer tipo que não seja `condition`, nesta entrega) aparece como
  texto normal, igual ao que o `stripTags` faz hoje (inclusive os casos especiais de `chance`, `dc`,
  `scaledamage`…). Nada clicável, nada de "em desenvolvimento". Cada tipo "acende" quando ganhar tela.
- Tag de condição que não existe no livro (id errado): texto normal, e um teste de conteúdo falha.
- **Tag sem tela não busca nome traduzido** (decisão do Claude): `{@spell fireball}` num texto pt
  mostra o corpo, como hoje. Quem traduz põe o nome pt na exibição
  (`{@spell fireball||bola de fogo}`). O parser só tira tags e resolve condições; não vira um
  buscador de qualquer tipo.

### Condições em arquivo

- Arquivos ao lado das magias: `content/dnd5e/srd-5.1/conditions.json` e
  `content/dnd5e/srd-5.2/conditions.json` (dados), e `i18n/<locale>/conditions.json` (texto: nome e
  descrição), no mesmo formato e com o mesmo esquema zod que as magias usam.
- Fonte: `conditionsdiseases.json` do 5etools, na mesma versão fixada do importador de magias, só as
  entradas marcadas como SRD (`srd` para 5.1, `srd52` para 5.2). Só `condition`, sem `disease`.
- Exaustão: o dado da condição diz que ela tem nível (1 a 6).
- As descrições das condições também guardam tags (uma condição cita outra: "inconsciente" inclui
  "incapacitado").
- O pt das condições 5.2 vem do Crowdin, como as magias. Para 5.1, usar a mesma fonte de onde veio o
  pt das magias 5.1, se tiver condições; senão, Crowdin também.
- Mesmo comando de importação das magias ou um irmão (`npm run content:conditions`). Rodar de novo só
  mexe no en e nos dados.

### Tags nas magias 5.1

- Script de uma vez só que procura os nomes das condições no en e no pt das magias 5.1 e grava as
  tags no arquivo. Em pt, cobre gênero e número ("amedrontado", "amedrontada", "amedrontados"…) com
  a forma do texto na exibição: `{@condition frightened||amedrontada}`.
- O resultado é revisado no diff antes do commit. Falso positivo (por exemplo, "caído" no sentido
  comum) se corrige à mão.

### Traduções e o Crowdin

- Quem traduz mantém a tag e muda só a exibição.
- **Teste de conteúdo:** para cada entrada e cada campo, o en e cada tradução têm as mesmas tags
  (mesmo tipo e mesmo corpo, na mesma quantidade); a exibição pode mudar. Tradução vazia não conta,
  então os arquivos es e sv (vazios) passam sem nada a fazer.
- **Crowdin depois do merge** (decisão do Claude): pôr tags no en da 5.1 muda os textos de origem e
  pode marcar o pt como desatualizado lá. Depois do merge, rodar a Action do Crowdin à mão enviando
  também as traduções do repo (`upload_translations: true`), para o pt com tags valer. O PR avisa esse
  passo; nada de automação nova.
- O Crowdin precisa tratar `{@…}` de forma que o tradutor não quebre a tag sem querer (se der para
  configurar como marcação ou placeholder).

### Renderização

- Um componente único transforma o texto em nós: texto, tag conhecida, tag sem tela. Ele substitui o
  `{spell.description}` cru no `SpellDetails` e vale para todo campo de texto de regra (descrição,
  "em níveis superiores", gatilho da reação, material).
- **Condição:** um botão discreto no texto (sublinhado ou cor de destaque) que abre um popover com
  nome e descrição da condição no idioma de quem lê. A descrição da condição usa o mesmo componente
  (condição citando condição), com um limite de profundidade.
- **Todo lugar que mostra ou exporta texto de regra precisa passar pelo componente ou por uma versão
  que só tira as tags:** cartão da magia, grimório, busca, páginas públicas estáticas
  (`2026-10-24-paginas-publicas-estaticas.md`), metadados, textos para leitor de tela. Busca por
  texto, se houver, olha o texto sem as tags.
- Acessível: o botão tem nome ("Amedrontado, condição"), abre com teclado, fecha com Esc; 44px de
  área de toque no celular sem mudar a altura da linha.

### Selos e filtro na magia

- As condições de uma magia saem das tags do texto en dela (descrição e "em níveis superiores"),
  calculadas ao carregar o catálogo, sem campo novo no arquivo.
- O cartão da magia mostra os selos (tocar abre o mesmo popover).
- Filtro por condição no grimório (junto dos filtros do #108) e na busca de magias, só com as
  condições que existem na lista.

### Condições no combate

- O participante do combate ganha a lista de condições ligadas, com o nível da exaustão quando for o
  caso.
- **Edição da mesa** (decisão da Rebeca): a mesa ganha uma edição padrão (2014 ou 2024, começando em
  2024), que o mestre escolhe em `/parties/[id]/settings`. A lista de "Condições" do combate começa
  nela. Como a mesa costuma misturar coisas, **dá para trocar para a outra edição** na própria lista
  e marcar uma condição de lá; o popover de uma condição também oferece ver a versão da outra edição,
  quando existir. Por isso a condição marcada guarda o livro junto com o id (a chave
  `dnd5e:srd-5.2:condition:frightened`, ou o par livro + id), e o selo indica a edição quando ela não
  for a da mesa.
- **Quem liga e desliga:** o mestre, em qualquer participante (jogador, inimigo, aliado); o jogador,
  só nos participantes que são personagens dele. Como o jogador não escreve em
  `encounter_participants` hoje, a escrita passa por uma função no banco que confere isso, no mesmo
  estilo das funções de turno.
- **Quem vê:** todo mundo da mesa. `encounter_turns` passa a devolver as condições de cada
  participante (continua sem iniciativa nem PV).
- Atualiza em tempo real pelo canal que o combate já usa.
- Condições somem com o combate (a linha do participante é apagada no fim). Nada vai para a ficha.
- **Tela:** no card do participante, os selos das condições ligadas; um botão "Condições" abre a
  lista do livro para ligar e desligar (exaustão com o nível). Tocar num selo abre o texto da
  condição. Na visão do jogador, os selos aparecem em todos; o botão só nos personagens dele.
- Migração com teste de integração de RLS: mestre muda qualquer um; jogador muda o dele e não o dos
  outros nem o de inimigo; quem não é da mesa não lê nem muda.
- **Validação do id** (decisão do Claude): a rota da API confere o id contra o catálogo em arquivo
  antes de chamar a função; a função no banco confere só permissão e formato (id curto, nível de 1 a
  6, livro conhecido). Quem chamar a função direto com um id inventado só estraga o próprio combate, e a interface
  mostra id desconhecido como texto simples. Assim os ids não precisam ser copiados para o SQL.

## O que fica para quem constrói

- O esquema exato no banco (coluna `jsonb`, `text[]` com coluna de exaustão, ou tabela própria),
  desde que a condição guarde o livro.
- Onde mora o parser de tags (provavelmente `src/shared/`, porque o servidor também precisa tirar
  tags e extrair condições).
- Popover ou drawer no celular; o visual do selo dentro do estilo atual (fantasia sóbria, só escuro).
- Como configurar o Crowdin para as tags.
- A ordem dos commits, desde que um por assunto: formato e renderizador, importador e arquivos,
  tags na 5.1, selos e filtro, combate.

## Processo

Mesmo do roadmap: branch `feat/condicoes` a partir da `main`, TDD (unit para parser e conversão;
integração para migração e RLS), conferir no app no desktop e no celular, como mestre e como jogador,
`/code-review`, PR único com descrição em pt e en, "Parte de #105" (a issue fecha com o PR dos
itens). Migração vai para produção no merge.
