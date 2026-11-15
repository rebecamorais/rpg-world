# O que a classe muda na ficha — SRD 5.1 / What the class changes on the sheet — SRD 5.1

> **Mapa de planejamento (#181).** Tudo marcado **PROPOSTA** é sugestão, não decisão. **Aprovadas pela Rebeca em 2026-11-15:** as decisões 1, 2, 7 e 9 (Fase 1) e 3, 8 e 10 (Fase 3); ver "Decisões". As outras seis continuam pendentes.
> Base das fichas base / onboarding (#178). Complementa o mapa de recursos (#179) e segue as decisões da #177.
> O destino de cada característica (automático, escolha, informativo, fora do escopo) e as fases de implementação estão na [matriz de cobertura](class-sheet-coverage.md).
> Revisado em 2026-11-15 contra o PDF oficial do SRD 5.1 e o código (ver "Revisão de 2026-11-15" no fim da parte em português).
>
> **Planning map (#181).** Everything marked **PROPOSAL** is a suggestion, not a decision. **Approved by Rebeca on 2026-11-15:** decisions 1, 2, 7 and 9 (Phase 1) and 3, 8 and 10 (Phase 3). The other six are still pending. Per-feature destinations and implementation phases are in the [coverage matrix](class-sheet-coverage.md).

## PT

Mapa do que cada classe do **SRD 5.1 (D&D 2014)** define na ficha além dos recursos (#179): dado de vida, proficiências, salvaguardas, perícias à escolha, conjuração e as características por nível que **mudam um número ou um campo**. Características só de mesa ("você pode fazer X uma vez por turno") ficam de fora. Só regras de 2014; nada do SRD 5.2 (2024).

**De onde vêm os números.** Dado de vida, proficiências, salvaguardas, perícias, atributo e tipo de conjurador e a lista de características por nível foram conferidos em `content/dnd5e/srd-5.1/classes.json`. Os nomes em português vêm de `content/dnd5e/srd-5.1/i18n/pt/classes.json` e `messages/pt.json`, e são **provisórios** (a tradução final vem pelo Weblate). As tabelas de espaços de magia, truques e magias conhecidas, dado de Artes Marciais, Ataque Furtivo, Movimento sem Armadura e dano de fúria **não estavam nos dados** quando este mapa foi escrito: os números daqui vieram do texto do SRD 5.1 e foram **conferidos em 2026-11-15** contra o [PDF oficial do SRD 5.1 (CC BY 4.0)](https://media.wizards.com/2023/downloads/dnd/SRD_CC_v5.1.pdf). Esses números continuam fora dos dados do app.

**Ids, não nomes.** Classe, subclasse, característica, armadura, arma e ferramenta já têm `id` estável no `classes.json` (`bard`, `life`, `jack-of-all-trades`, `light`, `hand-crossbow`, `thieves-tools`). A ficha deve guardar o `id`; o nome traduzido é só da interface. Idiomas ainda não têm `id` nem lista (ver Lacunas).

Legenda: **PB** = bônus de proficiência; **mod** = modificador; **nv** = nível de classe; pés (ft) como no SRD (9 m = 30 ft).

### Comum a todas as classes

| Campo                              | Regra                                                                                                                                          |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Bônus de proficiência              | +2 (nv 1–4), +3 (5–8), +4 (9–12), +5 (13–16), +6 (17–20). Já calculado em `shared/systems/dnd5e/calculations.ts`.                              |
| Dados de vida                      | `nv` dados do tipo da classe (ex.: 5d10). A classe define só o **tipo** do dado; a quantidade é sempre o nível.                                |
| PV máximo                          | nv 1: máximo do dado + mod. CON (sem escolha). Cada nível depois: rolar o dado ou a média fixa (d6 → 4, d8 → 5, d10 → 6, d12 → 7) + mod. CON.  |
| Mudança do mod. CON                | O PV máximo muda **como se o novo modificador valesse desde o nv 1**: ±1 por nível já alcançado (ex.: CON 17 → 18 no nv 8 dá +8 PV).           |
| Aumento no Valor de Atributo (AVA) | +2 em um atributo ou +1 em dois (máximo 20), ou um talento se a mesa usa. Níveis 4, 8, 12, 16, 19 (guerreiro e ladino têm extras, ver abaixo). |
| Perícias                           | A classe dá **N à escolha** de uma lista. Antecedente e raça dão outras (fora deste mapa).                                                     |

### Tabelas de espaços de magia

O `classes.json` diz o **tipo** (`spellcasting.progression`: `full`, `half`, `pact`) e, desde a fase 2, a tabela está em `shared/systems/dnd5e/class-progression.ts` (`slotMaximums`), conferida pelo importador contra a tabela de cada classe. Abaixo, do SRD 5.1 (conferida com as tabelas de Bardo, Clérigo, Druida, Feiticeiro, Mago, Paladino, Patrulheiro e Bruxo).

**Conjurador completo** (bardo, clérigo, druida, feiticeiro, mago). Espaços por círculo 1º–9º:

| Nv    | 1º  | 2º  | 3º  | 4º  | 5º  | 6º  | 7º  | 8º  | 9º  |
| ----- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1     | 2   |     |     |     |     |     |     |     |     |
| 2     | 3   |     |     |     |     |     |     |     |     |
| 3     | 4   | 2   |     |     |     |     |     |     |     |
| 4     | 4   | 3   |     |     |     |     |     |     |     |
| 5     | 4   | 3   | 2   |     |     |     |     |     |     |
| 6     | 4   | 3   | 3   |     |     |     |     |     |     |
| 7     | 4   | 3   | 3   | 1   |     |     |     |     |     |
| 8     | 4   | 3   | 3   | 2   |     |     |     |     |     |
| 9     | 4   | 3   | 3   | 3   | 1   |     |     |     |     |
| 10    | 4   | 3   | 3   | 3   | 2   |     |     |     |     |
| 11–12 | 4   | 3   | 3   | 3   | 2   | 1   |     |     |     |
| 13–14 | 4   | 3   | 3   | 3   | 2   | 1   | 1   |     |     |
| 15–16 | 4   | 3   | 3   | 3   | 2   | 1   | 1   | 1   |     |
| 17    | 4   | 3   | 3   | 3   | 2   | 1   | 1   | 1   | 1   |
| 18    | 4   | 3   | 3   | 3   | 3   | 1   | 1   | 1   | 1   |
| 19    | 4   | 3   | 3   | 3   | 3   | 2   | 1   | 1   | 1   |
| 20    | 4   | 3   | 3   | 3   | 3   | 2   | 2   | 1   | 1   |

**Meio conjurador** (paladino, patrulheiro): **nenhum espaço no nv 1**; do nv 2 em diante é a linha do conjurador completo no nível **metade do nv, arredondado pra cima** (nv 2 → linha 1 = 2 espaços de 1º; nv 5 → linha 3 = 4/2; nv 17 → linha 9 = 4/3/3/3/1; máximo 5º círculo).

**Magia de Pacto** (bruxo): os números estão no `classes.json` como recurso `pact-slots` (#179): 1 (nv 1) · 2 (nv 2) · 3 (nv 11) · 4 (nv 17), todos no mesmo círculo: 1º (nv 1), 2º (nv 3), 3º (nv 5), 4º (nv 7), 5º (nv 9). Voltam no DC ou DL. **Mas a ficha não usa esse dado para montar nada:** `listResourceBoxes` pula todo recurso com `unit: 'spell-slots'`, então não há caixinha de pacto. Hoje o bruxo anota os espaços à mão em `spellSlots`, junto dos espaços comuns, e o recurso só serve para o lembrete do descanso curto (`hasPactSlots` em `RestChecklist.tsx`). Arcana Mística 6º–9º, essas sim, são caixinhas. Ver a decisão 5.

**Truques e magias: quatro contagens diferentes.** Desde a fase 2 estão no `classes.json` (`spellcasting.cantrips`, `spellsKnown`, `prepared`, `spellbook`) e são calculadas por `spellCounts`.

- **Truques conhecidos:** pela tabela da classe.
- **Magias conhecidas** (bardo, feiticeiro, bruxo, patrulheiro): número fixo pela tabela; troca uma ao subir de nível.
- **Magias preparadas** (clérigo, druida, paladino, mago): mod. + nível, escolhidas a cada descanso longo. Clérigo, druida e paladino preparam da lista inteira da classe; o **mago prepara só do que está no grimório dele**.
- **Fontes adicionais:** magias que a subclasse ou uma característica dá e que **não contam** no limite.

| Classe      | Truques (nv 1 / 4 / 10)                    | Conhecidas ou preparadas                                                                                                                                                                         | Fontes adicionais (fora do limite)                                     |
| ----------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| Bardo       | 2 / 3 / 4                                  | conhecidas: 4, 5, 6, 7, 8, 9, 10, 11, 12 (nv 1–9) · 14 (10) · 15 (11–12) · 16 (13) · 18 (14) · 19 (15–16) · 20 (17) · 22 (18–20). Os Segredos Mágicos de 10, 14 e 18 **já estão** nesses números | Segredos Mágicos Adicionais (Conhecimento, nv 6): 2 magias             |
| Clérigo     | 3 / 4 / 5                                  | preparadas: mod. SAB + nv (mín. 1)                                                                                                                                                               | magias de domínio, sempre preparadas                                   |
| Druida      | 2 / 3 / 4 (+1 do Círculo da Terra no nv 2) | preparadas: mod. SAB + nv (mín. 1)                                                                                                                                                               | magias de círculo, pelo terreno escolhido                              |
| Feiticeiro  | 4 / 5 / 6                                  | conhecidas: 2, 3, 4, 5, 6, 7, 8, 9, 10, 11 (nv 1–10) · 12 (11–12) · 13 (13–14) · 14 (15–16) · 15 (17–20)                                                                                         | —                                                                      |
| Bruxo       | 2 / 3 / 4                                  | conhecidas: 2, 3, 4, 5, 6, 7, 8, 9, 10 (nv 1–9) · 10 (10) · 11 (11–12) · 12 (13–14) · 13 (15–16) · 14 (17–18) · 15 (19–20)                                                                       | Arcana Mística (1 magia de 6º, 7º, 8º e 9º); Pacto do Tomo (3 truques) |
| Mago        | 3 / 4 / 5                                  | preparadas: mod. INT + nv (mín. 1), **escolhidas do grimório**. Grimório: 6 magias no nv 1, +2 por nível, mais as que copiar                                                                     | Magias Assinatura (nv 20): 2 de 3º sempre preparadas                   |
| Paladino    | —                                          | preparadas: mod. CAR + metade do nv (arred. pra baixo, mín. 1), a partir do nv 2                                                                                                                 | magias de juramento, sempre preparadas                                 |
| Patrulheiro | —                                          | conhecidas: 2 (nv 2) · 3 (3–4) · 4 (5–6) · 5 (7–8) · 6 (9–10) · 7 (11–12) · 8 (13–14) · 9 (15–16) · 10 (17–18) · 11 (19–20)                                                                      | —                                                                      |

### Bárbaro (Trilha do Berserker)

| Campo        | Valor                                                                                |
| ------------ | ------------------------------------------------------------------------------------ |
| Dado de vida | d12 (PV nv 1: 12 + CON)                                                              |
| Salvaguardas | FOR, CON                                                                             |
| Armaduras    | leves, médias, escudos                                                               |
| Armas        | simples, marciais                                                                    |
| Ferramentas  | —                                                                                    |
| Perícias     | 2 entre Adestrar Animais, Atletismo, Intimidação, Natureza, Percepção, Sobrevivência |
| Conjuração   | nenhuma                                                                              |

| Nv               | Característica       | Campo que muda                                                    |
| ---------------- | -------------------- | ----------------------------------------------------------------- |
| 1                | Defesa sem Armadura  | **CA** = 10 + mod. DES + mod. CON sem armadura (escudo vale)      |
| 1                | Fúria                | dano de fúria +2/+3 (nv 9)/+4 (nv 16) (recurso na #179)           |
| 4, 8, 12, 16, 19 | AVA                  | atributos                                                         |
| 5                | Ataque Extra         | 2 ataques por ação                                                |
| 5                | Movimento Rápido     | **deslocamento** +10 ft sem armadura pesada                       |
| 7                | Instintos Primitivos | vantagem em **iniciativa**                                        |
| 9 / 13 / 17      | Crítico Brutal       | +1 / +2 / +3 dados no crítico corpo a corpo                       |
| 18               | Força Indomável      | teste de FOR nunca abaixo do valor de FOR                         |
| 20               | Campeão Primitivo    | **FOR e CON +4** (máx. 24) → muda PV máximo, CA sem armadura etc. |

Berserker: nada que mude campo (Frenesi dá exaustão; ver #179).

### Bardo (Colégio do Conhecimento)

| Campo        | Valor                                                       |
| ------------ | ----------------------------------------------------------- |
| Dado de vida | d8                                                          |
| Salvaguardas | DES, CAR                                                    |
| Armaduras    | leves                                                       |
| Armas        | simples, besta de mão, espada longa, rapieira, espada curta |
| Ferramentas  | 3 instrumentos musicais à escolha                           |
| Perícias     | **3 quaisquer** (as 18)                                     |
| Conjuração   | CAR · completo                                              |

| Nv               | Característica                            | Campo que muda                                                                                                                                                                                                               |
| ---------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2                | Pau pra Toda Obra                         | +metade do PB (arred. pra baixo) em **qualquer teste de atributo que ainda não inclua o PB** → perícias sem proficiência, teste puro de atributo e **iniciativa** (é um teste de DES). Não vale em salvaguarda nem em ataque |
| 2 / 9 / 13 / 17  | Canção do Descanso                        | d6 / d8 / d10 / d12 extra ao gastar dados de vida no DC                                                                                                                                                                      |
| 3, 10            | Especialização                            | **2 perícias** com proficiência ganham PB dobrado (cada vez)                                                                                                                                                                 |
| 3                | Conhecimento: Proficiências Adicionais    | **+3 perícias** à escolha                                                                                                                                                                                                    |
| 4, 8, 12, 16, 19 | AVA                                       | atributos                                                                                                                                                                                                                    |
| 5 / 10 / 15      | Inspiração de Bardo                       | dado d8 / d10 / d12 (recurso na #179)                                                                                                                                                                                        |
| 6                | Conhecimento: Segredos Mágicos Adicionais | +2 magias de qualquer lista, que **não contam** nas conhecidas                                                                                                                                                               |
| 10, 14, 18       | Segredos Mágicos                          | +2 magias de qualquer lista, que **já estão** na coluna de conhecidas da tabela                                                                                                                                              |

### Clérigo (Domínio da Vida)

| Campo        | Valor                                                       |
| ------------ | ----------------------------------------------------------- |
| Dado de vida | d8                                                          |
| Salvaguardas | SAB, CAR                                                    |
| Armaduras    | leves, médias, escudos (+ **pesadas** pelo Domínio da Vida) |
| Armas        | simples                                                     |
| Ferramentas  | —                                                           |
| Perícias     | 2 entre História, Intuição, Medicina, Persuasão, Religião   |
| Conjuração   | SAB · completo (preparadas)                                 |

| Nv                   | Característica                          | Campo que muda                                                                                                                                                                                                             |
| -------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1                    | Domínio da Vida: Proficiência Adicional | **armaduras pesadas**                                                                                                                                                                                                      |
| 1                    | Domínio da Vida: Discípulo da Vida      | cura de magias +2 + círculo (informativo)                                                                                                                                                                                  |
| 1, 3, 5, 7, 9        | Magias de domínio (Vida)                | sempre preparadas, não contam no limite: _bless, cure wounds_ (1) · _lesser restoration, spiritual weapon_ (3) · _beacon of hope, revivify_ (5) · _death ward, guardian of faith_ (7) · _mass cure wounds, raise dead_ (9) |
| 4, 8, 12, 16, 19     | AVA                                     | atributos                                                                                                                                                                                                                  |
| 5 / 8 / 11 / 14 / 17 | Destruir Mortos-Vivos                   | ND ½ / 1 / 2 / 3 / 4                                                                                                                                                                                                       |
| 8                    | Golpe Divino                            | +1d8 radiante 1×/turno em arma; 2d8 no nv 14                                                                                                                                                                               |

### Druida (Círculo da Terra)

| Campo        | Valor                                                                                                                                           |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Dado de vida | d8                                                                                                                                              |
| Salvaguardas | INT, SAB                                                                                                                                        |
| Armaduras    | leves, médias, escudos. O SRD acrescenta: druidas não usam armadura nem escudo de metal (o `classes.json` não guarda essa restrição; vira nota) |
| Armas        | clava, adaga, dardo, azagaia, maça, bordão, cimitarra, foice, funda, lança                                                                      |
| Ferramentas  | kit de herbalismo                                                                                                                               |
| Perícias     | 2 entre Arcanismo, Adestrar Animais, Intuição, Medicina, Natureza, Percepção, Religião, Sobrevivência                                           |
| Conjuração   | SAB · completo (preparadas)                                                                                                                     |

| Nv               | Característica                     | Campo que muda                                                                                                                                                          |
| ---------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1                | Druídico                           | **idioma** secreto                                                                                                                                                      |
| 2                | Círculo da Terra: Truque Adicional | +1 truque                                                                                                                                                               |
| 3, 5, 7, 9       | Magias de círculo                  | **escolha do terreno** (ártico, costa, deserto, floresta, pradaria, montanha, pântano); as 2 magias do terreno por nível ficam sempre preparadas e não contam no limite |
| 4, 8, 12, 16, 19 | AVA                                | atributos                                                                                                                                                               |
| 2 / 4 / 8        | Forma Selvagem                     | ND máx. ¼ / ½ / 1 (recurso na #179)                                                                                                                                     |

Caminho da Floresta (6), Proteção Natural (10: imune a veneno e doença; não pode ser amedrontado nem enfeitiçado por elementais e fadas), Santuário Natural (14): sem campo hoje (imunidades, ver Lacunas).

### Guerreiro (Campeão)

| Campo        | Valor                                                                                                     |
| ------------ | --------------------------------------------------------------------------------------------------------- |
| Dado de vida | d10                                                                                                       |
| Salvaguardas | FOR, CON                                                                                                  |
| Armaduras    | todas, escudos                                                                                            |
| Armas        | simples, marciais                                                                                         |
| Ferramentas  | —                                                                                                         |
| Perícias     | 2 entre Acrobacia, Adestrar Animais, Atletismo, História, Intuição, Intimidação, Percepção, Sobrevivência |
| Conjuração   | nenhuma                                                                                                   |

| Nv                              | Característica              | Campo que muda                                                                                                                                                                                                          |
| ------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1                               | Estilo de Luta (escolha)    | ex.: Defesa = **CA +1** com armadura; Arquearia +2 em ataque à distância                                                                                                                                                |
| 4, **6**, 8, 12, **14**, 16, 19 | AVA                         | atributos (7 vezes)                                                                                                                                                                                                     |
| 5 / 11 / 20                     | Ataque Extra                | **2 / 3 / 4 ataques**                                                                                                                                                                                                   |
| 3                               | Campeão: Crítico Aprimorado | crítico em **19–20**                                                                                                                                                                                                    |
| 7                               | Atleta Extraordinário       | +metade do PB (arred. **pra cima**) em testes de **FOR, DES ou CON** que ainda não usem o PB → perícias sem proficiência desses atributos, teste puro e **iniciativa**. Não vale em INT/SAB/CAR, salvaguarda nem ataque |
| 10                              | Estilo de Luta Adicional    | outra escolha                                                                                                                                                                                                           |
| 15                              | Crítico Superior            | crítico em **18–20**                                                                                                                                                                                                    |
| 18                              | Sobrevivente                | recupera 5 + CON PV por turno abaixo da metade (informativo)                                                                                                                                                            |

### Monge (Caminho da Mão Espalmada)

| Campo        | Valor                                                                   |
| ------------ | ----------------------------------------------------------------------- |
| Dado de vida | d8                                                                      |
| Salvaguardas | FOR, DES                                                                |
| Armaduras    | —                                                                       |
| Armas        | simples, espada curta                                                   |
| Ferramentas  | 1 ferramenta de artesão **ou** 1 instrumento musical                    |
| Perícias     | 2 entre Acrobacia, Atletismo, História, Intuição, Religião, Furtividade |
| Conjuração   | nenhuma (CD do Ki = 8 + PB + mod. SAB)                                  |

| Nv               | Característica         | Campo que muda                                                                                                                                                             |
| ---------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1                | Defesa sem Armadura    | **CA** = 10 + mod. DES + mod. SAB, sem armadura e **sem escudo**                                                                                                           |
| 1                | Artes Marciais         | dado d4 (nv 1) / d6 (5) / d8 (11) / d10 (17); DES no lugar de FOR                                                                                                          |
| 2                | Movimento sem Armadura | **deslocamento** +10 ft (nv 2) / +15 (6) / +20 (10) / +25 (14) / +30 (18), **sem armadura e sem escudo**                                                                   |
| 4, 8, 12, 16, 19 | AVA                    | atributos                                                                                                                                                                  |
| 5                | Ataque Extra           | 2 ataques                                                                                                                                                                  |
| 10               | Pureza do Corpo        | imune a doença e veneno                                                                                                                                                    |
| 13               | Idioma do Sol e da Lua | entende todo idioma **falado**, e quem entende algum idioma entende o que ela diz. **Não é proficiência em idiomas:** não lê nem escreve, e nada entra na lista de idiomas |
| 14               | Alma de Diamante       | proficiência em **todas as salvaguardas**                                                                                                                                  |

Mão Espalmada: nada que mude campo (Integridade Corporal é recurso, #179). Na #179 o nome era "Mão Aberta"; o arquivo de tradução diz "Mão Espalmada".

### Paladino (Juramento da Devoção)

| Campo        | Valor                                                                   |
| ------------ | ----------------------------------------------------------------------- |
| Dado de vida | d10                                                                     |
| Salvaguardas | SAB, CAR                                                                |
| Armaduras    | todas, escudos                                                          |
| Armas        | simples, marciais                                                       |
| Ferramentas  | —                                                                       |
| Perícias     | 2 entre Atletismo, Intuição, Intimidação, Medicina, Persuasão, Religião |
| Conjuração   | CAR · meio (a partir do nv 2, preparadas)                               |

| Nv               | Característica                | Campo que muda                                                                                                                                                                                                                                        |
| ---------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2                | Estilo de Luta (escolha)      | ex.: Defesa **CA +1**                                                                                                                                                                                                                                 |
| 3                | Saúde Divina                  | imune a doença                                                                                                                                                                                                                                        |
| 3, 5, 9, 13, 17  | Magias de juramento (Devoção) | sempre preparadas, não contam no limite: _protection from evil and good, sanctuary_ (3) · _lesser restoration, zone of truth_ (5) · _beacon of hope, dispel magic_ (9) · _freedom of movement, guardian of faith_ (13) · _commune, flame strike_ (17) |
| 4, 8, 12, 16, 19 | AVA                           | atributos                                                                                                                                                                                                                                             |
| 5                | Ataque Extra                  | 2 ataques                                                                                                                                                                                                                                             |
| 6                | Aura de Proteção              | **+mod. CAR (mín. +1) em todas as salvaguardas** dela enquanto consciente (e aliados a 10 ft / 3 m; 30 ft / 9 m no nv 18). É um bônus somado, não proficiência                                                                                        |
| 10               | Aura de Coragem               | imune a amedrontado                                                                                                                                                                                                                                   |
| 11               | Destruição Divina Aprimorada  | +1d8 radiante em todo ataque corpo a corpo                                                                                                                                                                                                            |

Devoção: Aura de Devoção (nv 7, imune a enfeitiçado) e Pureza de Espírito (15) são imunidades e efeitos sem campo hoje, como Saúde Divina e Aura de Coragem. O resto são recursos (#179).

### Patrulheiro (Caçador)

| Campo        | Valor                                                                                                        |
| ------------ | ------------------------------------------------------------------------------------------------------------ |
| Dado de vida | d10                                                                                                          |
| Salvaguardas | FOR, DES                                                                                                     |
| Armaduras    | leves, médias, escudos                                                                                       |
| Armas        | simples, marciais                                                                                            |
| Ferramentas  | —                                                                                                            |
| Perícias     | 3 entre Adestrar Animais, Atletismo, Intuição, Investigação, Natureza, Percepção, Furtividade, Sobrevivência |
| Conjuração   | SAB · meio (a partir do nv 2, conhecidas)                                                                    |

| Nv               | Característica             | Campo que muda                                                                                                                                                                                                                        |
| ---------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1                | Inimigo Favorito (escolha) | escolhe um tipo de inimigo (ou 2 raças humanoides). Aprende 1 **idioma** à escolha falado pelos inimigos favoritos, **se eles falarem algum**: não é idioma garantido. Outro inimigo (e outro idioma, na mesma condição) no nv 6 e 14 |
| 1                | Explorador Natural         | PB dobrado em testes de INT/SAB no terreno favorito (situacional)                                                                                                                                                                     |
| 2                | Estilo de Luta (escolha)   | ex.: Defesa **CA +1**, Arquearia                                                                                                                                                                                                      |
| 4, 8, 12, 16, 19 | AVA                        | atributos                                                                                                                                                                                                                             |
| 5                | Ataque Extra               | 2 ataques                                                                                                                                                                                                                             |

Caçador: escolhas de combate (nv 3, 7, 11, 15) sem campo; viram texto.

### Ladino (Ladrão)

| Campo        | Valor                                                                                                                                         |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Dado de vida | d8                                                                                                                                            |
| Salvaguardas | DES, INT                                                                                                                                      |
| Armaduras    | leves                                                                                                                                         |
| Armas        | simples, besta de mão, espada longa, rapieira, espada curta                                                                                   |
| Ferramentas  | ferramentas de ladrão                                                                                                                         |
| Perícias     | **4** entre Acrobacia, Atletismo, Enganação, Intuição, Intimidação, Investigação, Percepção, Atuação, Persuasão, Prestidigitação, Furtividade |
| Conjuração   | nenhuma                                                                                                                                       |

| Nv                       | Característica     | Campo que muda                                                                 |
| ------------------------ | ------------------ | ------------------------------------------------------------------------------ |
| 1, 6                     | Especialização     | **2 perícias** (ou 1 perícia + ferramentas de ladrão) com PB dobrado, cada vez |
| 1                        | Ataque Furtivo     | 1d6, +1d6 a cada 2 níveis (nv ímpar): **metade do nv arred. pra cima** d6      |
| 1                        | Gíria do Ladrão    | **idioma**                                                                     |
| 4, 8, **10**, 12, 16, 19 | AVA                | atributos (6 vezes)                                                            |
| 11                       | Talento Confiável  | d20 < 10 vira 10 em perícia proficiente (informativo)                          |
| 15                       | Mente Escorregadia | proficiência em **salvaguarda de SAB**                                         |

Ladrão: Mãos Rápidas e Escalada (nv 3: escalar não custa movimento extra, não é deslocamento de escalada no 5.1) e Furtividade Suprema (9) não mudam campo.

### Feiticeiro (Linhagem Dracônica)

| Campo        | Valor                                                                    |
| ------------ | ------------------------------------------------------------------------ |
| Dado de vida | d6                                                                       |
| Salvaguardas | CON, CAR                                                                 |
| Armaduras    | —                                                                        |
| Armas        | adaga, dardo, funda, bordão, besta leve                                  |
| Ferramentas  | —                                                                        |
| Perícias     | 2 entre Arcanismo, Enganação, Intuição, Intimidação, Persuasão, Religião |
| Conjuração   | CAR · completo (conhecidas)                                              |

| Nv               | Característica                                     | Campo que muda                                                                |
| ---------------- | -------------------------------------------------- | ----------------------------------------------------------------------------- |
| 1                | Dracônica: Ancestral Dracônico (escolha)           | **idioma** Dracônico (fala, lê e escreve) + tipo de dano do dragão escolhido  |
| 1                | Dracônica: Resiliência Dracônica (nome provisório) | **PV máximo +1 por nível** de feiticeiro; **CA** = 13 + mod. DES sem armadura |
| 4, 8, 12, 16, 19 | AVA                                                | atributos                                                                     |
| 6                | Afinidade Elemental                                | +mod. CAR no dano do tipo; pode gastar 1 pt para **resistência** por 1 h      |
| 14               | Asas de Dragão                                     | **deslocamento de voo** = deslocamento                                        |

### Bruxo (O Ínfero)

| Campo        | Valor                                                                                 |
| ------------ | ------------------------------------------------------------------------------------- |
| Dado de vida | d8                                                                                    |
| Salvaguardas | SAB, CAR                                                                              |
| Armaduras    | leves                                                                                 |
| Armas        | simples                                                                               |
| Ferramentas  | —                                                                                     |
| Perícias     | 2 entre Arcanismo, Enganação, História, Intimidação, Investigação, Natureza, Religião |
| Conjuração   | CAR · pacto (conhecidas)                                                              |

| Nv               | Característica                | Campo que muda                                                                                                                                   |
| ---------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1                | Magia de Pacto                | espaços de pacto (recurso, #179)                                                                                                                 |
| 2                | Invocações Místicas (escolha) | 2 (nv 2) · 3 (5) · 4 (7) · 5 (9) · 6 (12) · 7 (15) · 8 (18) — no `classes.json`. Algumas mudam campo (ex.: Armadura das Sombras, Visão do Diabo) |
| 3                | Dádiva do Pacto (escolha)     | Lâmina / Corrente / Tomo (Tomo dá 3 truques extras)                                                                                              |
| 4, 8, 12, 16, 19 | AVA                           | atributos                                                                                                                                        |
| 1                | Ínfero: Bênção do Obscuro     | PV temporários = mod. CAR + nv ao derrubar inimigo (informativo)                                                                                 |
| 10               | Resistência Ínfera            | **resistência** a um tipo de dano, troca a cada descanso                                                                                         |

Na #179 o patrono era "O Corruptor"; o arquivo de tradução diz "O Ínfero".

### Mago (Escola de Evocação)

| Campo        | Valor                                                                   |
| ------------ | ----------------------------------------------------------------------- |
| Dado de vida | d6                                                                      |
| Salvaguardas | INT, SAB                                                                |
| Armaduras    | —                                                                       |
| Armas        | adaga, dardo, funda, bordão, besta leve                                 |
| Ferramentas  | —                                                                       |
| Perícias     | 2 entre Arcanismo, História, Intuição, Investigação, Medicina, Religião |
| Conjuração   | INT · completo (preparadas do grimório)                                 |

| Nv               | Característica          | Campo que muda                            |
| ---------------- | ----------------------- | ----------------------------------------- |
| 4, 8, 12, 16, 19 | AVA                     | atributos                                 |
| 10               | Evocação Potencializada | +mod. INT no dano de magias de evocação   |
| 18               | Maestria de Magias      | 1 magia de 1º e 1 de 2º sem gastar espaço |
| 20               | Magias Assinatura       | recurso (#179)                            |

### O que a ficha preenche sozinha vs. só sugere — PROPOSTA

Princípio (igual à #177): **classe oficial + nível + edição dão o ponto de partida**; o que a pessoa mudar fica por cima e **sobrevive ao subir de nível**; **classe desconhecida = tudo manual** (a ficha de hoje); **multiclasse = manual** por enquanto.

**Só a ficha com edição 2014 escolhida recebe o que está neste mapa.** Ficha sem edição (antiga, ainda no cartão "Novo: recursos de classe" da #177) ou com edição 2024 não recebe nenhum padrão de 2014: fica manual até existir um mapa do SRD 5.2. Atenção ao código: `editionSource(undefined)` cai em `srd-5.1`, mas `useClassResources` só busca conteúdo quando há edição. O motor novo deve seguir o segundo e exigir `edition === '2014'`.

Três níveis:

- **Preenche**: o app escreve o valor padrão. Se a pessoa mudar, o valor dela vence, e subir de nível não apaga.
- **Sugere**: o app mostra o valor ou a escolha ("Bárbaro escolhe 2 destas") e a pessoa confirma ou marca. Nada muda sem um toque.
- **Manual**: o app não mexe.

| Campo                                                                             | Na criação (#178)                                                                     | Ao subir de nível                                                                                                                                | Por quê                                                                                                                                                                                                                               |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dado de vida (tipo)                                                               | **Preenche** o dado da classe                                                         | não muda (o dado é da classe, não do nível)                                                                                                      | A quantidade é sempre o nível e **não é guardada**: a ficha já mostra `<nv>d<dado>` e lê só o dado de `hitDice.total` (ver Lacunas). O checklist de descanso já usa o dado da classe como reserva (`RestChecklist.tsx`).              |
| Dados de vida restantes                                                           | **Preenche** (todos)                                                                  | **Calculados:** nível − dados gastos; o nível novo já chega disponível                                                                           | Hoje `setLevel` (`character-sheet-updates.ts`) regrava os restantes a cada mudança de nível, o que não é reversível. A proposta é salvar só os gastos (decisão 2).                                                                    |
| PV máximo                                                                         | **Preenche** máximo do dado + CON no nv 1, editável                                   | **Pendência** "rolar ou média (6) + CON"; um toque aplica                                                                                        | A #178 pede PV preenchido na criação, e no nv 1 a regra não tem escolha. Depois disso muitas mesas rolam: nunca sobrescrever. Mudança do mod. CON vira pendência "±1 por nível". Resiliência Dracônica (+1 por nível) entra na conta. |
| Bônus de proficiência                                                             | derivado (já é)                                                                       | derivado                                                                                                                                         | —                                                                                                                                                                                                                                     |
| Salvaguardas                                                                      | **Preenche** as 2 da classe                                                           | **Preenche** Alma de Diamante (monge 14) e Mente Escorregadia (ladino 15), **se o contrato de padrão + ajuste for aprovado**; sem ele, só sugere | Hoje é um booleano simples, que não sabe se ela desmarcou de propósito. Aura de Proteção (paladino 6) é um bônus somado à parte, que ela pode desligar.                                                                               |
| Meia proficiência                                                                 | —                                                                                     | **Preenche** nas perícias sem proficiência (Pau pra Toda Obra, Atleta Extraordinário)                                                            | As perícias já são calculadas na exibição. Vale para todo teste de atributo elegível, não só perícia: na iniciativa vira nota enquanto ela for número manual.                                                                         |
| Perícias da classe                                                                | **Sugere**: "escolha N" com a lista destacada                                         | **Sugere** perícias da subclasse (Conhecimento nv 3)                                                                                             | É escolha da pessoa.                                                                                                                                                                                                                  |
| Especialização                                                                    | —                                                                                     | **Sugere** no nv certo ("Escolha 2 perícias")                                                                                                    | Escolha.                                                                                                                                                                                                                              |
| Armaduras, armas, ferramentas                                                     | **Preenche** a lista da classe (+ pesadas para Vida)                                  | **Preenche** o que a subclasse der                                                                                                               | Fixo pela classe. Precisa de campo novo (ver Lacunas). Ferramentas à escolha (bardo, monge) = **sugere**.                                                                                                                             |
| Idiomas de classe                                                                 | **Preenche** Druídico, Gíria do Ladrão e Dracônico (Linhagem Dracônica)               | Inimigo Favorito: **escolha opcional** (só se o inimigo fala algum idioma). Idioma do Sol e da Lua: **nota**, não acrescenta idioma              | Campo novo.                                                                                                                                                                                                                           |
| Atributo de conjuração                                                            | **Preenche**                                                                          | —                                                                                                                                                | Fixo pela classe.                                                                                                                                                                                                                     |
| CD e ataque de magia                                                              | **derivado** (8 + PB + mod. / PB + mod.), com ajuste manual                           | derivado                                                                                                                                         | Hoje são números guardados e sem tela. Itens (+1/+2) entram como ajuste.                                                                                                                                                              |
| Sistema de magia                                                                  | **Preenche** "espaços" para conjuradores                                              | —                                                                                                                                                | Ficha existente com "pontos" não muda.                                                                                                                                                                                                |
| Máximo dos espaços de magia                                                       | **Preenche** pela tabela                                                              | **Preenche** pela tabela, sem apagar o máximo que ela mudou                                                                                      | Mesmo modelo das caixinhas (padrão + ajuste por cima). O número de espaços **usados** que está salvo nunca é reescrito por uma mudança de máximo; a tela mostra no máximo o que cabe.                                                 |
| Espaços de pacto (bruxo)                                                          | **Preenche** quantidade e círculo, com estado próprio                                 | **Preenche** pela tabela                                                                                                                         | Separados dos espaços comuns: voltam no descanso curto e, quando houver multiclasse, as duas reservas convivem. Hoje não são caixinha (decisão 5).                                                                                    |
| Truques, conhecidas, preparadas                                                   | **Mostra** contagens separadas no Grimório ("3 de 4 truques", "5 de 6 preparadas")    | **Mostra** atualizado                                                                                                                            | Referência, **nunca bloqueia** (homebrew). Fontes adicionais (domínio, círculo, juramento, Arcana Mística) aparecem marcadas e fora da conta. Mago: "no grimório" e "preparadas" são duas contagens.                                  |
| CA                                                                                | **Sugere** a fórmula da classe (Defesa sem Armadura, Resiliência Dracônica) como dica | **Sugere**                                                                                                                                       | Depende de armadura, escudo, itens e estilo de luta; o inventário ainda não liga com a CA.                                                                                                                                            |
| Deslocamento                                                                      | manual (vem da raça)                                                                  | **Sugere** "+10 ft / +3 m" (Movimento Rápido, Movimento sem Armadura)                                                                            | Depende da armadura e do escudo; a raça define a base. Só depois de decidir a unidade (decisão 7).                                                                                                                                    |
| Iniciativa                                                                        | manual (DES)                                                                          | **Sugere** Pau pra Toda Obra / Atleta Extraordinário; Instintos Primitivos vira nota                                                             | Hoje é número manual.                                                                                                                                                                                                                 |
| Ataques por ação, faixa de crítico, Ataque Furtivo, Artes Marciais, dado de fúria | **Mostra** numa linha de "números da classe" (só leitura)                             | **Mostra** atualizado                                                                                                                            | Não há campo; texto calculado basta.                                                                                                                                                                                                  |
| AVA                                                                               | —                                                                                     | **Sugere** lembrete "AVA neste nível"; atributos manuais                                                                                         | Escolha (ou talento).                                                                                                                                                                                                                 |
| Resistências e imunidades                                                         | manual                                                                                | manual (nota da característica)                                                                                                                  | Não há campo; escopo à parte.                                                                                                                                                                                                         |
| Estilo de Luta, Invocações, Metamagia, Dádiva do Pacto                            | **Sugere** a escolha                                                                  | **Sugere** no nv certo                                                                                                                           | Escolhas; já estão em `choices` no `classes.json`.                                                                                                                                                                                    |

### Lacunas no app hoje

O modelo da ficha está em `src/backend/contexts/characters/domain/entity/DnD5eCharacter.ts`, o contrato da API em `src/backend/contexts/characters/interfaces/characters.schemas.ts` (`characterUpdatesSchema`) e o tipo compartilhado em `shared/systems/dnd5e/types.ts`.

**Já tem:**

- `level`, `class` (id da lista ou texto livre, reconhecido por `matchCharacterClass` em `src/frontend/lib/character-choices.ts`), `subclass` (texto, reconhecido por `matchSubclass` em `shared/systems/dnd5e/class-resources.ts`), `edition`.
- `hitDice { total, current }` (`src/frontend/lib/character-sheet-updates.ts`). **`total` guarda só o dado, na prática:** o seletor da ficha grava sempre `1d<dado>` (`setHitDice`), a tela mostra `<nível><dado>` e `hitDieSides` lê só os lados. Fichas antigas podem ter `5d10` (o comentário no código diz "Totals used to be stored with the level"). `setLevel` ajusta só `current`, não reescreve `total`. Então uma ficha de nv 5 com `1d8` salvo está certa hoje, mas o campo tem dois formatos e um nome que engana.
- `savingThrowProficiencies` (booleano por atributo).
- `skills { isProficient, expertise }`, com o PB dobrado já calculado em `shared/systems/dnd5e/calculations.ts`.
- `spellcastingSystem` (`slots`/`points`), `spellSlots { max, used }` por círculo (o máximo é manual), `spellPoints`. **Os espaços de pacto do bruxo moram aqui também**, anotados à mão: o recurso `pact-slots` do `classes.json` é pulado por `listResourceBoxes` e por `ResourceBoxesEditor` (`unit: 'spell-slots'`) e só alimenta o lembrete `pactSlotsBack` do descanso curto (`src/frontend/lib/rest-checklist.ts`).
- **Magia preparada:** cada magia da ficha tem uma marca salva (`character_spells.is_prepared`, `togglePrepared`, botão no cartão da magia). Não há registro de onde a magia veio (classe, domínio, juramento).
- `spellcastingAbility`, `spellSaveDc`, `spellAttackBonus`: **guardados mas sem tela.** Só a demo preenche (`src/frontend/demo/data/build.ts`); nenhum componente da ficha mostra.
- `ac`, `speed`, `initiative`: números manuais (`src/frontend/components/character/stats/CombatStatsSection.tsx`).
- `resources` com padrão + `overrides` (#177/#180), o modelo a copiar para os espaços de magia.

**Entregue na fase 2 (dados, sem tela):** as tabelas de espaços de magia (completo e meio; o pacto já era um recurso), truques, magias conhecidas, a fórmula das preparadas e o grimório do mago; os números da tabela da classe em `tables` (dano de fúria, Artes Marciais, Movimento sem Armadura em pés, Ataque Furtivo); a meia proficiência (`getHalfProficiencyBonus`, `halfProficiencyAt`); e a API de conteúdo (`ClassContent`, rota `app/api/content/classes/route.ts`), que agora devolve proficiências, salvaguardas, perícias à escolha, conjuração, características (id, nível e nome), tabelas e escolhas. Nada disso é usado pela ficha ainda.

**Falta:**

- **Proficiências de armadura, arma e ferramenta** e **idiomas**: nenhum campo no modelo nem no schema. O `classes.json` já tem os dados de proficiência com `id` (`proficiencies.armor/weapons/tools/toolChoice`). **Idiomas não têm `id` nem lista em lugar nenhum**: Druídico, Gíria do Ladrão e Dracônico precisam de uma lista de idiomas do SRD para não virarem texto solto.
- **"Veio do SRD" vs. "a pessoa mudou"** fora das caixinhas: salvaguardas, perícias e espaços de magia são valores simples, sem padrão + ajuste. Sem isso, "preencher no level-up sem apagar" só funciona para as caixinhas.
- **Lista de características da classe na ficha**: não há aba nem seção (as abas são Status, Lore, Grimório, Inventário, Aparência).
- **Criação**: `src/frontend/components/character/NewCharacterForm.tsx` só pede nome e sistema; `createDnD5eCharacter` (`shared/systems/dnd5e/factory.ts`) cria tudo zerado (CA 10, deslocamento 30, sem salvaguardas).
- **Meia proficiência** (Pau pra Toda Obra, Atleta Extraordinário): `calculateSkillValue` só conhece "sem", "proficiente" e "especialista". E a regra é maior que essa função: vale para **todo teste de atributo sem PB**, o que inclui a iniciativa (número manual hoje) e o teste puro de atributo (a ficha não mostra). Atleta Extraordinário só em FOR/DES/CON e arredonda pra cima. `calculatePassivePerception` e `calculatePassiveInsight` também não conhecem meia proficiência (a decidir se devem).
- **Portão de edição**: nada no código impede hoje um padrão de 2014 de chegar a uma ficha sem edição, porque `editionSource(undefined)` devolve `srd-5.1`. As caixinhas só não aparecem porque `useClassResources` exige edição.
- **Resistências / imunidades / deslocamentos extras** (voo, escalada): sem campo.
- **Unidade do deslocamento**: a etiqueta é "m" em pt e em en (`messages/*.json`, `speedUnit`), o campo aceita decimais (`decimal` no `NumberInput`, para 1,5 m ou 4,5 m) e os testes e o combate usam 9, 7 e 6. Ou seja, **o app trata o número como metros**. Os únicos valores em pés são o padrão 30 de `factory.ts` (comentário "30ft") e as fichas da demo (`src/frontend/demo/data/sheets.ts`). Uma ficha nova nasce com "30 m". Ver a decisão 7.

### Contrato de valores: padrão, ajuste e estado — PROPOSTA

A #177 já decidiu, para as caixinhas, que "o valor guardado separa 'veio do SRD' de 'a pessoa mudou'". Esta seção propõe o mesmo para os outros campos. Sem isso, "preencher sem sobrescrever" não tem como funcionar.

| Parte      | O que é                                                                 | Onde fica                                                                                                       |
| ---------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Padrão** | O que o SRD dá para aquela classe, nível e atributos                    | **Nunca é salvo.** É calculado na exibição                                                                      |
| **Ajuste** | O que a pessoa mudou de propósito                                       | Salvo à parte, só quando ela edita. **Um por item:** cada salvaguarda, cada círculo de magia, cada proficiência |
| **Estado** | O que se gasta: usos, espaços usados, dados de vida restantes, PV atual | Salvo como a pessoa deixou. O limite pelo máximo efetivo é aplicado **na exibição**, não no valor salvo         |

**Valor efetivo = ajuste, se existir; senão, padrão.**

1. **"Mudou" nunca é deduzido** comparando o valor salvo com o do SRD. Um ajuste igual ao padrão continua sendo ajuste até a pessoa escolher "voltar ao padrão". (Comparar falha no caso mais comum: ela põe 3 espaços de 1º, sobe de nível, o SRD passa a dar 3, e o app acha que ela não mexeu.)
2. É o modelo que as caixinhas já usam: `resources[key].overrides`, `editResourceBox` e `resetResourceBox`. Uma diferença a acertar: hoje `resetResourceBox` **apaga** o ajuste; a regra 6 propõe desligar sem apagar.
3. **Escolhas** (perícias, Especialização, Estilo de Luta, magias, terreno) são dados da pessoa, nem padrão nem ajuste. O app nunca apaga uma escolha.
4. **PV máximo é sempre um número dela.** O app só propõe a diferença (nível novo, mudança de CON) e ela aplica.
5. **Ficha existente: regra de compatibilidade.** Todo valor já salvo entra como **ajuste**, item por item, e nada é alterado em silêncio. Isso vale para a entrada da novidade, não é um estado permanente: a ficha oferece "seguir o SRD" numa revisão que não bloqueia, por item ou para tudo de uma vez. Ficha nova nasce sem ajustes.
6. **Voltar ao SRD não apaga.** "Seguir o SRD" **desliga** o ajuste e guarda o valor antigo, que volta com um toque ("usar meu valor de novo"). Só "apagar ajuste" remove de vez, e é uma ação separada.

| Campo                        | Padrão                                 | Ajuste                                     | Valor que já existe hoje                                       |
| ---------------------------- | -------------------------------------- | ------------------------------------------ | -------------------------------------------------------------- |
| Dado de vida                 | dado da classe                         | outro dado escolhido                       | `hitDice.total` (`1d8` ou `5d8`): lê-se só o dado, vira ajuste |
| Salvaguardas                 | as 2 da classe + as de características | ligar ou desligar uma                      | `savingThrowProficiencies` vira ajuste                         |
| Máximo dos espaços           | tabela do tipo de conjurador           | outro máximo por círculo                   | `spellSlots[n].max` vira ajuste; `used` é estado               |
| CD e ataque de magia         | 8 + PB + mod. / PB + mod.              | um bônus somado (item +1) ou um valor fixo | `spellSaveDc` e `spellAttackBonus` salvos viram valor fixo     |
| Proficiências e idiomas      | lista da classe                        | acrescentar ou tirar um item               | campo novo, não há legado                                      |
| Caixinhas                    | `classes.json`                         | `overrides`                                | já funciona assim (#177, #180)                                 |
| PV máximo                    | — (só proposta de diferença)           | o número dela                              | `hpMax` fica como está                                         |
| CA, deslocamento, iniciativa | — (só dica)                            | o número dela                              | ficam como estão                                               |

**O que cada mudança faz:**

| Mudança                                                     | Padrão                                                          | Ajustes                                                                                                                                                                          | Estado e escolhas                                                                                                                                      |
| ----------------------------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Subir de nível                                              | recalculado                                                     | ficam                                                                                                                                                                            | o dado de vida novo já vem disponível (é assim hoje); nascem as pendências do nível                                                                    |
| Descer de nível                                             | recalculado                                                     | ficam                                                                                                                                                                            | o estado salvo **não é cortado**, só o que aparece é limitado ao novo máximo; escolhas de nível mais alto ficam guardadas e inativas, não são apagadas |
| Mudar atributo                                              | recalculado onde depende (CD, preparadas, usos por modificador) | ficam                                                                                                                                                                            | mod. CON mudou: **uma** pendência de PV, recalculada a cada mudança (ver abaixo)                                                                       |
| Trocar de classe oficial                                    | passa a ser o da nova classe                                    | os de campo ficam e aparecem numa lista "ajustes que continuam valendo"; os de caixinha ficam guardados pela chave da classe antiga (`class:<id>:…`) e voltam se a classe voltar | escolhas da classe antiga guardadas e inativas                                                                                                         |
| Ir para classe desconhecida, tirar a edição ou ir para 2024 | deixa de existir                                                | os valores efetivos do momento são gravados como ajuste, para nada sumir da ficha                                                                                                | ficam                                                                                                                                                  |
| Voltar para 2014 com classe oficial                         | volta a ser calculado                                           | os ajustes continuam valendo até "voltar ao padrão"                                                                                                                              | voltam a ficar ativos                                                                                                                                  |

### Estado salvo e estado efetivo — PROPOSTA

Quando o máximo diminui (nível desce, atributo cai, ajuste muda), o que está **salvo** e o que **aparece** se separam:

- **Salvo:** o número que a pessoa deixou. Uma mudança de máximo nunca o reescreve.
- **Efetivo:** `min(salvo, máximo efetivo)`, calculado na exibição. É o que a tela e o checklist de descanso usam.
- **Só uma ação dela grava.** Quando ela toca num espaço ou numa caixinha, grava-se a partir do valor efetivo. A partir daí o número antigo deixa de existir, porque foi ela que mexeu.
- **Descer e voltar sem mexer devolve a ficha igual.** Ex.: nv 5 com 3 espaços de 2º gastos, desce para o nv 3 (máximo 2: aparecem 2 gastos), volta para o nv 5: 3 gastos de novo.

As caixinhas já funcionam assim: `listResourceBoxes` calcula `clamp(saved.used, max)` e não grava. **Os dados de vida, não:** `setLevel` regrava `hitDice.current` a cada mudança de nível. Com 0 dados restantes no nv 5, descer para o 3 e voltar dá 2 restantes. Para ficar reversível, a proposta é guardar os dados **gastos** (o novo nível já chega disponível sem regravar nada) e ler o `current` antigo como `nível − current`. Entra na decisão 2.

### Magia de Pacto e o `spellSlots` antigo — PROPOSTA

A regra que impede espaços duplicados: **a linha de pacto só existe na ficha que tem estado de pacto**, e esse estado só nasce de dois jeitos.

1. **Ficha nova** criada como bruxo em 2014: nasce com o estado de pacto e sem nada de pacto em `spellSlots`.
2. **Ficha existente:** continua exatamente como hoje (tudo em `spellSlots`, sem linha de pacto, lembrete do descanso curto apontando para os espaços de magia) até a pessoa aceitar o convite "Separar espaços de pacto". O convite não bloqueia e pode ser dispensado.

O que o convite faz, mostrado antes de confirmar:

- Pega a linha de `spellSlots` do círculo de pacto do nível dela (nv 5 → 3º círculo).
- Passa os **usados** dessa linha para o estado de pacto e tira o máximo dela. Se o máximo anotado era diferente do da tabela, ele vira ajuste do pacto.
- **Não toca nas outras linhas.** Quem anotou espaços de outra classe à mão (multiclasse caseira) fica com eles onde estão.
- Se não há linha no círculo de pacto, cria o estado de pacto com 0 usados e não mexe em mais nada.
- Guarda uma cópia do `spellSlots` de antes. **"Desfazer"** devolve a linha, leva os usados atuais do pacto de volta para ela e remove o estado de pacto.

Sair da classe bruxo guarda o estado de pacto inativo, como as outras escolhas. O app nunca tenta adivinhar qual linha de `spellSlots` "é o pacto" sem o convite.

### PV e mudança de CON: uma pendência só — PROPOSTA

A pendência não é uma fila de eventos. É uma **conta refeita a cada vez**, a partir de um ponto de referência salvo:

- A ficha guarda **com que mod. CON e em que nível o PV máximo foi conferido pela última vez** (`conMod`, `nível`).
- Diferença de CON = (mod. atual − mod. conferido) × nível conferido. Os níveis ganhos depois disso entram na pendência de nível (rolar ou média), já com o mod. atual.
- **Resolver** (aplicar ou dispensar) soma a diferença ao PV máximo, se aplicada, e move a referência para o mod. e o nível atuais. Aplicar de novo dá diferença 0: **não há como somar duas vezes**.
- CON muda duas vezes antes de resolver (14 → 16 → 18 no nv 7): uma pendência só, de +14.
- CON muda e volta (14 → 16 → 14): diferença 0, a pendência some sozinha.
- CON e nível mudam juntos (nv 3 → 4 com AVA em CON): +3 pelos três níveis antigos, e o nv 4 entra na pendência de nível com o mod. novo. Nada é contado duas vezes.
- **Ficha existente** não tem referência: ela é criada em silêncio com os valores atuais, sem pendência. O PV que já está lá é considerado certo.
- Editar o PV máximo à mão não mexe na referência; a pendência continua lá até ser aplicada ou dispensada.
- Nível que desce não gera conta (o app não sabe quanto ela rolou): vira um lembrete "revise o PV máximo".

### Decisões

**Aprovadas pela Rebeca em 2026-11-15: 1, 2, 7 e 9** (as que a Fase 1 precisa) **e 3, 8 e 10** (as que a Fase 3 precisa), com a recomendação escrita em cada uma e os critérios que ela acrescentou. **As outras seis (4, 5, 6, 11, 12, 13) continuam pendentes** e ficam para as fases que dependem delas. Cada uma traz a minha recomendação e, quando difere, a da revisão externa de 2026-11-15. As seis perguntas da primeira versão deste mapa estão aqui dentro (3, 4, 8, 10, 11, 12).

1. ✅ **Aprovada (2026-11-15).** **Contrato de padrão + ajuste + estado.** Recomendo o da seção acima: ajustes por item, "valor já salvo = ajuste" como regra de compatibilidade, voltar ao SRD sem apagar, e estado salvo separado do efetivo. É a decisão que destrava as outras. Fica **fora da aprovação**, ainda a decidir: se as caixinhas (#180) passam a desligar o ajuste em vez de apagar, para tudo funcionar igual.
2. ✅ **Aprovada (2026-11-15).** **Dados de vida: guardar só o dado?** Recomendo que sim: o campo passa a significar "tipo do dado" (`d8`), a quantidade vem do nível, e a leitura continua aceitando `1d8` e `5d8`. Nenhuma ficha precisa ser reescrita no banco: a leitura aceita os dois formatos. **Correção de 2026-11-15:** precisa, sim, de uma migração pequena, porque a função do banco que decide o que sobe a revisão da ficha (`private.character_sheet_fields`, da #233) trata `hitDice.current` como estado de jogo e tem de passar a tratar `spent` do mesmo jeito. Junto, guardar os dados **gastos** em vez dos restantes, para descer e voltar de nível não alterar nada (ver "Estado salvo e estado efetivo"). A revisão externa descreveu isso como inconsistência entre `setHitDice` e `setLevel`; pelo código é um formato antigo já tratado de propósito, mas o nome e os dois formatos merecem a limpeza.
3. ✅ **Aprovada (2026-11-15).** **PV máximo: aplicar ou sugerir?** Recomendo **aplicar no nv 1** (máximo do dado + CON, editável), como a #178 descreve, e **pendência** nos outros níveis (rolar ou média) e na mudança de CON, com a conta idempotente da seção "PV e mudança de CON". A primeira versão deste mapa recomendava só sugerir sempre; mudei porque no nv 1 a regra não tem escolha e a #178 pede preenchido. **Critérios da aprovação:** o PV do nv 1 continua editável; a pendência de quem não escolheu fica salva; a mudança de CON é reconciliada sem nunca aplicar o bônus duas vezes.
4. **O máximo dos espaços de magia segue a tabela sozinho?** Recomendo que sim, com padrão + ajuste, só para classe oficial em 2014 e sistema "espaços". Ficha com "pontos" fica como está. Espaços usados nunca são mexidos.
5. **Magia de Pacto: onde moram os espaços?** Recomendo um estado próprio (quantidade e círculo vindos de `pact-slots`, usados à parte), mostrado no mesmo cartão dos espaços de magia como uma linha separada, e listado no descanso curto. Ficha existente só muda pelo convite "Separar espaços de pacto", que preserva os usados e pode ser desfeito (seção acima). A alternativa é continuar em `spellSlots`, que é mais barata, mas mistura as duas reservas e quebra no dia da multiclasse.
6. **Contagens no Grimório.** Recomendo quatro contagens informativas (truques, conhecidas, preparadas, fontes adicionais), sem nunca bloquear. **Conferido:** o Grimório já tem a marca de preparada, salva por magia em `character_spells.is_prepared` (`togglePrepared`, botão no cartão da magia). Então "no grimório" é o número de magias da ficha e "preparadas" é o número com a marca: as contagens não pedem estrutura nova. O que **não existe** é dizer de onde a magia veio (domínio, círculo, juramento, Arcana Mística), necessário para deixar as fontes adicionais fora da conta. A decidir: uma coluna de origem por magia, ou calcular pela lista da subclasse.
7. ✅ **Aprovada (2026-11-15).** **Unidade do deslocamento.** Recomendo **metros como valor guardado**, porque é o que o app já faz (etiqueta, campo decimal, combate e testes): corrigir o padrão de ficha nova de 30 para 9 e as fichas da demo, e escrever as dicas de classe nas duas unidades ("+3 m / 10 ft", 5 ft = 1,5 m). A revisão externa primeiro recomendou o contrário (pés como unidade interna e conversão na exibição) e, na segunda rodada, passou a concordar com metros. Pés exigiriam converter todas as fichas, e um "30" salvo não diz se foi digitado em metros ou é o padrão em pés. Nos dois caminhos: **não converter ficha existente sozinho**; no máximo uma dica na ficha com deslocamento 30 ("30 m? O padrão do SRD é 9 m").
8. ✅ **Aprovada (2026-11-15).** **Proficiências e idiomas: etiquetas ou texto livre?** Recomendo etiquetas com `id` preenchidas pela classe, mais um texto livre "outras" para raça, antecedente e mesa. Pede uma lista de idiomas do SRD com `id`, que não existe hoje. **Critérios da aprovação:** o que se salva é o `id`, nunca o nome traduzido; dá para adicionar proficiências e idiomas próprios (homebrew, raça, antecedente, mesa); e o que a ficha já tem é preservado.
9. ✅ **Aprovada (2026-11-15).** **Portão de edição.** Recomendo exigir `edition === '2014'` para tudo deste mapa. Ficha sem edição ou em 2024 fica manual. A confirmar: se a ficha sem edição deve ganhar algum convite, além do cartão da #177.
10. ✅ **Aprovada (2026-11-15).** **Onde pedir as escolhas?** Recomendo perícias e ferramentas da classe no onboarding (#178), e as escolhas de nível (Especialização, AVA, estilos, invocações, PV) como **pendência que fica visível na ficha até ser resolvida ou dispensada**, sem aplicar nada sozinha. A primeira versão falava em "lembrete no level-up"; um lembrete que some perde a escolha de quem fechou a tela. **Critérios da aprovação:** a criação **não é bloqueada** por escolha incompleta (dá para criar com 2 de 3 perícias); a pendência fica salva, visível e resolvível depois; e as escolhas anteriores são preservadas, sem substituição silenciosa, ao mudar de classe, nível ou edição.
11. **CD e ataque de magia: calcular ou continuar campo?** Recomendo calcular na exibição e mostrar no Grimório, com um bônus somado. Os valores já salvos (hoje só a demo preenche, e nenhuma tela mostra) são preservados como valor fixo, em vez de ignorados.
12. **CA: preencher ou só dica?** Recomendo só dica: depende de armadura, escudo, itens e estilo de luta, e o inventário ainda não liga com a CA.
13. **Bônus que entram sozinhos em testes.** Meia proficiência nas perícias (bardo 2, guerreiro campeão 7), Aura de Proteção nas salvaguardas (paladino 6), Alma de Diamante e Mente Escorregadia. Recomendo automático com um jeito de desligar, porque esses valores já são calculados na exibição. **Passivas:** recomendo aplicar a meia proficiência na percepção e na intuição passivas quando a perícia não é proficiente, porque o SRD define o valor passivo como "10 + todos os modificadores que normalmente se aplicam ao teste". **Iniciativa:** enquanto for número manual, o app só mostra a nota e não altera o valor; se um dia passar a ser calculada, o número de hoje entra como ajuste. A revisão externa recomenda o mesmo nos dois pontos.

### Revisão de 2026-11-15

Feita a partir de uma revisão externa do PR #228, com cada ponto conferido no código e no PDF oficial do SRD 5.1 antes de entrar.

**Corrigido no mapa:**

- **Magia de Pacto.** O mapa dizia que os espaços do bruxo "já são caixinhas". Não são: `listResourceBoxes` pula `unit: 'spell-slots'`.
- **Dados de vida.** A proposta mandava gravar `<nv>d<dado>` ao subir de nível. O app deixou de guardar a quantidade; a proposta agora é o dado só.
- **Idioma do Sol e da Lua** (monge 13): entende idiomas falados; não é proficiência, não lê nem escreve.
- **Inimigo Favorito** (patrulheiro): o idioma só existe se os inimigos escolhidos falam algum.
- **Meia proficiência:** o escopo é todo teste de atributo sem PB (iniciativa inclusive), não só a função das perícias.
- **Segredos Mágicos** (bardo): os de 10, 14 e 18 já estão na coluna de conhecidas; só os Adicionais do Conhecimento (nv 6) ficam fora da conta.
- **Movimento sem Armadura** (monge): também exige estar sem escudo.
- **Juramento da Devoção:** faltava a Aura de Devoção (nv 7).
- **Mudança de CON:** a regra de recalcular o PV máximo desde o nv 1 não estava no mapa.
- Entraram a regra da edição, os ids, as quatro contagens de magia, o contrato de valores e as listas de magias de domínio e de juramento.

**Conferido e mantido:** as tabelas de espaços (completo, meio, pacto), truques, magias conhecidas, Artes Marciais, Ataque Furtivo, Movimento sem Armadura, dano de fúria, níveis de AVA, e as listas de salvaguardas, armaduras, armas, ferramentas e perícias das 12 classes. As marcas "(conferir)" saíram.

**Ponto da revisão externa que não entrou:** trocar "Weblate" por "Crowdin". O projeto saiu do Crowdin e a tradução está no Weblate (README, `NOTICE.md`); quem está desatualizado é o texto da #179.

**Ponto em que a recomendação daqui difere da revisão externa:** a unidade do deslocamento (decisão 7).

**Segunda rodada, no mesmo dia.** A revisão externa retirou a sugestão do Crowdin, concordou com metros no deslocamento e pediu quatro critérios, todos conferidos e incorporados:

- **Compatibilidade:** ajustes por item, "valor salvo = ajuste" como regra de entrada e não estado permanente, voltar ao SRD sem apagar o valor antigo.
- **Magia de Pacto:** a linha de pacto só existe com estado de pacto; ficha existente migra por convite, com os usados preservados e "desfazer".
- **Estado salvo x efetivo:** a contradição apontada era real (o mapa dizia "sempre limitado ao máximo" e "nunca mexidos"). Ficou: o salvo não é cortado, o limite é da exibição. Na conferência apareceu que os dados de vida hoje **não** são reversíveis (`setLevel` regrava).
- **PV e CON:** uma pendência só, calculada a partir de uma referência salva, sem como aplicar duas vezes.
- **Grimório:** confirmado que a marca de preparada existe e é salva (`character_spells.is_prepared`).

Não sobrou divergência com a revisão externa. Depois dessa rodada a Rebeca aprovou as decisões 1, 2, 7 e 9; na revisão da fase 2 (PR #237), no mesmo dia, aprovou também a 3, a 8 e a 10. As outras seis continuam pendentes.

**Fora do escopo, de propósito:** multiclasse, automação de combate, regras de 2024. As decisões da #177 e da #179 não foram alteradas.

---

## EN

Map of what each **SRD 5.1 (D&D 2014)** class sets on the sheet beyond resources (#179): hit die, proficiencies, saving throws, skill choices, spellcasting and the per-level features that **change a number or a field**. Table-only features are left out. 2014 rules only, nothing from SRD 5.2.

**Sources.** Hit die, proficiencies, saves, skills, casting ability and caster type, and the feature list per level were checked against `content/dnd5e/srd-5.1/classes.json`. Portuguese names come from `i18n/pt/classes.json` and `messages/pt.json` and are provisional. Spell slot tables, cantrips/spells known, the Martial Arts die, Sneak Attack, Unarmored Movement and Rage Damage **were not in the data** when this map was written: the numbers here come from the SRD 5.1 text and were **checked on 2026-11-15** against the [official SRD 5.1 PDF (CC BY 4.0)](https://media.wizards.com/2023/downloads/dnd/SRD_CC_v5.1.pdf). The sheet should store the stable `id`s `classes.json` already has (class, subclass, feature, armor, weapon, tool); translated names are interface-only. Languages have no ids yet.

The PT tables above are shared; their columns read: _Campo_ = field, _Valor_ = value, _Nv_ = level, _Característica_ = feature, _Campo que muda_ = field it changes. Short summary:

| Class (SRD subclass)  | Hit die | Saves    | Armor                                         | Weapons                                                                         | Tools                          | Skills  | Casting   |
| --------------------- | ------- | -------- | --------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------ | ------- | --------- |
| Barbarian (Berserker) | d12     | STR, CON | light, medium, shield                         | simple, martial                                                                 | —                              | 2 of 6  | —         |
| Bard (Lore)           | d8      | DEX, CHA | light                                         | simple, hand crossbow, longsword, rapier, shortsword                            | 3 instruments                  | any 3   | CHA, full |
| Cleric (Life)         | d8      | WIS, CHA | light, medium, shield (+heavy from Life)      | simple                                                                          | —                              | 2 of 5  | WIS, full |
| Druid (Land)          | d8      | INT, WIS | light, medium, shield (no metal: not in data) | club, dagger, dart, javelin, mace, quarterstaff, scimitar, sickle, sling, spear | herbalism kit                  | 2 of 8  | WIS, full |
| Fighter (Champion)    | d10     | STR, CON | all, shield                                   | simple, martial                                                                 | —                              | 2 of 8  | —         |
| Monk (Open Hand)      | d8      | STR, DEX | —                                             | simple, shortsword                                                              | 1 artisan's tool or instrument | 2 of 6  | —         |
| Paladin (Devotion)    | d10     | WIS, CHA | all, shield                                   | simple, martial                                                                 | —                              | 2 of 6  | CHA, half |
| Ranger (Hunter)       | d10     | STR, DEX | light, medium, shield                         | simple, martial                                                                 | —                              | 3 of 8  | WIS, half |
| Rogue (Thief)         | d8      | DEX, INT | light                                         | simple, hand crossbow, longsword, rapier, shortsword                            | thieves' tools                 | 4 of 11 | —         |
| Sorcerer (Draconic)   | d6      | CON, CHA | —                                             | dagger, dart, sling, quarterstaff, light crossbow                               | —                              | 2 of 6  | CHA, full |
| Warlock (Fiend)       | d8      | WIS, CHA | light                                         | simple                                                                          | —                              | 2 of 7  | CHA, pact |
| Wizard (Evocation)    | d6      | INT, WIS | —                                             | dagger, dart, sling, quarterstaff, light crossbow                               | —                              | 2 of 6  | INT, full |

**Sheet-changing features** (details in the PT tables): ASI at 4/8/12/16/19 (fighter also 6, 14; rogue also 10). Unarmored Defense (barbarian 10+DEX+CON, monk 10+DEX+WIS, no shield), Draconic Resilience (13+DEX AC, +1 HP per level). Fast Movement (+10 ft, no heavy armor), Unarmored Movement (+10 to +30 ft, no armor and no shield). Extra Attack at 5 (fighter 3 at 11, 4 at 20). Expertise (bard 3, 10; rogue 1, 6). Jack of All Trades (half proficiency rounded down on any ability check without proficiency, initiative included) and Remarkable Athlete (rounded up, STR/DEX/CON checks only), Feral Instinct (advantage on initiative). Diamond Soul (all saves), Slippery Mind (WIS save), Aura of Protection (+CHA to saves). Life domain heavy armor, Lore +3 skills. Champion crit range 19–20 / 18–20. Primal Champion STR/CON +4. Languages from Druidic, Thieves' Cant and Draconic Ancestor; Favored Enemy gives a language only if the chosen enemies speak one; Tongue of the Sun and Moon is understanding of spoken languages, not a language proficiency. Resistances and immunities from Purity of Body, Divine Health, Fiendish Resilience, Elemental Affinity.

**Spell slots** (since phase 2 in `slotMaximums`, `shared/systems/dnd5e/class-progression.ts`, checked by the importer against every class table): full-caster table above; half casters have nothing at 1, then the full-caster row for ceil(level/2). Pact slot numbers are in `classes.json` as the `pact-slots` resource, but **the sheet builds nothing from it**: `listResourceBoxes` skips `unit: 'spell-slots'`, so warlocks track pact slots by hand in `spellSlots` and the resource only drives the short-rest reminder.

**Spell counts** are four different things: cantrips known, spells known (bard, sorcerer, warlock, ranger), spells prepared (cleric, druid, paladin, wizard; the wizard prepares only from the spellbook), and extra sources outside the limit (domain, circle and oath spells, Additional Magical Secrets, Mystic Arcanum, Pact of the Tome, Signature Spells). Bard Magical Secrets at 10/14/18 are already inside the Spells Known column.

**Auto-fill vs suggest — PROPOSAL.** Following #177: an official class + level + edition give the default; player edits win and survive level-up; unknown class or multiclass = manual. **Only sheets explicitly set to edition 2014 get anything from this map**; sheets with no edition or with 2024 stay manual. Fills in: hit die type (the count is always the level and is not stored), level 1 HP max (die maximum + CON, editable), class saving throws, armor/weapon/tool proficiencies and class languages (new field), casting ability, slot maxima from the table, pact slots as their own state, derived spell DC/attack with an adjustment, half proficiency on skills. Pending item, applied on one tap: HP on later levels (roll or average), HP after a CON modifier change (±1 per level), skill and tool choices, expertise, ASI and other level choices. Shows read-only: spell counts, attacks per action, crit range, Sneak Attack/Martial Arts/rage numbers, AC and speed formulas. Manual: resistances and immunities.

**Value contract — PROPOSAL.** Three parts: the **default** (what the SRD gives for class, level and attributes; never stored, computed on display), the **adjustment** (what the player changed on purpose; stored apart), and the **state** (what gets spent; clamped to the effective maximum). Effective value = adjustment if present, else default. "Edited" is never inferred by comparing a stored value with the SRD. This is the model resource boxes already use (`overrides`). Choices are the player's data and are never deleted. On existing sheets every stored value counts as an adjustment, so no sheet changes by itself; a field follows the class only when the player asks. Level up or down, attribute changes, class changes and edition changes recompute defaults and keep adjustments; leaving the 2014 engine (unknown class, no edition, 2024) snapshots the effective values as adjustments so nothing disappears.

**Gaps today.** The model (`DnD5eCharacter.ts`, `characters.schemas.ts`, `shared/systems/dnd5e/types.ts`) has level, class/subclass matching, edition, saving throw and skill/expertise flags, slot/point systems with manual slot maxima, resources with overrides, and manual AC/speed/initiative. `hitDice.total` effectively stores only the die: the sheet writes `1d<die>`, shows level + die, and older sheets may hold `5d10`; `setLevel` only adjusts `current`. `spellcastingAbility`, `spellSaveDc` and `spellAttackBonus` are stored but **not shown anywhere** (only the demo fills them). Missing: armor/weapon/tool proficiencies and languages (languages have no id list); default vs adjustment outside resource boxes; pact slots as anything but a hand-kept row in `spellSlots`; a class features section; a creation flow beyond name + system; half proficiency (skills, raw ability checks, initiative); an edition gate (`editionSource(undefined)` falls back to `srd-5.1`); resistances/immunities/extra speeds. **Delivered in phase 2 (data only, the sheet does not use it yet):** slot tables (`slotMaximums`), cantrips, spells known, the prepared formula and the wizard's spellbook in `spellcasting`, class table numbers in `tables` (Rage Damage, Martial Arts, Unarmored Movement in feet, Sneak Attack), half proficiency, and a content API (`ClassContent`) with proficiencies, casting, features, tables and choices by id. **Speed unit:** the label is "m" in both locales, the input takes decimals and combat and tests use 9, so the app treats the number as metres; only the new-sheet default (30) and the demo sheets are in feet.

**Decisions** (approved by Rebeca on 2026-11-15 as recommended: 1, 2, 7 and 9 for phase 1, then 3, 8 and 10 for phase 3, with her criteria: creation is never blocked by an unfinished choice, pending items are saved and visible, stored ids are never translated names, custom proficiencies and languages are allowed, and existing values and earlier choices are preserved; the other six pending; recommendation in brackets):

1. Default + adjustment + state contract. [as above: one adjustment per item (each save, each slot level, each proficiency); "stored values count as adjustments" is a compatibility rule for existing sheets, not a permanent state; "follow the SRD" switches an adjustment off and keeps its value so it can be restored; stored state is never clamped, only the displayed value is]
2. Hit dice: store only the die? [yes; keep reading `1d8` and `5d8`. No row is rewritten, but a small migration is needed: the database function that decides what bumps the sheet revision (`private.character_sheet_fields`, from #233) must treat `spent` as game state like `current`. Also store dice **spent** rather than remaining: today `setLevel` rewrites `current`, so going down a level and back is not reversible]
3. HP max: apply or suggest? [apply at level 1 as #178 describes; pending item on later levels and on CON changes. The CON item is **one derived difference**, (current mod − checked mod) × checked level, from a stored reference; resolving moves the reference, so it cannot be applied twice, and two changes before resolving collapse into one]
4. Slot maxima follow the table? [yes, default + adjustment, known classes on "slots" only; used slots untouched]
5. Pact Magic: where do the slots live? [their own state, shown as a separate row, listed on short rest. The pact row exists only on sheets that have pact state, so nothing is shown twice: new warlock sheets start with it; existing sheets keep `spellSlots` as today until the player accepts an opt-in that moves the used count, leaves other rows alone and can be undone]
6. Grimoire counts. [four informational counts, never blocking. Checked: the Grimoire already persists a prepared flag per spell (`character_spells.is_prepared`), so spellbook vs prepared needs no new structure; what is missing is where a spell came from, needed to keep extra sources outside the limit]
7. Speed unit. [metres as the stored value, since the app already works that way; fix the default 30 → 9. The external review first recommended feet internally and agreed on metres in the second round. Either way, never convert existing sheets automatically]
8. Proficiencies and languages: tags or free text? [tags with ids + a free "other" text]
9. Edition gate. [require `edition === '2014'`]
10. Where to ask for choices? [class skills/tools in onboarding #178; level choices as a pending item that stays on the sheet until resolved]
11. Spell DC/attack: derive or keep stored? [derive, show in the Grimoire; keep stored values as a fixed value]
12. AC: fill in or hint? [hint]
13. Bonuses applied by themselves (half proficiency, Aura of Protection, Diamond Soul, Slippery Mind). [automatic, with a way to turn off; half proficiency also on passive Perception and Insight, since the SRD passive score is 10 + all modifiers that normally apply; initiative is left untouched while it is a manual number]

**Revision of 2026-11-15.** Each point of an external review of PR #228 was checked against the code and the official SRD 5.1 PDF. Corrected: pact slots are not resource boxes; hit dice store the die, not the count; Tongue of the Sun and Moon is not a language proficiency; the Favored Enemy language is conditional; half proficiency covers every ability check without proficiency; bard Magical Secrets are inside Spells Known except Lore's Additional ones; Unarmored Movement also requires no shield; Aura of Devotion was missing; the retroactive CON rule for HP was missing. Checked and kept: slot, cantrip and spells-known tables, class tables, ASI levels and the proficiency lists. Not adopted: replacing "Weblate" with "Crowdin" (the project moved to Weblate; #179's text is the outdated one). Differs from the review: the speed unit (decision 7).

**Second round, same day.** The external review withdrew the Crowdin point, agreed on metres and asked for four criteria, all checked and included: per-item adjustments with a non-destructive return to the SRD; pact slots coexisting with legacy `spellSlots` through an opt-in, undoable migration; stored versus effective state when a maximum drops (the contradiction it pointed out was real); and an idempotent CON/HP pending item. It also asked to confirm the prepared flag, which exists. No disagreement with the external review remains. After this round Rebeca approved decisions 1, 2, 7 and 9; the other nine are still pending.
