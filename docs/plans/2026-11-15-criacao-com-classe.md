# Criação de personagem com classe (Fase 3 da #181)

**Issues:** [#178](https://github.com/rebecamorais/rpg-world/issues/178) (fichas base e onboarding), [#181](https://github.com/rebecamorais/rpg-world/issues/181) (classe na ficha)

**Data:** 2026-11-15
**Status:** direção das quatro entregas aprovada pela Rebeca em 2026-11-15, com os ajustes da revisão do PR #237 já incluídos abaixo. Nada foi implementado; a implementação só começa com este plano fechado e a fase 2 mergeada.

## Por que

Hoje criar um personagem pede só nome e sistema, e a ficha nasce vazia: salvaguardas, perícias, dado de vida e PV são preenchidos à mão. As fases 1 e 2 deixaram prontos o contrato de valores e os dados do SRD 5.1. Esta fase é a primeira em que a ficha **usa** esses dados.

Decisões que valem aqui, todas aprovadas em 2026-11-15 ([mapa](../class-sheet-map.md)): 1 (padrão, ajuste e estado), 3 (PV), 8 (proficiências e idiomas), 9 (só edição 2014), 10 (onde pedir as escolhas).

## Objetivos

- Na criação dá para escolher edição e classe. Com **edição 2014 e classe do SRD**, a ficha nasce com dado de vida, PV do nível 1, as duas salvaguardas, proficiências fixas, atributo de conjuração e as caixinhas de recurso (#177).
- Perícias e ferramentas à escolha aparecem na criação. **Dá para criar sem terminar**: o que faltar vira pendência visível na ficha.
- Criar sem classe, com classe escrita à mão ou em 2024 dá exatamente a ficha de hoje.

## Fora de escopo

- Progressão de nível (fase 4): PV dos níveis seguintes, mudança de CON, AVA, Especialização, estilos, invocações.
- Grimório e espaços de magia (fase 5): máximo dos espaços, Magia de Pacto, contagens. Dependem das decisões 4, 5 e 6, ainda pendentes.
- Multiclasse, regras de 2024, raça e antecedente preenchendo campos.
- Meia proficiência e outros bônus que entram sozinhos (decisão 13, pendente).

## O que não pode acontecer

- Uma ficha existente mudar de valor ao abrir, ao salvar ou ao trocar de classe. Todo valor já salvo conta como ajuste (contrato da fase 1).
- Uma escolha já feita sumir ou ser trocada em silêncio ao mudar de classe, nível ou edição.
- A criação ficar bloqueada por escolha incompleta. (Nome e sistema continuam obrigatórios.)
- O padrão da classe ser gravado como se fosse uma escolha da pessoa, nem para poupar trabalho no servidor.
- A dispensa de uma escolha de uma classe valer para outra.
- Um nome traduzido ser salvo como identificador.

## Como os valores são guardados

Segue o contrato da fase 1: **o padrão da classe nunca é salvo; só o que a pessoa mudou.**

| Campo                      | Hoje                      | Nesta fase                                                                                                                                 |
| -------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Salvaguardas               | 6 valores salvos          | Três estados por atributo: **herdar** (nada salvo), **proficiente** e **não proficiente** (salvos). Ver abaixo.                            |
| Perícias                   | só as marcadas            | Igual a hoje. As escolhidas na criação são gravadas como marcadas, e a ficha guarda **quais foram escolhidas para qual classe**.           |
| Dado de vida               | `{ die, spent }` (fase 1) | Ficha nova sem dado salvo usa o da classe.                                                                                                 |
| PV máximo                  | número                    | Gravado na criação (máximo do dado + mod. CON): é um número que a pessoa edita, não um padrão que segue a classe depois.                   |
| Armadura, arma, ferramenta | não existe                | Campo novo: as fixas vêm da classe (não salvas); a ficha salva as **adicionadas** (id ou texto próprio) e as **desligadas**.               |
| Idiomas                    | não existe                | Campo novo, do mesmo jeito, com a **origem** de cada um. Pede um catálogo de idiomas do SRD 5.1 com id.                                    |
| Escolhas pendentes         | não existe                | Calculadas: quantas a classe pede menos quantas seleções válidas existem. A ficha salva só as **dispensadas**, pela identidade da escolha. |

### Salvaguardas: herdar, proficiente, não proficiente

"Salvaguarda" aqui é a **proficiência** no teste de resistência, não o bônus final. O bônus continua sendo modificador do atributo + bônus de proficiência (quando proficiente).

- **Herdar**: o atributo não tem valor salvo. Vale o que a classe dá, e muda junto se a classe mudar (Guerreiro → Mago troca FOR e CON por INT e SAB).
- **Proficiente** e **não proficiente**: a pessoa tocou. O valor fica salvo e vence a classe, em qualquer classe.
- Voltar a herdar apaga o valor salvo daquele atributo, sem mexer nos outros.
- **Ficha existente**: todas têm os seis valores salvos, então todas ficam em "proficiente" ou "não proficiente" nos seis. Nada muda nelas.
- Fora do portão (sem edição, 2024, classe escrita à mão), "herdar" vale "não proficiente", que é a ficha de hoje.

O padrão **não** é gravado na criação. Gravar seria mais simples, mas deixaria o valor calculado indistinguível de uma escolha manual.

### Um ponto só para o valor efetivo

Uma função pura em `shared/systems/dnd5e/` recebe a ficha salva e o conteúdo da classe e devolve os valores efetivos (salvaguardas, dado de vida, proficiências, idiomas, pendências). Ficha, servidor e demo usam essa função; ninguém recalcula a regra por conta própria.

**Levantamento de quem lê a proficiência em salvaguarda hoje** (feito em 2026-11-15, na branch da fase 2):

| Onde                                                                  | O que faz                                                     | O que muda                                                          |
| --------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------- |
| `SavingThrowsSection.tsx`                                             | Único lugar que **mostra** e calcula o bônus                  | Lê o valor efetivo; o toque grava o ajuste só daquele atributo      |
| `character-sheet-updates.ts` (`setSavingThrow`)                       | Grava os seis valores a cada toque                            | Grava só o atributo tocado; ganha "voltar a herdar"                 |
| `DnD5eCharacter.ts` (`normalizeSavingThrows`)                         | Completa os seis com `false` ao ler, e salva os seis de volta | Para de completar: ausente continua ausente                         |
| `supabase-character.repository.ts`, `characters.schemas.ts`, use case | Leem e validam o campo                                        | Já aceitam o campo parcial; o use case passa a mesclar por atributo |
| `factory.ts`, `demo/data/build.ts`                                    | Criam fichas com os seis valores                              | Ficha nova sem valores; as da demo continuam como estão             |
| Combate (`gm-row.ts`) e visão do mestre                               | **Não leem salvaguardas.** O combate lê a perícia Percepção   | Nada. A visão do mestre mostra a mesma seção da ficha               |

Ou seja: o receio do plano anterior (muitos consumidores no servidor) não se confirmou. O cuidado real é o servidor parar de completar e regravar os seis valores, senão toda ficha nova viraria "seis ajustes" no primeiro salvamento.

### Identidade das escolhas

Cada escolha da classe tem uma identidade estável: **edição + classe + identificador da escolha** (por exemplo `2014/bard/skills`, `2014/bard/tools`).

- As seleções são guardadas sob essa identidade. Trocar de Bardo para Ladino não apaga as perícias marcadas nem as seleções do Bardo.
- Para o requisito da classe atual contam só as seleções **daquela identidade**, **válidas** (estão na lista da classe) e **distintas**. Uma perícia marcada por outro motivo não conta sozinha.
- A dispensa também é por identidade: dispensar as perícias do Bardo não dispensa as do Ladino. Voltar ao Bardo encontra as seleções e a dispensa de antes.

## Entregas

Quatro PRs pequenos, nesta ordem. Cada um é entregável sozinho. A 3.1 é a maior: é nela que fica decidido como o resto do app consome as regras da classe.

### 3.1 Padrões da classe, sem tela nova

- Função pura de valores efetivos (seção acima), com `classDefaults(conteúdo, nível, atributos)` por dentro: dado de vida, PV do nível 1, salvaguardas, proficiências fixas, atributo de conjuração e a lista de escolhas.
- Salvaguardas em três estados, com os ajustes da tabela do levantamento.
- **Critérios de aceite**
  - Ficha existente: os seis valores salvos são lidos e devolvidos iguais; abrir e salvar outro campo não muda nenhum.
  - Ficha nova de 2014 com classe do SRD: nenhuma salvaguarda salva; as duas da classe aparecem como proficientes.
  - Salvar qualquer outro campo de uma ficha nova **não** grava salvaguardas.
  - Tocar numa salvaguarda grava só ela. Voltar a herdar apaga só ela.
  - Trocar de classe muda as herdadas e mantém as ajustadas.
  - Sem edição, em 2024 ou com classe escrita à mão: herdar vale não proficiente.
- **Testes**
  - Unidade: os quatro casos no nível 1 (Bárbaro, Bardo, Clérigo, Mago).
  - Unidade: os três estados por atributo; ajuste em SAB não muda CON.
  - Unidade: Guerreiro → Mago → Guerreiro com FOR desligada à mão: FOR continua desligada nas três, CON volta a valer no fim.
  - Integração: ficha de antes da mudança, lida do banco e salva de novo, mantém os seis valores.
  - Integração: ficha nova salva e relida continua sem salvaguardas no banco.
  - Unidade: portão de edição.

### 3.2 Proficiências e idiomas

- Catálogo de idiomas do SRD 5.1 com id e nomes em `messages` (pt e en).
- Campo novo na ficha e no schema, com migration só se a função da revisão precisar conhecer o campo (a conferir).
- Cada proficiência e idioma efetivo traz a **origem**: classe, subclasse, característica de classe, escolhido pela pessoa ou próprio.
- **Druídico e Gíria do Ladrão** são idiomas **concedidos por característica** (`druidic`, `thieves-cant`), não proficiências genéricas da classe: aparecem a partir do nível da característica e apontam para ela.
- **Subclasse:** o que vem da subclasse só entra quando a ficha tem a subclasse do SRD definida. O Clérigo sem subclasse **não** tem armadura pesada; com Domínio da Vida, tem, com origem "subclasse". A criação não pergunta a subclasse.
- Seção na ficha com etiquetas. Reusa `SectionCard`, `Badge`, `ChoiceSelect` e o padrão "Outro…" que classe e raça já usam.
- **Testes**
  - Id salvo, nunca o nome; texto próprio aparece como digitado.
  - Desligar uma da classe e religar; trocar de classe mantém as adicionadas e as próprias.
  - Clérigo sem subclasse, com Vida e depois sem de novo: armadura pesada some, aparece e some.
  - Druida nível 1 tem Druídico com origem na característica; Ladino nível 1 tem Gíria do Ladrão.

### 3.3 Criação com classe

- `NewCharacterForm` ganha edição, classe (o mesmo seletor do cabeçalho da ficha) e, quando a classe é do SRD em 2014, o passo de perícias e ferramentas com contador ("2 de 3").
- **Criar nunca é bloqueado por escolha incompleta. Nome e sistema continuam obrigatórios**, com as mensagens de hoje.
- `POST /api/characters` aceita edição, classe e as escolhas; o caso de uso grava o PV do nível 1 e as perícias escolhidas, sob a identidade da escolha.
- O servidor confere as escolhas recebidas: só entram as que estão na lista da classe, sem repetição e até a quantidade pedida.
- **Testes**
  - Unidade do caso de uso, incluindo escolha inválida, repetida e em excesso.
  - Sem nome: não cria, com ou sem escolhas feitas.
  - E2E criando os quatro personagens e conferindo a ficha.
  - E2E criando um Bardo com 2 de 3 perícias.
  - E2E do fluxo atual (só nome e sistema) continua passando.

### 3.4 Pendências na ficha

- Aviso na ficha enquanto houver escolha em aberto, com "resolver" e "dispensar". Não some sozinho.
- Resolver abre o mesmo seletor da criação.
- **Testes**
  - Criar com 2 de 3 perícias mostra 1 pendente; resolver zera; dispensar some e não volta.
  - Bardo com as 3 escolhidas → Ladino: as perícias do Bardo continuam marcadas, e a pendência do Ladino mostra as 4 dele em aberto.
  - Uma perícia marcada à mão, fora da escolha, não reduz a pendência.
  - Dispensar no Bardo, trocar para Ladino: a do Ladino aparece. Voltar ao Bardo: continua dispensada.
  - A mesma perícia selecionada duas vezes conta uma.

## Pontos em aberto

1. **Ferramentas à escolha.** O bardo escolhe 3 instrumentos e o monge 1 ferramenta de artesão ou instrumento. Os itens já têm categoria (`instrument`, `tool`); falta conferir se toda ferramenta de artesão está marcada de um jeito que dê para listar.
2. **Idiomas de nível.** O idioma do Ancestral Dracônico e o do Inimigo Favorito são escolhas de nível e ficam para a fase 4.
3. **Perícia que deixa de ser válida.** Ao trocar de classe, as perícias antigas ficam marcadas (decisão 10). Não há, nesta fase, um aviso de "esta perícia veio de uma classe que você não tem mais"; se fizer falta, entra na 3.4.

## Resolvido na revisão de 2026-11-15

- **Salvaguardas gravadas ou derivadas?** Derivadas, com ajuste explícito por atributo. O levantamento mostrou que só a ficha lê esse campo.
- **Clérigo da Vida no nível 1.** A subclasse fica para a ficha; a armadura pesada só aparece com a subclasse definida.
