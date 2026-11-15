# O que a classe muda na ficha — SRD 5.1 / What the class changes on the sheet — SRD 5.1

> **RASCUNHO para revisão (#181).** Escrito sem a Rebeca; tudo marcado **PROPOSTA** é sugestão, não decisão.
> Base das fichas base / onboarding (#178). Complementa o mapa de recursos (#179) e segue as decisões da #177.
>
> **DRAFT for review (#181).** Written without Rebeca; everything marked **PROPOSAL** is a suggestion, not a decision.

## PT

Mapa do que cada classe do **SRD 5.1 (D&D 2014)** define na ficha além dos recursos (#179): dado de vida, proficiências, salvaguardas, perícias à escolha, conjuração e as características por nível que **mudam um número ou um campo**. Características só de mesa ("você pode fazer X uma vez por turno") ficam de fora. Só regras de 2014; nada do SRD 5.2 (2024).

**De onde vêm os números.** Dado de vida, proficiências, salvaguardas, perícias, atributo e tipo de conjurador e a lista de características por nível foram conferidos em `content/dnd5e/srd-5.1/classes.json`. Os nomes em português vêm de `content/dnd5e/srd-5.1/i18n/pt/classes.json` e `messages/pt.json`, e são **provisórios** (a tradução final vem pelo Weblate). O que o `classes.json` **não tem** (tabelas de espaços de magia, truques e magias conhecidas, dado de Artes Marciais, Ataque Furtivo, Movimento sem Armadura etc.) veio do texto do SRD 5.1 e está marcado **(conferir)**.

Legenda: **PB** = bônus de proficiência; **mod** = modificador; **nv** = nível de classe; pés (ft) como no SRD (9 m = 30 ft).

### Comum a todas as classes

| Campo | Regra |
|---|---|
| Bônus de proficiência | +2 (nv 1–4), +3 (5–8), +4 (9–12), +5 (13–16), +6 (17–20). Já calculado em `shared/systems/dnd5e/calculations.ts`. |
| Dados de vida | `nv` dados do tipo da classe (ex.: 5d10). |
| PV máximo | nv 1: máximo do dado + mod. CON. Cada nível depois: rolar o dado ou a média fixa (d6 → 4, d8 → 5, d10 → 6, d12 → 7) + mod. CON. |
| Aumento no Valor de Atributo (AVA) | +2 em um atributo ou +1 em dois (máximo 20), ou um talento se a mesa usa. Níveis 4, 8, 12, 16, 19 (guerreiro e ladino têm extras, ver abaixo). |
| Perícias | A classe dá **N à escolha** de uma lista. Antecedente e raça dão outras (fora deste mapa). |

### Tabelas de espaços de magia (conferir)

O `classes.json` só diz o **tipo** (`spellcasting.progression`: `full`, `half`, `pact`). A tabela em si **não está nos dados**; abaixo, do SRD 5.1.

**Conjurador completo** (bardo, clérigo, druida, feiticeiro, mago). Espaços por círculo 1º–9º:

| Nv | 1º | 2º | 3º | 4º | 5º | 6º | 7º | 8º | 9º |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 2 | | | | | | | | |
| 2 | 3 | | | | | | | | |
| 3 | 4 | 2 | | | | | | | |
| 4 | 4 | 3 | | | | | | | |
| 5 | 4 | 3 | 2 | | | | | | |
| 6 | 4 | 3 | 3 | | | | | | |
| 7 | 4 | 3 | 3 | 1 | | | | | |
| 8 | 4 | 3 | 3 | 2 | | | | | |
| 9 | 4 | 3 | 3 | 3 | 1 | | | | |
| 10 | 4 | 3 | 3 | 3 | 2 | | | | |
| 11–12 | 4 | 3 | 3 | 3 | 2 | 1 | | | |
| 13–14 | 4 | 3 | 3 | 3 | 2 | 1 | 1 | | |
| 15–16 | 4 | 3 | 3 | 3 | 2 | 1 | 1 | 1 | |
| 17 | 4 | 3 | 3 | 3 | 2 | 1 | 1 | 1 | 1 |
| 18 | 4 | 3 | 3 | 3 | 3 | 1 | 1 | 1 | 1 |
| 19 | 4 | 3 | 3 | 3 | 3 | 2 | 1 | 1 | 1 |
| 20 | 4 | 3 | 3 | 3 | 3 | 2 | 2 | 1 | 1 |

**Meio conjurador** (paladino, patrulheiro): **nenhum espaço no nv 1**; do nv 2 em diante é a linha do conjurador completo no nível **metade do nv, arredondado pra cima** (nv 2 → linha 1 = 2 espaços de 1º; nv 5 → linha 3 = 4/2; nv 17 → linha 9 = 4/3/3/3/1; máximo 5º círculo).

**Magia de Pacto** (bruxo): já está no `classes.json` como recurso `pact-slots` (#179): 1 (nv 1) · 2 (nv 2) · 3 (nv 11) · 4 (nv 17), todos no mesmo círculo: 1º (nv 1), 2º (nv 3), 3º (nv 5), 4º (nv 7), 5º (nv 9). Volta no DC ou DL. Arcana Mística 6º–9º também já são recursos.

**Truques e magias conhecidas/preparadas (conferir, não estão no `classes.json`):**

| Classe | Truques (nv 1 / 4 / 10) | Magias |
|---|---|---|
| Bardo | 2 / 3 / 4 | conhecidas: 4 (nv 1), +1 por nível até 12 (nv 9); 14 (10), 15 (11), 16 (13), 18 (14), 19 (15), 20 (17), 22 (18) (+ Segredos Mágicos) |
| Clérigo | 3 / 4 / 5 | preparadas: mod. SAB + nv (mín. 1) + magias de domínio sempre preparadas |
| Druida | 2 / 3 / 4 | preparadas: mod. SAB + nv (mín. 1) + magias de círculo (Terra) |
| Feiticeiro | 4 / 5 / 6 | conhecidas: 2 no nv 1 … 15 no nv 17 |
| Bruxo | 2 / 3 / 4 | conhecidas: 2 no nv 1 … 15 no nv 19 (+ Arcana Mística) |
| Mago | 3 / 4 / 5 | preparadas: mod. INT + nv (mín. 1); grimório começa com 6 e ganha 2 por nível |
| Paladino | — | preparadas: mod. CAR + metade do nv (arred. pra baixo, mín. 1), a partir do nv 2 |
| Patrulheiro | — | conhecidas: 2 no nv 2 … 11 no nv 19 |

### Bárbaro (Trilha do Berserker)

| Campo | Valor |
|---|---|
| Dado de vida | d12 (PV nv 1: 12 + CON) |
| Salvaguardas | FOR, CON |
| Armaduras | leves, médias, escudos |
| Armas | simples, marciais |
| Ferramentas | — |
| Perícias | 2 entre Adestrar Animais, Atletismo, Intimidação, Natureza, Percepção, Sobrevivência |
| Conjuração | nenhuma |

| Nv | Característica | Campo que muda |
|---|---|---|
| 1 | Defesa sem Armadura | **CA** = 10 + mod. DES + mod. CON sem armadura (escudo vale) |
| 1 | Fúria | dano de fúria +2/+3 (nv 9)/+4 (nv 16) (recurso na #179) |
| 4, 8, 12, 16, 19 | AVA | atributos |
| 5 | Ataque Extra | 2 ataques por ação |
| 5 | Movimento Rápido | **deslocamento** +10 ft sem armadura pesada |
| 7 | Instintos Primitivos | vantagem em **iniciativa** |
| 9 / 13 / 17 | Crítico Brutal | +1 / +2 / +3 dados no crítico corpo a corpo |
| 18 | Força Indomável | teste de FOR nunca abaixo do valor de FOR |
| 20 | Campeão Primitivo | **FOR e CON +4** (máx. 24) → muda PV máximo, CA sem armadura etc. |

Berserker: nada que mude campo (Frenesi dá exaustão; ver #179).

### Bardo (Colégio do Conhecimento)

| Campo | Valor |
|---|---|
| Dado de vida | d8 |
| Salvaguardas | DES, CAR |
| Armaduras | leves |
| Armas | simples, besta de mão, espada longa, rapieira, espada curta |
| Ferramentas | 3 instrumentos musicais à escolha |
| Perícias | **3 quaisquer** (as 18) |
| Conjuração | CAR · completo |

| Nv | Característica | Campo que muda |
|---|---|---|
| 2 | Pau pra Toda Obra | +metade do PB (arred. pra baixo) em testes de atributo sem proficiência → **perícias sem proficiência** e **iniciativa** |
| 2 / 9 / 13 / 17 | Canção do Descanso | d6 / d8 / d10 / d12 extra ao gastar dados de vida no DC |
| 3, 10 | Especialização | **2 perícias** com proficiência ganham PB dobrado (cada vez) |
| 3 | Conhecimento: Proficiências Adicionais | **+3 perícias** à escolha |
| 4, 8, 12, 16, 19 | AVA | atributos |
| 5 / 10 / 15 | Inspiração de Bardo | dado d8 / d10 / d12 (recurso na #179) |
| 10, 14, 18 | Segredos Mágicos | +2 magias de qualquer lista (conta nas conhecidas) |
| 6 | Conhecimento: Segredos Mágicos Adicionais | +2 magias de qualquer lista |

### Clérigo (Domínio da Vida)

| Campo | Valor |
|---|---|
| Dado de vida | d8 |
| Salvaguardas | SAB, CAR |
| Armaduras | leves, médias, escudos (+ **pesadas** pelo Domínio da Vida) |
| Armas | simples |
| Ferramentas | — |
| Perícias | 2 entre História, Intuição, Medicina, Persuasão, Religião |
| Conjuração | SAB · completo (preparadas) |

| Nv | Característica | Campo que muda |
|---|---|---|
| 1 | Domínio da Vida: Proficiência Adicional | **armaduras pesadas** |
| 1 | Domínio da Vida: Discípulo da Vida | cura de magias +2 + círculo (informativo) |
| 1, 3, 5, 7, 9 | Magias de domínio | sempre preparadas, não contam no limite (conferir lista no texto da subclasse) |
| 4, 8, 12, 16, 19 | AVA | atributos |
| 5 / 8 / 11 / 14 / 17 | Destruir Mortos-Vivos | ND ½ / 1 / 2 / 3 / 4 |
| 8 | Golpe Divino | +1d8 radiante 1×/turno em arma; 2d8 no nv 14 |

### Druida (Círculo da Terra)

| Campo | Valor |
|---|---|
| Dado de vida | d8 |
| Salvaguardas | INT, SAB |
| Armaduras | leves, médias, escudos (o SRD diz: nada de metal) (conferir: o `classes.json` não guarda essa restrição) |
| Armas | clava, adaga, dardo, azagaia, maça, bordão, cimitarra, foice, funda, lança |
| Ferramentas | kit de herbalismo |
| Perícias | 2 entre Arcanismo, Adestrar Animais, Intuição, Medicina, Natureza, Percepção, Religião, Sobrevivência |
| Conjuração | SAB · completo (preparadas) |

| Nv | Característica | Campo que muda |
|---|---|---|
| 1 | Druídico | **idioma** secreto |
| 2 | Círculo da Terra: Truque Adicional | +1 truque |
| 3, 5, 7, 9 | Magias de círculo (pela terra escolhida) | sempre preparadas (conferir) |
| 4, 8, 12, 16, 19 | AVA | atributos |
| 2 / 4 / 8 | Forma Selvagem | ND máx. ¼ / ½ / 1 (recurso na #179) |

Caminho da Floresta (6), Proteção Natural (10: imune a veneno e doença; não pode ser amedrontado nem enfeitiçado por elementais e fadas), Santuário Natural (14): sem campo hoje (imunidades, ver Lacunas).

### Guerreiro (Campeão)

| Campo | Valor |
|---|---|
| Dado de vida | d10 |
| Salvaguardas | FOR, CON |
| Armaduras | todas, escudos |
| Armas | simples, marciais |
| Ferramentas | — |
| Perícias | 2 entre Acrobacia, Adestrar Animais, Atletismo, História, Intuição, Intimidação, Percepção, Sobrevivência |
| Conjuração | nenhuma |

| Nv | Característica | Campo que muda |
|---|---|---|
| 1 | Estilo de Luta (escolha) | ex.: Defesa = **CA +1** com armadura; Arquearia +2 em ataque à distância |
| 4, **6**, 8, 12, **14**, 16, 19 | AVA | atributos (7 vezes) |
| 5 / 11 / 20 | Ataque Extra | **2 / 3 / 4 ataques** |
| 3 | Campeão: Crítico Aprimorado | crítico em **19–20** |
| 7 | Atleta Extraordinário | +metade do PB (arred. pra cima) em testes de FOR/DES/CON sem proficiência → perícias e **iniciativa** |
| 10 | Estilo de Luta Adicional | outra escolha |
| 15 | Crítico Superior | crítico em **18–20** |
| 18 | Sobrevivente | recupera 5 + CON PV por turno abaixo da metade (informativo) |

### Monge (Caminho da Mão Espalmada)

| Campo | Valor |
|---|---|
| Dado de vida | d8 |
| Salvaguardas | FOR, DES |
| Armaduras | — |
| Armas | simples, espada curta |
| Ferramentas | 1 ferramenta de artesão **ou** 1 instrumento musical |
| Perícias | 2 entre Acrobacia, Atletismo, História, Intuição, Religião, Furtividade |
| Conjuração | nenhuma (CD do Ki = 8 + PB + mod. SAB) |

| Nv | Característica | Campo que muda |
|---|---|---|
| 1 | Defesa sem Armadura | **CA** = 10 + mod. DES + mod. SAB, sem armadura e **sem escudo** |
| 1 | Artes Marciais | dado d4 (nv 1) / d6 (5) / d8 (11) / d10 (17) (conferir); DES no lugar de FOR |
| 2 | Movimento sem Armadura | **deslocamento** +10 ft (nv 2) / +15 (6) / +20 (10) / +25 (14) / +30 (18) (conferir) |
| 4, 8, 12, 16, 19 | AVA | atributos |
| 5 | Ataque Extra | 2 ataques |
| 10 | Pureza do Corpo | imune a doença e veneno |
| 13 | Idioma do Sol e da Lua | entende todos os **idiomas** |
| 14 | Alma de Diamante | proficiência em **todas as salvaguardas** |

Mão Espalmada: nada que mude campo (Integridade Corporal é recurso, #179). Na #179 o nome era "Mão Aberta"; o arquivo de tradução diz "Mão Espalmada".

### Paladino (Juramento da Devoção)

| Campo | Valor |
|---|---|
| Dado de vida | d10 |
| Salvaguardas | SAB, CAR |
| Armaduras | todas, escudos |
| Armas | simples, marciais |
| Ferramentas | — |
| Perícias | 2 entre Atletismo, Intuição, Intimidação, Medicina, Persuasão, Religião |
| Conjuração | CAR · meio (a partir do nv 2, preparadas) |

| Nv | Característica | Campo que muda |
|---|---|---|
| 2 | Estilo de Luta (escolha) | ex.: Defesa **CA +1** |
| 3 | Saúde Divina | imune a doença |
| 3, 5, 9, 13, 17 | Magias de juramento | sempre preparadas (conferir) |
| 4, 8, 12, 16, 19 | AVA | atributos |
| 5 | Ataque Extra | 2 ataques |
| 6 | Aura de Proteção | **+mod. CAR (mín. +1) em todas as salvaguardas** dela (e aliados a 3 m; 9 m no nv 18) |
| 10 | Aura de Coragem | imune a amedrontado |
| 11 | Destruição Divina Aprimorada | +1d8 radiante em todo ataque corpo a corpo |

Devoção: nada que mude campo fora dos recursos (#179).

### Patrulheiro (Caçador)

| Campo | Valor |
|---|---|
| Dado de vida | d10 |
| Salvaguardas | FOR, DES |
| Armaduras | leves, médias, escudos |
| Armas | simples, marciais |
| Ferramentas | — |
| Perícias | 3 entre Adestrar Animais, Atletismo, Intuição, Investigação, Natureza, Percepção, Furtividade, Sobrevivência |
| Conjuração | SAB · meio (a partir do nv 2, conhecidas) |

| Nv | Característica | Campo que muda |
|---|---|---|
| 1 | Inimigo Favorito | +1 **idioma** (de um inimigo favorito); mais inimigos no nv 6 e 14 |
| 1 | Explorador Natural | PB dobrado em testes de INT/SAB no terreno favorito (situacional) |
| 2 | Estilo de Luta (escolha) | ex.: Defesa **CA +1**, Arquearia |
| 4, 8, 12, 16, 19 | AVA | atributos |
| 5 | Ataque Extra | 2 ataques |

Caçador: escolhas de combate (nv 3, 7, 11, 15) sem campo; viram texto.

### Ladino (Ladrão)

| Campo | Valor |
|---|---|
| Dado de vida | d8 |
| Salvaguardas | DES, INT |
| Armaduras | leves |
| Armas | simples, besta de mão, espada longa, rapieira, espada curta |
| Ferramentas | ferramentas de ladrão |
| Perícias | **4** entre Acrobacia, Atletismo, Enganação, Intuição, Intimidação, Investigação, Percepção, Atuação, Persuasão, Prestidigitação, Furtividade |
| Conjuração | nenhuma |

| Nv | Característica | Campo que muda |
|---|---|---|
| 1, 6 | Especialização | **2 perícias** (ou 1 perícia + ferramentas de ladrão) com PB dobrado, cada vez |
| 1 | Ataque Furtivo | 1d6, +1d6 a cada 2 níveis (nv ímpar): **metade do nv arred. pra cima** d6 (conferir) |
| 1 | Gíria do Ladrão | **idioma** |
| 4, 8, **10**, 12, 16, 19 | AVA | atributos (6 vezes) |
| 11 | Talento Confiável | d20 < 10 vira 10 em perícia proficiente (informativo) |
| 15 | Mente Escorregadia | proficiência em **salvaguarda de SAB** |

Ladrão: Mãos Rápidas e Escalada (nv 3: escalar não custa movimento extra, não é deslocamento de escalada no 5.1) e Furtividade Suprema (9) não mudam campo.

### Feiticeiro (Linhagem Dracônica)

| Campo | Valor |
|---|---|
| Dado de vida | d6 |
| Salvaguardas | CON, CAR |
| Armaduras | — |
| Armas | adaga, dardo, funda, bordão, besta leve |
| Ferramentas | — |
| Perícias | 2 entre Arcanismo, Enganação, Intuição, Intimidação, Persuasão, Religião |
| Conjuração | CAR · completo (conhecidas) |

| Nv | Característica | Campo que muda |
|---|---|---|
| 1 | Dracônica: Ancestral Dracônico | **idioma** Dracônico (conferir) + tipo de dano escolhido |
| 1 | Dracônica: Resiliência Dracônica (nome provisório) | **PV máximo +1 por nível** de feiticeiro; **CA** = 13 + mod. DES sem armadura |
| 4, 8, 12, 16, 19 | AVA | atributos |
| 6 | Afinidade Elemental | +mod. CAR no dano do tipo; pode gastar 1 pt para **resistência** por 1 h |
| 14 | Asas de Dragão | **deslocamento de voo** = deslocamento |

### Bruxo (O Ínfero)

| Campo | Valor |
|---|---|
| Dado de vida | d8 |
| Salvaguardas | SAB, CAR |
| Armaduras | leves |
| Armas | simples |
| Ferramentas | — |
| Perícias | 2 entre Arcanismo, Enganação, História, Intimidação, Investigação, Natureza, Religião |
| Conjuração | CAR · pacto (conhecidas) |

| Nv | Característica | Campo que muda |
|---|---|---|
| 1 | Magia de Pacto | espaços de pacto (recurso, #179) |
| 2 | Invocações Místicas (escolha) | 2 (nv 2) · 3 (5) · 4 (7) · 5 (9) · 6 (12) · 7 (15) · 8 (18) — no `classes.json`. Algumas mudam campo (ex.: Armadura das Sombras, Visão do Diabo) |
| 3 | Dádiva do Pacto (escolha) | Lâmina / Corrente / Tomo (Tomo dá 3 truques extras) |
| 4, 8, 12, 16, 19 | AVA | atributos |
| 1 | Ínfero: Bênção do Obscuro | PV temporários = mod. CAR + nv ao derrubar inimigo (informativo) |
| 10 | Resistência Ínfera | **resistência** a um tipo de dano, troca a cada descanso |

Na #179 o patrono era "O Corruptor"; o arquivo de tradução diz "O Ínfero".

### Mago (Escola de Evocação)

| Campo | Valor |
|---|---|
| Dado de vida | d6 |
| Salvaguardas | INT, SAB |
| Armaduras | — |
| Armas | adaga, dardo, funda, bordão, besta leve |
| Ferramentas | — |
| Perícias | 2 entre Arcanismo, História, Intuição, Investigação, Medicina, Religião |
| Conjuração | INT · completo (preparadas do grimório) |

| Nv | Característica | Campo que muda |
|---|---|---|
| 4, 8, 12, 16, 19 | AVA | atributos |
| 10 | Evocação Potencializada | +mod. INT no dano de magias de evocação |
| 18 | Maestria de Magias | 1 magia de 1º e 1 de 2º sem gastar espaço |
| 20 | Magias Assinatura | recurso (#179) |

### O que a ficha preenche sozinha vs. só sugere — PROPOSTA

Princípio (igual à #177): **classe oficial + nível + edição dão o ponto de partida**; o que a pessoa mudar fica por cima e **sobrevive ao subir de nível**; **classe desconhecida = tudo manual** (a ficha de hoje); **multiclasse = manual** por enquanto.

Três níveis:
- **Preenche**: o app escreve o valor padrão. Se a pessoa mudar, o valor dela vence, e subir de nível não apaga.
- **Sugere**: o app mostra o valor ou a escolha ("Bárbaro escolhe 2 destas") e a pessoa confirma ou marca. Nada muda sem um toque.
- **Manual**: o app não mexe.

| Campo | Na criação (#178) | Ao subir de nível | Por quê |
|---|---|---|---|
| Dados de vida (`hitDice.total`) | **Preenche** `1d<dado>` | **Preenche** `<nv>d<dado>` se ela não mudou o dado | Determinístico. O checklist de descanso já usa o dado da classe como reserva (`RestChecklist.tsx`). |
| Dados de vida restantes | **Preenche** (todos) | já existe (`setLevel` em `character-sheet-updates.ts`) | — |
| PV máximo | **Sugere** máximo do dado + CON | **Sugere** "+média (6) + CON" ou "rolar"; botão aplica | Muitas mesas rolam; nunca sobrescrever. Resiliência Dracônica entra na sugestão. |
| Bônus de proficiência | derivado (já é) | derivado | — |
| Salvaguardas | **Preenche** as 2 da classe | **Sugere** Alma de Diamante (monge 14), Mente Escorregadia (ladino 15) | Na criação é a regra; depois, um marcador simples (booleano) não sabe se ela desmarcou de propósito. |
| Perícias da classe | **Sugere**: "escolha N" com a lista destacada | **Sugere** perícias da subclasse (Conhecimento nv 3) | É escolha da pessoa. |
| Especialização | — | **Sugere** no nv certo ("Escolha 2 perícias") | Escolha. |
| Armaduras, armas, ferramentas | **Preenche** a lista da classe (+ pesadas para Vida) | **Preenche** o que a subclasse der | Fixo pela classe. Precisa de campo novo (ver Lacunas). Ferramentas à escolha (bardo, monge) = **sugere**. |
| Idiomas de classe (Druídico, Gíria do Ladrão) | **Preenche** | **Sugere** (Idioma do Sol e da Lua, Inimigo Favorito) | Campo novo. |
| Atributo de conjuração | **Preenche** | — | Fixo pela classe. |
| CD e ataque de magia | **derivado** (8 + PB + mod. / PB + mod.), com ajuste manual | derivado | Hoje são números guardados e sem tela. Itens (+1/+2) entram como ajuste. |
| Sistema de magia | **Preenche** "espaços" para conjuradores | — | Ficha existente com "pontos" não muda. |
| Máximo dos espaços de magia | **Preenche** pela tabela | **Preenche** pela tabela, sem apagar o máximo que ela mudou | Mesmo modelo das caixinhas (padrão + ajuste por cima). Bruxo: já são caixinhas. |
| Truques / magias conhecidas ou preparadas | **Sugere** "X de Y" no Grimório | **Sugere** "+1 magia nova" | Contagem de referência, não bloqueia. |
| CA | **Sugere** a fórmula da classe (Defesa sem Armadura, Resiliência Dracônica) como dica | **Sugere** | Depende de armadura, escudo, itens e estilo de luta; o inventário ainda não liga com a CA. |
| Deslocamento | manual (vem da raça) | **Sugere** "+10 ft" (Movimento Rápido, Movimento sem Armadura) | Depende da armadura; a raça define a base. |
| Iniciativa | manual (DES) | **Sugere** Pau pra Toda Obra / Atleta Extraordinário; Instintos Primitivos vira nota | Hoje é número manual. |
| Ataques por ação, faixa de crítico, Ataque Furtivo, Artes Marciais, dado de fúria | **Mostra** numa linha de "números da classe" (só leitura) | **Mostra** atualizado | Não há campo; texto calculado basta. |
| AVA | — | **Sugere** lembrete "AVA neste nível"; atributos manuais | Escolha (ou talento). |
| Resistências e imunidades | manual | manual (nota da característica) | Não há campo; escopo à parte. |
| Estilo de Luta, Invocações, Metamagia, Dádiva do Pacto | **Sugere** a escolha | **Sugere** no nv certo | Escolhas; já estão em `choices` no `classes.json`. |

### Lacunas no app hoje

O modelo da ficha está em `src/backend/contexts/characters/domain/entity/DnD5eCharacter.ts`, o contrato da API em `src/backend/contexts/characters/interfaces/characters.schemas.ts` (`characterUpdatesSchema`) e o tipo compartilhado em `shared/systems/dnd5e/types.ts`.

**Já tem:**
- `level`, `class` (id da lista ou texto livre, reconhecido por `matchCharacterClass` em `src/frontend/lib/character-choices.ts`), `subclass` (texto, reconhecido por `matchSubclass` em `shared/systems/dnd5e/class-resources.ts`), `edition`.
- `hitDice { total: "5d10", current }`, já mantido no level-up por `setLevel` (`src/frontend/lib/character-sheet-updates.ts`).
- `savingThrowProficiencies` (booleano por atributo).
- `skills { isProficient, expertise }`, com o PB dobrado já calculado em `shared/systems/dnd5e/calculations.ts`.
- `spellcastingSystem` (`slots`/`points`), `spellSlots { max, used }` por círculo (o máximo é manual), `spellPoints`.
- `spellcastingAbility`, `spellSaveDc`, `spellAttackBonus`: **guardados mas sem tela.** Só a demo preenche (`src/frontend/demo/data/build.ts`); nenhum componente da ficha mostra.
- `ac`, `speed`, `initiative`: números manuais (`src/frontend/components/character/stats/CombatStatsSection.tsx`).
- `resources` com padrão + `overrides` (#177/#180), o modelo a copiar para os espaços de magia.

**Falta:**
- **Proficiências de armadura, arma e ferramenta** e **idiomas**: nenhum campo no modelo nem no schema. O `classes.json` já tem os dados (`proficiencies.armor/weapons/tools/toolChoice`).
- **Tabelas de espaços de magia, truques e magias conhecidas** no conteúdo: o `classes.json` só tem `spellcasting.progression`. Seria uma tabela única em `shared/systems/dnd5e/` (completo/meio), já que é igual para todas as classes do mesmo tipo.
- **Tabelas de classe** (Artes Marciais, Ataque Furtivo, Movimento sem Armadura, dano de fúria): não estão no `classes.json`; a característica só tem `id` e `level`.
- **API de conteúdo**: `ClassResourcesContent` (`shared/systems/dnd5e/class-resources.ts`, rota `app/api/content/classes/route.ts`) devolve só `hitDie` e recursos. Falta expor proficiências, salvaguardas, perícias, conjuração e características.
- **"Veio do SRD" vs. "a pessoa mudou"** fora das caixinhas: salvaguardas, perícias e espaços de magia são valores simples, sem padrão + ajuste. Sem isso, "preencher no level-up sem apagar" só funciona para as caixinhas.
- **Lista de características da classe na ficha**: não há aba nem seção (as abas são Status, Lore, Grimório, Inventário, Aparência).
- **Criação**: `src/frontend/components/character/NewCharacterForm.tsx` só pede nome e sistema; `createDnD5eCharacter` (`shared/systems/dnd5e/factory.ts`) cria tudo zerado (CA 10, deslocamento 30, sem salvaguardas).
- **Meia proficiência** (Pau pra Toda Obra, Atleta Extraordinário): `calculateSkillValue` só conhece "sem", "proficiente" e "especialista".
- **Resistências / imunidades / deslocamentos extras** (voo, escalada): sem campo.
- **Unidade do deslocamento**: a etiqueta é "m" (`messages/*.json`, `speedUnit`), mas o padrão é 30 (`factory.ts`, comentário "30ft"). Qualquer sugestão "+10 ft" precisa saber a unidade (conferir com a Rebeca: talvez um bug à parte).

### Perguntas para a Rebeca

1. **Proficiências e idiomas: lista ou texto livre?** Recomendo um campo novo com etiquetas (chips) preenchidas pela classe, mais um texto livre "outras" para o que vier de raça, antecedente ou mesa. Começar só com texto livre pré-preenchido também serve, se quiser algo menor.
2. **PV máximo: o app aplica ou só sugere?** Recomendo só sugerir (média ou rolar, com botão "aplicar"). Não preencher sozinho, porque cada mesa faz de um jeito.
3. **Máximo dos espaços de magia segue a tabela sozinho?** Recomendo que sim, com o mesmo modelo das caixinhas (padrão + ajuste por cima). Só para classe conhecida com sistema "espaços"; ficha com "pontos" fica como está.
4. **CD e ataque de magia: calcular ou continuar campo?** Recomendo calcular na exibição (8 + PB + mod.) e mostrar no Grimório, com um ajuste manual (+1 de item). Os valores guardados hoje viram esse ajuste ou são ignorados.
5. **CA e deslocamento: preencher ou só dica?** Recomendo só dica por enquanto: CA depende de armadura e escudo, e o inventário ainda não liga com a CA. Junto, decidir a unidade do deslocamento (m ou ft).
6. **Escolhas (perícias, especialização, AVA, estilo de luta): onde perguntar?** Recomendo: perícias e ferramentas da classe no onboarding (#178); as escolhas de nível (especialização, AVA, estilos, invocações) como lembrete no level-up ("Novo no nível 4"), sem aplicar nada sozinho.

---

## EN

Map of what each **SRD 5.1 (D&D 2014)** class sets on the sheet beyond resources (#179): hit die, proficiencies, saving throws, skill choices, spellcasting and the per-level features that **change a number or a field**. Table-only features are left out. 2014 rules only, nothing from SRD 5.2.

**Sources.** Hit die, proficiencies, saves, skills, casting ability and caster type, and the feature list per level were checked against `content/dnd5e/srd-5.1/classes.json`. Portuguese names come from `i18n/pt/classes.json` and `messages/pt.json` and are provisional. Anything **not in `classes.json`** (spell slot tables, cantrips/spells known, Martial Arts die, Sneak Attack, Unarmored Movement) comes from the SRD 5.1 text and is marked **(conferir)** = to verify.

The PT tables above are shared; their columns read: *Campo* = field, *Valor* = value, *Nv* = level, *Característica* = feature, *Campo que muda* = field it changes. Short summary:

| Class (SRD subclass) | Hit die | Saves | Armor | Weapons | Tools | Skills | Casting |
|---|---|---|---|---|---|---|---|
| Barbarian (Berserker) | d12 | STR, CON | light, medium, shield | simple, martial | — | 2 of 6 | — |
| Bard (Lore) | d8 | DEX, CHA | light | simple, hand crossbow, longsword, rapier, shortsword | 3 instruments | any 3 | CHA, full |
| Cleric (Life) | d8 | WIS, CHA | light, medium, shield (+heavy from Life) | simple | — | 2 of 5 | WIS, full |
| Druid (Land) | d8 | INT, WIS | light, medium, shield (no metal: not in data) | club, dagger, dart, javelin, mace, quarterstaff, scimitar, sickle, sling, spear | herbalism kit | 2 of 8 | WIS, full |
| Fighter (Champion) | d10 | STR, CON | all, shield | simple, martial | — | 2 of 8 | — |
| Monk (Open Hand) | d8 | STR, DEX | — | simple, shortsword | 1 artisan's tool or instrument | 2 of 6 | — |
| Paladin (Devotion) | d10 | WIS, CHA | all, shield | simple, martial | — | 2 of 6 | CHA, half |
| Ranger (Hunter) | d10 | STR, DEX | light, medium, shield | simple, martial | — | 3 of 8 | WIS, half |
| Rogue (Thief) | d8 | DEX, INT | light | simple, hand crossbow, longsword, rapier, shortsword | thieves' tools | 4 of 11 | — |
| Sorcerer (Draconic) | d6 | CON, CHA | — | dagger, dart, sling, quarterstaff, light crossbow | — | 2 of 6 | CHA, full |
| Warlock (Fiend) | d8 | WIS, CHA | light | simple | — | 2 of 7 | CHA, pact |
| Wizard (Evocation) | d6 | INT, WIS | — | dagger, dart, sling, quarterstaff, light crossbow | — | 2 of 6 | INT, full |

**Sheet-changing features** (details in the PT tables): ASI at 4/8/12/16/19 (fighter also 6, 14; rogue also 10). Unarmored Defense (barbarian 10+DEX+CON, monk 10+DEX+WIS, no shield), Draconic Resilience (13+DEX AC, +1 HP per level). Fast Movement (+10 ft), Unarmored Movement (+10 to +30 ft, conferir). Extra Attack at 5 (fighter 3 at 11, 4 at 20). Expertise (bard 3, 10; rogue 1, 6). Jack of All Trades and Remarkable Athlete (half proficiency, also initiative), Feral Instinct (advantage on initiative). Diamond Soul (all saves), Slippery Mind (WIS save), Aura of Protection (+CHA to saves). Life domain heavy armor, Lore +3 skills. Champion crit range 19–20 / 18–20. Primal Champion STR/CON +4. Languages from Druidic, Thieves' Cant, Favored Enemy, Tongue of the Sun and Moon. Resistances and immunities from Purity of Body, Divine Health, Fiendish Resilience, Elemental Affinity.

**Spell slots** (conferir, not in data): full-caster table above; half casters have nothing at 1, then the full-caster row for ceil(level/2). Pact slots are already a resource in `classes.json`.

**Auto-fill vs suggest — PROPOSAL.** Following #177: an official class + level + edition give the default; player edits win and survive level-up; unknown class or multiclass = manual. Fills in: hit dice, class saving throws at creation, armor/weapon/tool proficiencies and class languages (new field), casting ability, slot system for casters, slot maxima from the table (default + override, like the boxes), derived spell DC/attack with a manual adjustment. Suggests: HP max (average or roll, never overwrite), skill and tool choices, expertise, extra saves from later features, AC and speed formulas, initiative bonuses, spells known/prepared counts, ASI and other level choices. Shows read-only: attacks per action, crit range, Sneak Attack/Martial Arts/rage numbers. Manual: resistances and immunities.

**Gaps today.** The model (`DnD5eCharacter.ts`, `characters.schemas.ts`, `shared/systems/dnd5e/types.ts`) has level, class/subclass matching, edition, hit dice (kept on level-up by `setLevel`), saving throw and skill/expertise flags, slot/point systems with manual slot maxima, resources with overrides, and manual AC/speed/initiative. `spellcastingAbility`, `spellSaveDc` and `spellAttackBonus` are stored but **not shown anywhere** (only the demo fills them). Missing: armor/weapon/tool proficiencies and languages; slot and spells-known tables in content; class tables (Martial Arts, Sneak Attack, Unarmored Movement); a content API exposing more than `hitDie` + resources; "SRD default vs player edit" outside resource boxes; a class features section; a creation flow beyond name + system; half-proficiency in `calculateSkillValue`; resistances/immunities/extra speeds; and a consistent speed unit (label "m", default 30).

**Questions for Rebeca** (recommendation in brackets):
1. Proficiencies and languages: tags or free text? [tags filled by the class + a free "other" text]
2. HP max: apply or suggest? [suggest, with an apply button]
3. Slot maxima follow the table automatically? [yes, default + override like the boxes, only for known classes on "slots"]
4. Spell DC/attack: derive or keep stored? [derive, show in the Grimoire, with a manual adjustment]
5. AC and speed: fill in or hint? [hint for now; decide the speed unit]
6. Where to ask for choices? [class skills/tools in onboarding #178; level choices as level-up reminders, nothing applied by itself]
