# Criação de personagem com classe (Fase 3 da #181)

**Issues:** [#178](https://github.com/rebecamorais/rpg-world/issues/178) (fichas base e onboarding), [#181](https://github.com/rebecamorais/rpg-world/issues/181) (classe na ficha)

**Data:** 2026-11-15
**Status:** proposta, aguardando a Rebeca. Nada foi implementado.

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
- A criação ficar bloqueada por escolha incompleta.
- Um nome traduzido ser salvo como identificador.

## Como os valores são guardados

Segue o contrato da fase 1: **o padrão da classe nunca é salvo; só o que a pessoa mudou.**

| Campo                      | Hoje                      | Nesta fase                                                                                                                            |
| -------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Salvaguardas               | 6 valores salvos          | Ficha nova não salva nada: valem as 2 da classe. Tocar numa grava o ajuste só dela. Ficha existente continua com os 6 valores salvos. |
| Perícias                   | só as marcadas            | Igual a hoje. As escolhidas na criação são gravadas como marcadas, e a ficha guarda **quais vieram da escolha da classe**.            |
| Dado de vida               | `{ die, spent }` (fase 1) | Ficha nova sem dado salvo usa o da classe.                                                                                            |
| PV máximo                  | número                    | Gravado na criação (máximo do dado + mod. CON): é um número que a pessoa edita, não um padrão que segue a classe depois.              |
| Armadura, arma, ferramenta | não existe                | Campo novo: as fixas vêm da classe (não salvas); a ficha salva as **adicionadas** (id ou texto próprio) e as **desligadas**.          |
| Idiomas                    | não existe                | Campo novo, do mesmo jeito. Pede um catálogo de idiomas do SRD 5.1 com id.                                                            |
| Escolhas pendentes         | não existe                | Calculadas: quantas a classe pede menos quantas foram feitas. A ficha salva só as **dispensadas**.                                    |

"Valor efetivo" sai de uma função só (`effectiveValue`, da fase 1), usada em toda leitura.

## Entregas

Quatro PRs pequenos, nesta ordem. Cada um é entregável sozinho.

### 3.1 Padrões da classe, sem tela nova

- Função pura `classDefaults(conteúdo, nível, atributos)`: dado de vida, PV do nível 1, salvaguardas, proficiências fixas, atributo de conjuração e a lista de escolhas (perícias e ferramentas).
- Ficha nova de edição 2014 com classe do SRD passa a ler salvaguardas e dado de vida pelo valor efetivo. Como só ficha nova fica sem valor salvo, nenhuma existente muda.
- O servidor resolve o valor efetivo onde hoje lê o campo direto (combate, visão do mestre).
- **Testes:** os quatro casos do plano (Bárbaro, Bardo, Clérigo da Vida, Mago) no nível 1; ficha existente lida do banco devolve os mesmos valores; portão de edição; ajuste por item sobrevive a trocar de classe e voltar.

### 3.2 Proficiências e idiomas

- Catálogo de idiomas do SRD 5.1 com id e nomes em `messages` (pt e en).
- Campo novo na ficha e no schema, com migration só se a função da revisão precisar conhecer o campo (a conferir).
- Seção na ficha com etiquetas: as da classe, as adicionadas da lista e as próprias. Reusa `SectionCard`, `Badge`, `ChoiceSelect` e o padrão "Outro…" que classe e raça já usam.
- **Testes:** id salvo, nunca o nome; texto próprio aparece como digitado; desligar uma da classe e religar; trocar de classe mantém as adicionadas.

### 3.3 Criação com classe

- `NewCharacterForm` ganha edição, classe (o mesmo seletor do cabeçalho da ficha) e, quando a classe é do SRD em 2014, o passo de perícias e ferramentas com contador ("2 de 3").
- O botão de criar fica sempre habilitado. Sem classe, o formulário é o de hoje.
- `POST /api/characters` aceita edição, classe e as escolhas; o caso de uso grava o PV do nível 1 e as perícias escolhidas.
- **Testes:** unidade do caso de uso; E2E criando os quatro personagens e conferindo a ficha; E2E do fluxo atual (só nome e sistema) continua passando.

### 3.4 Pendências na ficha

- Aviso na ficha enquanto houver escolha em aberto, com "resolver" e "dispensar". Não some sozinho.
- Resolver abre o mesmo seletor da criação.
- **Testes:** criar com 2 de 3 perícias mostra 1 pendente; resolver zera; dispensar some e não volta; trocar de classe não apaga as perícias já escolhidas.

## Pontos em aberto

1. **Onde o servidor precisa do valor efetivo.** Combate e visão do mestre leem salvaguardas direto do banco. A entrega 3.1 começa levantando esses lugares; se forem muitos, a alternativa é gravar as salvaguardas na criação como valores comuns, o que é mais simples mas faz a ficha deixar de seguir a classe se ela mudar.
2. **Ferramentas à escolha.** O bardo escolhe 3 instrumentos e o monge 1 ferramenta de artesão ou instrumento. Os itens já têm categoria (`instrument`, `tool`); falta conferir se toda ferramenta de artesão está marcada de um jeito que dê para listar.
3. **Idiomas de classe.** Druídico e Gíria do Ladrão entram como proficiência fixa da classe; o idioma do Ancestral Dracônico e o do Inimigo Favorito são escolhas de nível e ficam para a fase 4.
4. **Clérigo da Vida no nível 1.** A armadura pesada vem da subclasse, que o clérigo escolhe no nível 1. A criação precisa ou perguntar a subclasse do SRD ou deixar isso para quando ela for preenchida na ficha. Recomendo a segunda: a ficha já reconhece a subclasse do SRD.
