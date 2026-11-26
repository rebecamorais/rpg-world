# Matriz de cobertura e fases — classe na ficha, SRD 5.1 / Coverage matrix and phases — class on the sheet, SRD 5.1

> **Planejamento (#181).** Complemento do [mapa](class-sheet-map.md). Destinos, fases e critérios são **PROPOSTA**. Aprovadas pela Rebeca em 2026-11-15: as decisões 1, 2, 7 e 9, que liberam a **Fase 1**, e as decisões 3, 8 e 10, que liberam a **Fase 3**.
>
> **Planning (#181).** Companion to the [map](class-sheet-map.md). Destinations, phases and criteria are a **PROPOSAL**. Approved by Rebeca on 2026-11-15: decisions 1, 2, 7 and 9, which unblock **Phase 1**, and decisions 3, 8 and 10, which unblock **Phase 3**. English summary at the end.

## PT

O mapa diz **o que a regra é**. Esta matriz diz **o que a ficha faz com cada característica**, para nenhuma ficar descrita no mapa e esquecida na implementação. Só SRD 5.1 (2014), só a subclasse do SRD, sem multiclasse e sem automação de combate.

### O que vale em cada edição

A matriz abaixo é do SRD 5.1. Desde a revisão da decisão 9 (2026-11-15), cada parte do que a classe preenche é liberada por edição, só depois de conferida contra o SRD dela. No código: `CLASS_AUTOMATION` em `shared/systems/dnd5e/sheet-values.ts`.

| O que a classe preenche                         | D&D 2014 | D&D 2024 |
| ----------------------------------------------- | -------- | -------- |
| Salvaguardas da classe                          | sim      | sim      |
| Dado de vida                                    | sim      | sim      |
| Proficiências de armas, armaduras e ferramentas | sim      | pendente |
| Perícias e ferramentas à escolha                | sim      | pendente |
| Progressão de magia                             | sim      | pendente |

"Pendente" quer dizer que a ficha de 2024 continua manual nessa parte: ela **não** recebe a regra de 2014. Salvaguardas e dado de vida são iguais nas 12 classes dos dois livros, mas cada ficha lê o livro da própria edição. Ficha sem edição não segue nada.

A matriz cobre **todas** as características de `content/dnd5e/srd-5.1/classes.json`, pelo `id` (o mesmo em qualquer idioma). Um script conferiu que nenhum `id` ficou sem destino nem apareceu duas vezes.

### Destinos

| Destino                          | O que a ficha faz                                                                                                                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **automático**                   | Calcula o padrão do SRD e mostra. O ajuste da pessoa fica guardado à parte e vence (contrato no mapa).                                  |
| **automático · caixinha (#177)** | Já é uma caixinha de recurso. Nada novo a fazer aqui.                                                                                   |
| **escolha**                      | A pessoa precisa decidir. Fica como **pendência visível na ficha** até resolver; não é um aviso que some. Nada é aplicado sem um toque. |
| **informativo**                  | Aparece como dica, nota ou na linha "números da classe". Não escreve em campo nenhum.                                                   |
| **fora do escopo**               | Regra de mesa ou de combate, ou sem campo na ficha (imunidades, resistências, voo). No máximo aparece no texto da característica.       |

### Valem para as 12 classes, em todo nível

| O quê                               | Destino    | Na ficha                                                                                                                                                                   |
| ----------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bônus de proficiência               | automático | Já é derivado do nível.                                                                                                                                                    |
| Dado de vida (tipo)                 | automático | Vem da classe; a quantidade é sempre o nível.                                                                                                                              |
| Dados de vida restantes             | automático | Calculados: nível − dados gastos. Só os **gastos** são salvos, e a mudança de nível não os regrava. Hoje `setLevel` regrava os restantes; a fase 1 troca isso (decisão 2). |
| PV máximo no nv 1                   | automático | Máximo do dado + mod. CON, editável.                                                                                                                                       |
| PV máximo nos outros níveis         | escolha    | Pendência "rolar ou média" a cada nível ganho.                                                                                                                             |
| Mudança do mod. CON                 | escolha    | **Uma** pendência, recalculada a cada mudança: (mod. atual − mod. conferido) × nível conferido. Um toque aplica; não há como aplicar duas vezes.                           |
| Salvaguardas da classe              | automático | As 2 da classe.                                                                                                                                                            |
| Armaduras, armas, ferramentas fixas | automático | Lista da classe (campo novo).                                                                                                                                              |
| Perícias e ferramentas à escolha    | escolha    | N da lista, no onboarding.                                                                                                                                                 |
| Máximo dos espaços de magia         | automático | Pela tabela do tipo de conjurador, em todo nível de conjurador. Os usados salvos não são cortados quando o máximo desce; só a exibição é limitada.                         |

**Conferência:** 247 ids de característica classificados, mais os marcadores de subclasse; 93 escolha, 61 automático, 59 fora do escopo, 34 informativo.

### Bárbaro (Trilha do Berserker)

| Nv               | Característica                                           | Destino                      | Na ficha                                                                                                                    |
| ---------------- | -------------------------------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 1                | Fúria<br>`rage`                                          | automático · caixinha (#177) | Usos pela tabela, ilimitada no nv 20. Dano de fúria +2 / +3 (nv 9) / +4 (nv 16) na linha "números da classe" (informativo). |
| 1                | Defesa sem Armadura<br>`unarmored-defense`               | informativo                  | Dica de CA: 10 + DES + CON sem armadura (escudo vale). Não escreve a CA.                                                    |
| 2                | Sentido de Perigo<br>`danger-sense`                      | fora do escopo               | Vantagem situacional em salvaguarda de DES.                                                                                 |
| 2                | Ataque Imprudente<br>`reckless-attack`                   | fora do escopo               | Combate.                                                                                                                    |
| 3                | Trilha do Berserker (Frenesi)<br>`path-of-the-berserker` | fora do escopo               | Dá exaustão ao fim da fúria (#179).                                                                                         |
| 4, 8, 12, 16, 19 | AVA<br>`ability-score-improvement-4` … (5 ids)           | escolha                      | Lembrete pendente até a pessoa aplicar (+2, +1/+1 ou talento). Os atributos continuam manuais.                              |
| 5                | Ataque Extra<br>`extra-attack`                           | informativo                  | Números da classe: 2 ataques por ação.                                                                                      |
| 5                | Movimento Rápido<br>`fast-movement`                      | informativo                  | Dica de deslocamento: +10 ft (+3 m) sem armadura pesada. Não escreve o deslocamento.                                        |
| 6                | Fúria Irracional<br>`mindless-rage`                      | fora do escopo               | Imunidade situacional (em fúria).                                                                                           |
| 7                | Instintos Primitivos<br>`feral-instinct`                 | informativo                  | Nota ao lado da iniciativa: vantagem.                                                                                       |
| 9, 13, 17        | Crítico Brutal<br>`brutal-critical-1-die` … (3 ids)      | informativo                  | Números da classe: +1 / +2 / +3 dados no crítico.                                                                           |
| 10               | Presença Intimidante<br>`intimidating-presence`          | fora do escopo               | Combate.                                                                                                                    |
| 11               | Fúria Implacável<br>`relentless-rage`                    | automático · caixinha (#262) | 5 usos (teto do app, CD até 35), voltam no DC ou DL. `used` = usos desde o descanso; a CD (10 + 5 × usos) fica para a #213. |
| 14               | Retaliação<br>`retaliation`                              | fora do escopo               | Combate.                                                                                                                    |
| 15               | Fúria Persistente<br>`persistent-rage`                   | fora do escopo               | Regra de duração da fúria.                                                                                                  |
| 18               | Força Indomável<br>`indomitable-might`                   | fora do escopo               | Piso em teste de FOR; rolagem de mesa.                                                                                      |
| 20               | Campeão Primitivo<br>`primal-champion`                   | escolha                      | Confirmação pendente: FOR e CON +4 (máx. 24). Ao aplicar, o PV máximo segue a regra de mudança de CON (+2 por nível).       |

Marcadores sem regra própria (apontam para a subclasse): `primal-path`, `path-feature-6`, `path-feature-10`, `path-feature-14`.

### Bardo (Colégio do Conhecimento)

| Nv               | Característica                                                                                         | Destino                      | Na ficha                                                                                                                                                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------ | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1                | Conjuração<br>`spellcasting`                                                                           | automático                   | Atributo CAR; máximo dos espaços pela tabela de conjurador completo; CD e ataque derivados. Truques e magias conhecidas: contagem informativa no Grimório.                                                                    |
| 1, 5, 10, 15, 20 | Inspiração de Bardo (dado, Fonte de Inspiração, Inspiração Superior)<br>`bardic-inspiration` … (6 ids) | automático · caixinha (#177) | Máximo = mod. CAR; dado d6 / d8 / d10 / d12; volta no DC a partir do nv 5.                                                                                                                                                    |
| 2                | Pau pra Toda Obra<br>`jack-of-all-trades`                                                              | automático                   | Metade do PB (arred. pra baixo) em **todo teste de atributo sem PB**: perícias sem proficiência e teste puro de atributo. Iniciativa: nota enquanto ela for número manual. Percepção e intuição passivas entram (decisão 13). |
| 2, 9, 13, 17     | Canção do Descanso<br>`song-of-rest-d6` … (4 ids)                                                      | informativo                  | Linha no checklist de descanso curto, com o dado do nível: d6 / d8 / d10 / d12 extra (#179). Só no SRD 5.1; o 5.2 não tem.                                                                                                    |
| 3                | Colégio do Conhecimento (Proficiências Adicionais, Palavras de Corte)<br>`college-of-lore`             | escolha                      | +3 perícias à escolha. Palavras de Corte gasta a Inspiração (fora do escopo).                                                                                                                                                 |
| 3, 10            | Especialização<br>`expertise-3`, `expertise-10`                                                        | escolha                      | 2 perícias proficientes com PB dobrado, cada vez.                                                                                                                                                                             |
| 4, 8, 12, 16, 19 | AVA<br>`ability-score-improvement-4` … (5 ids)                                                         | escolha                      | Lembrete pendente até a pessoa aplicar (+2, +1/+1 ou talento). Os atributos continuam manuais.                                                                                                                                |
| 6                | Contra-Encantamento<br>`countercharm`                                                                  | fora do escopo               | Combate.                                                                                                                                                                                                                      |
| 6                | Segredos Mágicos Adicionais<br>`additional-magical-secrets`                                            | escolha                      | 2 magias de qualquer classe. **Não contam** no limite de conhecidas: entram como fonte adicional no Grimório.                                                                                                                 |
| 10, 14, 18       | Segredos Mágicos<br>`magical-secrets-10` … (3 ids)                                                     | escolha                      | 2 magias de qualquer classe, cada vez. **Já estão** na coluna de conhecidas da tabela do bardo.                                                                                                                               |
| 14               | Perícia Inigualável<br>`peerless-skill`                                                                | fora do escopo               | Gasta a Inspiração num teste próprio.                                                                                                                                                                                         |

Marcadores sem regra própria (apontam para a subclasse): `bard-college`, `bard-college-feature-6`, `bard-college-feature-14`.

### Clérigo (Domínio da Vida)

| Nv               | Característica                                                                                  | Destino                      | Na ficha                                                                                                                                                             |
| ---------------- | ----------------------------------------------------------------------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1                | Conjuração<br>`spellcasting`                                                                    | automático                   | Atributo SAB; espaços de conjurador completo; CD e ataque derivados. Preparadas: mod. SAB + nv (mín. 1), contagem informativa.                                       |
| 1                | Domínio da Vida (Proficiência Adicional, Discípulo da Vida, magias de domínio)<br>`life-domain` | automático                   | Armadura pesada. Magias de domínio (nv 1, 3, 5, 7, 9) como fonte adicional sempre preparada, fora do limite. Discípulo da Vida (+2 + círculo na cura) é informativo. |
| 2, 6, 18         | Canalizar Divindade<br>`channel-divinity-2` … (3 ids)                                           | automático · caixinha (#177) | 1 / 2 / 3 usos, DC ou DL.                                                                                                                                            |
| 2                | Preservar a Vida<br>`channel-divinity-preserve-life`                                            | fora do escopo               | Uso do Canalizar Divindade.                                                                                                                                          |
| 4, 8, 12, 16, 19 | AVA<br>`ability-score-improvement-4` … (5 ids)                                                  | escolha                      | Lembrete pendente até a pessoa aplicar (+2, +1/+1 ou talento). Os atributos continuam manuais.                                                                       |
| 5, 8, 11, 14, 17 | Destruir Mortos-Vivos<br>`destroy-undead-cr-1-2` … (5 ids)                                      | informativo                  | Números da classe: ND ½ / 1 / 2 / 3 / 4.                                                                                                                             |
| 6                | Curandeiro Abençoado<br>`blessed-healer`                                                        | fora do escopo               | Cura de mesa.                                                                                                                                                        |
| 8                | Golpe Divino<br>`divine-strike`                                                                 | informativo                  | Números da classe: +1d8 radiante, 2d8 no nv 14.                                                                                                                      |
| 10, 20           | Intervenção Divina<br>`divine-intervention`, `divine-intervention-improvement`                  | automático · caixinha (#177) | 1 uso; 7 dias se funcionar, DL se falhar (#179).                                                                                                                     |
| 17               | Cura Suprema<br>`supreme-healing`                                                               | fora do escopo               | Cura de mesa.                                                                                                                                                        |

Marcadores sem regra própria (apontam para a subclasse): `divine-domain`, `divine-domain-feature-2`, `divine-domain-feature-6`, `divine-domain-feature-8`, `divine-domain-feature-17`.

### Druida (Círculo da Terra)

| Nv               | Característica                                                                                      | Destino                      | Na ficha                                                                                                                                                                                                                         |
| ---------------- | --------------------------------------------------------------------------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1                | Druídico<br>`druidic`                                                                               | automático                   | Idioma Druídico.                                                                                                                                                                                                                 |
| 1                | Conjuração<br>`spellcasting`                                                                        | automático                   | Atributo SAB; espaços de conjurador completo; CD e ataque derivados. Preparadas: mod. SAB + nv (mín. 1), contagem informativa.                                                                                                   |
| 2, 4, 8, 20      | Forma Selvagem (aprimoramentos, Arquidruida)<br>`wild-shape` … (4 ids)                              | automático · caixinha (#177) | 2 usos, DC ou DL; ilimitada no nv 20. ND máx. ¼ / ½ / 1 na linha "números da classe" (informativo).                                                                                                                              |
| 2                | Círculo da Terra (Truque Adicional, Recuperação Natural, magias de círculo)<br>`circle-of-the-land` | escolha                      | Escolha do terreno (ártico, costa, deserto, floresta, pradaria, montanha, pântano). As magias do terreno (nv 3, 5, 7, 9) entram como fonte adicional sempre preparada. +1 truque na contagem. Recuperação Natural já é caixinha. |
| 4, 8, 12, 16, 19 | AVA<br>`ability-score-improvement-4` … (5 ids)                                                      | escolha                      | Lembrete pendente até a pessoa aplicar (+2, +1/+1 ou talento). Os atributos continuam manuais.                                                                                                                                   |
| 6                | Caminho da Floresta<br>`land-s-stride`                                                              | fora do escopo               | Movimento situacional.                                                                                                                                                                                                           |
| 10               | Proteção Natural<br>`nature-s-ward`                                                                 | fora do escopo               | Imunidades; a ficha não tem campo.                                                                                                                                                                                               |
| 14               | Santuário Natural<br>`nature-s-sanctuary`                                                           | fora do escopo               | Combate.                                                                                                                                                                                                                         |
| 18               | Corpo Atemporal<br>`timeless-body`                                                                  | fora do escopo               | Narrativa.                                                                                                                                                                                                                       |
| 18               | Magias Bestiais<br>`beast-spells`                                                                   | fora do escopo               | Conjuração em forma selvagem.                                                                                                                                                                                                    |

Marcadores sem regra própria (apontam para a subclasse): `druid-circle`, `druid-circle-feature-6`, `druid-circle-feature-10`, `druid-circle-feature-14`.

### Guerreiro (Campeão)

| Nv                      | Característica                                           | Destino                      | Na ficha                                                                                                                                                                             |
| ----------------------- | -------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1                       | Estilo de Luta<br>`fighting-style`                       | escolha                      | Escolha pendente. Defesa vira dica de CA +1 com armadura; Arquearia e os outros, só texto.                                                                                           |
| 1                       | Recuperar o Fôlego<br>`second-wind`                      | automático · caixinha (#177) | 1 uso, DC ou DL.                                                                                                                                                                     |
| 2, 17                   | Surto de Ação<br>`action-surge`, `action-surge-two-uses` | automático · caixinha (#177) | 1 uso; 2 no nv 17.                                                                                                                                                                   |
| 3                       | Campeão (Crítico Aprimorado)<br>`champion`               | informativo                  | Números da classe: crítico em 19–20.                                                                                                                                                 |
| 4, 6, 8, 12, 14, 16, 19 | AVA<br>`ability-score-improvement-4` … (7 ids)           | escolha                      | Lembrete pendente até a pessoa aplicar (+2, +1/+1 ou talento). Os atributos continuam manuais.                                                                                       |
| 5, 11, 20               | Ataque Extra<br>`extra-attack` … (3 ids)                 | informativo                  | Números da classe: 2 / 3 / 4 ataques.                                                                                                                                                |
| 7                       | Atleta Extraordinário<br>`remarkable-athlete`            | automático                   | Metade do PB (arred. **pra cima**) em testes de **FOR, DES e CON** sem PB: perícias sem proficiência desses atributos e teste puro. Iniciativa: nota enquanto ela for número manual. |
| 9, 13, 17               | Indomável<br>`indomitable` … (3 ids)                     | automático · caixinha (#177) | 1 / 2 / 3 usos, DL.                                                                                                                                                                  |
| 10                      | Estilo de Luta Adicional<br>`additional-fighting-style`  | escolha                      | Segunda escolha pendente.                                                                                                                                                            |
| 15                      | Crítico Superior<br>`superior-critical`                  | informativo                  | Números da classe: crítico em 18–20.                                                                                                                                                 |
| 18                      | Sobrevivente<br>`survivor`                               | fora do escopo               | Cura por turno em combate.                                                                                                                                                           |

Marcadores sem regra própria (apontam para a subclasse): `martial-archetype`, `martial-archetype-feature-7`, `martial-archetype-feature-10`, `martial-archetype-feature-15`, `martial-archetype-feature-18`.

### Monge (Caminho da Mão Espalmada)

| Nv               | Característica                                                                   | Destino                      | Na ficha                                                                                                                                                   |
| ---------------- | -------------------------------------------------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1                | Defesa sem Armadura<br>`unarmored-defense`                                       | informativo                  | Dica de CA: 10 + DES + SAB sem armadura **e sem escudo**. Não escreve a CA.                                                                                |
| 1                | Artes Marciais<br>`martial-arts`                                                 | informativo                  | Números da classe: d4 / d6 (nv 5) / d8 (nv 11) / d10 (nv 17).                                                                                              |
| 2, 20            | Ki (Autoaperfeiçoamento)<br>`ki`, `perfect-self`                                 | automático · caixinha (#177) | Pontos = nv, DC ou DL; +4 ao rolar iniciativa zerado no nv 20. CD do Ki (8 + PB + SAB) na linha "números da classe".                                       |
| 2, 9             | Movimento sem Armadura<br>`unarmored-movement`, `unarmored-movement-improvement` | informativo                  | Dica de deslocamento: +10 ft (nv 2) / +15 (6) / +20 (10) / +25 (14) / +30 (18), sem armadura **nem escudo**. Andar em paredes e líquidos (nv 9) fica fora. |
| 3                | Desviar Projéteis<br>`deflect-missiles`                                          | fora do escopo               | Combate.                                                                                                                                                   |
| 3                | Caminho da Mão Espalmada<br>`way-of-the-open-hand`                               | fora do escopo               | Combate.                                                                                                                                                   |
| 4                | Queda Lenta<br>`slow-fall`                                                       | fora do escopo               | Combate.                                                                                                                                                   |
| 4, 8, 12, 16, 19 | AVA<br>`ability-score-improvement-4` … (5 ids)                                   | escolha                      | Lembrete pendente até a pessoa aplicar (+2, +1/+1 ou talento). Os atributos continuam manuais.                                                             |
| 5                | Ataque Extra<br>`extra-attack`                                                   | informativo                  | Números da classe: 2 ataques.                                                                                                                              |
| 5                | Golpe Atordoante<br>`stunning-strike`                                            | fora do escopo               | Combate.                                                                                                                                                   |
| 6                | Golpes de Chi<br>`ki-empowered-strikes`                                          | fora do escopo               | Combate.                                                                                                                                                   |
| 6                | Integridade Corporal<br>`wholeness-of-body`                                      | automático · caixinha (#177) | 1 uso, DL.                                                                                                                                                 |
| 7                | Evasão<br>`evasion`                                                              | fora do escopo               | Combate.                                                                                                                                                   |
| 7                | Mente Tranquila<br>`stillness-of-mind`                                           | fora do escopo               | Combate.                                                                                                                                                   |
| 10               | Pureza do Corpo<br>`purity-of-body`                                              | fora do escopo               | Imunidade a doença e veneno; a ficha não tem campo.                                                                                                        |
| 11               | Tranquilidade<br>`tranquility`                                                   | fora do escopo               | Efeito ao fim do DL.                                                                                                                                       |
| 13               | Idioma do Sol e da Lua<br>`tongue-of-the-sun-and-moon`                           | informativo                  | Nota: entende todo idioma **falado** e é entendida por quem entende algum idioma. **Não** acrescenta idiomas à ficha nem dá leitura ou escrita.            |
| 14               | Alma de Diamante<br>`diamond-soul`                                               | automático                   | Proficiência em todas as salvaguardas (depende do contrato de padrão + ajuste).                                                                            |
| 15               | Corpo Atemporal<br>`timeless-body`                                               | fora do escopo               | Narrativa.                                                                                                                                                 |
| 17               | Palma Vibrante<br>`quivering-palm`                                               | fora do escopo               | Gasta 3 de Ki.                                                                                                                                             |
| 18               | Corpo Vazio<br>`empty-body`                                                      | fora do escopo               | Gasta Ki.                                                                                                                                                  |

Marcadores sem regra própria (apontam para a subclasse): `monastic-tradition`, `monastic-tradition-feature-6`, `monastic-tradition-feature-11`, `monastic-tradition-feature-17`.

### Paladino (Juramento da Devoção)

| Nv               | Característica                                                                        | Destino                      | Na ficha                                                                                                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1                | Sentido Divino<br>`divine-sense`                                                      | automático · caixinha (#177) | 1 + mod. CAR usos, DL.                                                                                                                                                                     |
| 1                | Mãos Consagradas<br>`lay-on-hands`                                                    | automático · caixinha (#177) | Reserva de 5 × nv em PV, DL.                                                                                                                                                               |
| 2                | Destruição Divina<br>`divine-smite`                                                   | fora do escopo               | Gasta espaço de magia em combate.                                                                                                                                                          |
| 2                | Estilo de Luta<br>`fighting-style`                                                    | escolha                      | Escolha pendente. Defesa vira dica de CA +1.                                                                                                                                               |
| 2                | Conjuração<br>`spellcasting`                                                          | automático                   | Atributo CAR; espaços de meio conjurador; CD e ataque derivados. Preparadas: mod. CAR + metade do nv (arred. pra baixo, mín. 1), contagem informativa.                                     |
| 3                | Saúde Divina<br>`divine-health`                                                       | fora do escopo               | Imunidade a doença; a ficha não tem campo.                                                                                                                                                 |
| 3                | Juramento da Devoção (magias de juramento, Canalizar Divindade)<br>`oath-of-devotion` | automático                   | Magias de juramento (nv 3, 5, 9, 13, 17) como fonte adicional sempre preparada, fora do limite. Canalizar Divindade já é caixinha.                                                         |
| 4, 8, 12, 16, 19 | AVA<br>`ability-score-improvement-4` … (5 ids)                                        | escolha                      | Lembrete pendente até a pessoa aplicar (+2, +1/+1 ou talento). Os atributos continuam manuais.                                                                                             |
| 5                | Ataque Extra<br>`extra-attack`                                                        | informativo                  | Números da classe: 2 ataques.                                                                                                                                                              |
| 6, 18            | Aura de Proteção<br>`aura-of-protection`, `aura-improvements`                         | automático                   | +mod. CAR (mín. +1) em **todas as salvaguardas dela**, como bônus à parte da proficiência, que a pessoa pode desligar. "Consciente", aliados e alcance (10 ft; 30 no nv 18) ficam na nota. |
| 7                | Aura de Devoção<br>`aura-of-devotion`                                                 | fora do escopo               | Imune a enfeitiçado; a ficha não tem campo.                                                                                                                                                |
| 10               | Aura de Coragem<br>`aura-of-courage`                                                  | fora do escopo               | Imune a amedrontado; a ficha não tem campo.                                                                                                                                                |
| 11               | Destruição Divina Aprimorada<br>`improved-divine-smite`                               | informativo                  | Números da classe: +1d8 radiante corpo a corpo.                                                                                                                                            |
| 14               | Toque Purificador<br>`cleansing-touch`                                                | automático · caixinha (#177) | mod. CAR usos (mín. 1), DL.                                                                                                                                                                |
| 15               | Pureza de Espírito<br>`purity-of-spirit`                                              | fora do escopo               | Efeito permanente de mesa.                                                                                                                                                                 |
| 20               | Resplendor Sagrado<br>`holy-nimbus`                                                   | automático · caixinha (#177) | 1 uso, DL.                                                                                                                                                                                 |

Marcadores sem regra própria (apontam para a subclasse): `sacred-oath`, `sacred-oath-feature-7`, `sacred-oath-feature-15`, `sacred-oath-feature-20`.

### Patrulheiro (Caçador)

| Nv               | Característica                                                                                         | Destino        | Na ficha                                                                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------ | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1, 6, 14         | Inimigo Favorito<br>`favored-enemy` … (3 ids)                                                          | escolha        | Escolha do tipo de inimigo, cada vez. O idioma é **outra escolha, opcional**: só existe se os inimigos escolhidos falam algum. Nunca concedido sozinho. |
| 1, 6, 10         | Explorador Natural<br>`natural-explorer`, `natural-explorer-improvement`                               | escolha        | Escolha do terreno, anotada como texto; o bônus é situacional. (A melhoria do nv 6 está no id conjunto com Inimigo Favorito.)                           |
| 2                | Estilo de Luta<br>`fighting-style`                                                                     | escolha        | Escolha pendente. Defesa vira dica de CA +1.                                                                                                            |
| 2                | Conjuração<br>`spellcasting`                                                                           | automático     | Atributo SAB; espaços de meio conjurador; CD e ataque derivados. Conhecidas pela tabela, contagem informativa.                                          |
| 3                | Consciência Primitiva<br>`primeval-awareness`                                                          | fora do escopo | Gasta espaço de magia.                                                                                                                                  |
| 3, 7, 11, 15     | Caçador (Presa do Caçador, Táticas Defensivas, Ataque Múltiplo, Defesa Superior)<br>`hunter` … (4 ids) | escolha        | Uma opção por nível, guardada como texto. Não muda campo.                                                                                               |
| 4, 8, 12, 16, 19 | AVA<br>`ability-score-improvement-4` … (5 ids)                                                         | escolha        | Lembrete pendente até a pessoa aplicar (+2, +1/+1 ou talento). Os atributos continuam manuais.                                                          |
| 5                | Ataque Extra<br>`extra-attack`                                                                         | informativo    | Números da classe: 2 ataques.                                                                                                                           |
| 8                | Caminho da Floresta<br>`land-s-stride`                                                                 | fora do escopo | Movimento situacional.                                                                                                                                  |
| 10               | Sumir de Vista<br>`hide-in-plain-sight`                                                                | fora do escopo | Situacional.                                                                                                                                            |
| 14               | Desaparecer<br>`vanish`                                                                                | fora do escopo | Combate.                                                                                                                                                |
| 18               | Sentidos Selvagens<br>`feral-senses`                                                                   | fora do escopo | Combate.                                                                                                                                                |
| 20               | Matador de Inimigos<br>`foe-slayer`                                                                    | fora do escopo | Combate.                                                                                                                                                |

Marcadores sem regra própria (apontam para a subclasse): `ranger-archetype`, `ranger-archetype-feature-7`, `ranger-archetype-feature-11`, `ranger-archetype-feature-15`.

### Ladino (Ladrão)

| Nv                   | Característica                                 | Destino                      | Na ficha                                                                                       |
| -------------------- | ---------------------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------- |
| 1, 6                 | Especialização<br>`expertise-1`, `expertise-6` | escolha                      | 2 perícias proficientes (ou 1 perícia + ferramentas de ladrão) com PB dobrado, cada vez.       |
| 1                    | Ataque Furtivo<br>`sneak-attack`               | informativo                  | Números da classe: metade do nv (arred. pra cima) d6.                                          |
| 1                    | Gíria do Ladrão<br>`thieves-cant`              | automático                   | Idioma Gíria do Ladrão.                                                                        |
| 2                    | Ação Ardilosa<br>`cunning-action`              | fora do escopo               | Combate.                                                                                       |
| 3                    | Ladrão (Mãos Rápidas, Escalada)<br>`thief`     | fora do escopo               | Escalar não custa movimento extra; não é deslocamento de escalada.                             |
| 4, 8, 10, 12, 16, 19 | AVA<br>`ability-score-improvement-4` … (6 ids) | escolha                      | Lembrete pendente até a pessoa aplicar (+2, +1/+1 ou talento). Os atributos continuam manuais. |
| 5                    | Esquiva Sobrenatural<br>`uncanny-dodge`        | fora do escopo               | Combate.                                                                                       |
| 7                    | Evasão<br>`evasion`                            | fora do escopo               | Combate.                                                                                       |
| 9                    | Furtividade Suprema<br>`supreme-sneak`         | fora do escopo               | Vantagem situacional.                                                                          |
| 11                   | Talento Confiável<br>`reliable-talent`         | informativo                  | Nota nas perícias proficientes: d20 abaixo de 10 vira 10.                                      |
| 13                   | Usar Dispositivo Mágico<br>`use-magic-device`  | fora do escopo               | Itens.                                                                                         |
| 14                   | Sentido Cego<br>`blindsense`                   | fora do escopo               | Combate.                                                                                       |
| 15                   | Mente Escorregadia<br>`slippery-mind`          | automático                   | Proficiência em salvaguarda de SAB (depende do contrato de padrão + ajuste).                   |
| 17                   | Reflexos de Ladrão<br>`thief-s-reflexes`       | fora do escopo               | Combate.                                                                                       |
| 18                   | Elusivo<br>`elusive`                           | fora do escopo               | Combate.                                                                                       |
| 20                   | Golpe de Sorte<br>`stroke-of-luck`             | automático · caixinha (#177) | 1 uso, DC ou DL.                                                                               |

Marcadores sem regra própria (apontam para a subclasse): `roguish-archetype`, `roguish-archetype-feature-9`, `roguish-archetype-feature-13`, `roguish-archetype-feature-17`.

### Feiticeiro (Linhagem Dracônica)

| Nv               | Característica                                                                          | Destino                      | Na ficha                                                                                                                                                                 |
| ---------------- | --------------------------------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1                | Conjuração<br>`spellcasting`                                                            | automático                   | Atributo CAR; espaços de conjurador completo; CD e ataque derivados. Truques e conhecidas pela tabela, contagem informativa.                                             |
| 1                | Linhagem Dracônica (Ancestral Dracônico, Resiliência Dracônica)<br>`draconic-bloodline` | automático                   | Idioma Dracônico. **+1 PV máximo por nível** de feiticeiro entra na conta proposta de PV. Escolha do ancestral (tipo de dano) pendente. CA 13 + DES sem armadura é dica. |
| 2, 20            | Fonte de Magia (Restauração Feiticeira)<br>`font-of-magic`, `sorcerous-restoration`     | automático · caixinha (#177) | Pontos de feitiçaria = nv, DL; +4 por DC no nv 20. Conversão com espaços: #204.                                                                                          |
| 3, 10, 17        | Metamagia<br>`metamagic-3` … (3 ids)                                                    | escolha                      | 2 / 3 / 4 opções (#204).                                                                                                                                                 |
| 4, 8, 12, 16, 19 | AVA<br>`ability-score-improvement-4` … (5 ids)                                          | escolha                      | Lembrete pendente até a pessoa aplicar (+2, +1/+1 ou talento). Os atributos continuam manuais.                                                                           |
| 6                | Afinidade Elemental<br>`elemental-affinity`                                             | fora do escopo               | Dano e resistência temporária; a ficha não tem campo.                                                                                                                    |
| 14               | Asas de Dragão<br>`dragon-wings`                                                        | fora do escopo               | Deslocamento de voo; a ficha não tem campo.                                                                                                                              |
| 18               | Presença Dracônica<br>`draconic-presence`                                               | fora do escopo               | Gasta 5 pontos de feitiçaria.                                                                                                                                            |

Marcadores sem regra própria (apontam para a subclasse): `sorcerous-origin`, `sorcerous-origin-feature-6`, `sorcerous-origin-feature-14`, `sorcerous-origin-feature-18`.

### Bruxo (O Ínfero)

| Nv               | Característica                                         | Destino                      | Na ficha                                                                                                                                                                                                                                                            |
| ---------------- | ------------------------------------------------------ | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1                | Magia de Pacto<br>`pact-magic`                         | automático                   | Atributo CAR; CD e ataque derivados. **Espaços de pacto com estado próprio**, separados dos espaços comuns: quantidade e círculo pela tabela, voltam no DC ou DL. Hoje não são caixinha nem são preenchidos (ver mapa). Truques e conhecidas: contagem informativa. |
| 1                | O Ínfero (Bênção do Tenebroso)<br>`the-fiend`          | fora do escopo               | PV temporários ao derrubar inimigo.                                                                                                                                                                                                                                 |
| 2                | Invocações Místicas<br>`eldritch-invocations`          | escolha                      | 2 (nv 2) · 3 (5) · 4 (7) · 5 (9) · 6 (12) · 7 (15) · 8 (18). O efeito de cada invocação fica como texto.                                                                                                                                                            |
| 3                | Dádiva do Pacto<br>`pact-boon`                         | escolha                      | Lâmina, Corrente ou Tomo. Tomo: +3 truques como fonte adicional.                                                                                                                                                                                                    |
| 4, 8, 12, 16, 19 | AVA<br>`ability-score-improvement-4` … (5 ids)         | escolha                      | Lembrete pendente até a pessoa aplicar (+2, +1/+1 ou talento). Os atributos continuam manuais.                                                                                                                                                                      |
| 6                | A Sorte do Próprio Tenebroso<br>`dark-one-s-own-luck`  | automático · caixinha (#177) | 1 uso, DC ou DL.                                                                                                                                                                                                                                                    |
| 10               | Resistência Ínfera<br>`fiendish-resilience`            | fora do escopo               | Resistência trocada a cada descanso; a ficha não tem campo.                                                                                                                                                                                                         |
| 11, 13, 15, 17   | Arcana Mística<br>`mystic-arcanum-6th-level` … (4 ids) | automático · caixinha (#177) | 1 uso de cada (6º a 9º), DL. A magia escolhida entra como fonte adicional, fora das conhecidas.                                                                                                                                                                     |
| 14               | Lançar no Inferno<br>`hurl-through-hell`               | automático · caixinha (#177) | 1 uso, DL.                                                                                                                                                                                                                                                          |
| 20               | Mestre Místico<br>`eldritch-master`                    | automático · caixinha (#177) | 1 uso, DL: recupera os espaços de pacto.                                                                                                                                                                                                                            |

Marcadores sem regra própria (apontam para a subclasse): `otherworldly-patron`, `otherworldly-patron-feature-6`, `otherworldly-patron-feature-10`, `otherworldly-patron-feature-14`.

### Mago (Escola de Evocação)

| Nv               | Característica                                                                  | Destino                      | Na ficha                                                                                                                                                                                                                         |
| ---------------- | ------------------------------------------------------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1                | Recuperação Arcana<br>`arcane-recovery`                                         | automático · caixinha (#177) | 1 uso, 1×/dia.                                                                                                                                                                                                                   |
| 1                | Conjuração<br>`spellcasting`                                                    | automático                   | Atributo INT; espaços de conjurador completo; CD e ataque derivados. **Grimório** (6 magias + 2 por nível, mais as copiadas) separado das **preparadas** (mod. INT + nv, mín. 1): duas contagens informativas.                   |
| 2                | Escola de Evocação (Evocação Erudita, Esculpir Magias)<br>`school-of-evocation` | fora do escopo               | Custo de cópia e combate.                                                                                                                                                                                                        |
| 4, 8, 12, 16, 19 | AVA<br>`ability-score-improvement-4` … (5 ids)                                  | escolha                      | Lembrete pendente até a pessoa aplicar (+2, +1/+1 ou talento). Os atributos continuam manuais.                                                                                                                                   |
| 6                | Truque Potente<br>`potent-cantrip`                                              | fora do escopo               | Combate.                                                                                                                                                                                                                         |
| 10               | Evocação Potencializada<br>`empowered-evocation`                                | fora do escopo               | Dano de magia.                                                                                                                                                                                                                   |
| 14               | Sobrecarga<br>`overchannel`                                                     | automático · caixinha (#177) | Contador de usos, zera no DL.                                                                                                                                                                                                    |
| 18               | Maestria de Magias<br>`spell-mastery`                                           | escolha                      | 1 magia de 1º e 1 de 2º do grimório, conjuradas sem gastar espaço.                                                                                                                                                               |
| 20               | Assinatura Mágica<br>`signature-spells`                                         | automático · caixinha (#262) | Uma caixinha de 1 uso por magia (`signature-spell-1`, `-2`), DC ou DL. A reserva de 2 antiga só fica na ficha que salvou algo nela, até o descanso (#213). As 2 magias de 3º escolhidas ficam sempre preparadas, fora do limite. |

Marcadores sem regra própria (apontam para a subclasse): `arcane-tradition`, `arcane-tradition-feature-6`, `arcane-tradition-feature-10`, `arcane-tradition-feature-14`.

## Fases de implementação — PROPOSTA

Cinco fases pequenas, cada uma entregável sozinha. A ordem importa: a fase 1 não mostra nada de novo, mas sem ela as outras sobrescrevem a ficha de alguém. Cada fase depende das decisões pendentes listadas no mapa; **nenhuma começa antes da decisão correspondente ser aprovada**.

### Fase 1 — Contrato e compatibilidade

Campos, ids, padrão + ajuste, e o que acontece com ficha antiga. Sem tela nova.

- Depende de: decisões 1 (contrato), 2 (dados de vida), 7 (deslocamento), 9 (edição). **As quatro foram aprovadas em 2026-11-15: a fase está liberada.**
- **Critérios de aceite**
  - Uma ficha existente, aberta e salva depois da mudança, tem **exatamente** os mesmos valores visíveis de antes: salvaguardas, perícias, máximos de espaços, CD e ataque de magia, PV, CA, deslocamento, dado de vida.
  - O dado de vida é lido de `1d8`, `5d8` e vazio com o mesmo resultado; a quantidade mostrada é sempre o nível.
  - Ficha sem edição, com edição 2024 ou com classe fora das 12: o motor de 2014 devolve "sem padrão" para tudo.
  - Um ajuste gravado sobrevive a subir nível, descer nível, mudar atributo, trocar de classe e voltar, trocar de edição e voltar.
  - Os ajustes são **por item**: seguir o SRD na salvaguarda de SAB não muda a de CON; seguir o SRD no 2º círculo não muda o 1º.
  - "Seguir o SRD" desliga o ajuste e guarda o valor; "usar meu valor de novo" devolve exatamente o número anterior. Só "apagar ajuste" remove.
  - Nenhum valor de ficha existente muda sem uma ação da pessoa, nem ao abrir, nem ao salvar outro campo.
  - **Estado salvo x efetivo:** diminuir um máximo não regrava o estado. Descer de nível e voltar, sem tocar em nada, devolve usos, espaços usados e dados de vida idênticos.
- **Testes de regressão**
  - Unidade: leitura do dado de vida legado (`hitDieSides`); mudar o nível para cima e para baixo não regrava os dados gastos.
  - Unidade: função "valor efetivo = ajuste ?? padrão" para cada campo, com e sem ajuste.
  - Integração: ficha de antes da mudança, lida do banco, devolve os mesmos valores (uma por formato legado conhecido).
  - Unidade: o portão de edição (`2014`, `2024`, ausente).
  - Unidade: ajuste desligado e religado devolve o mesmo valor, por item (salvaguarda, círculo, proficiência).
  - Unidade: nv 5 → 3 → 5 com 3 espaços de 2º gastos: aparecem 2 no nv 3 e 3 de volta no nv 5; o valor salvo é 3 o tempo todo.
  - Unidade: no nv 3, tocar num espaço grava a partir do efetivo (2), e voltar ao nv 5 mostra o que ela gravou.
  - Unidade: **nível 5 com 0 dados restantes → nível 3 → nível 5 = 0 dados restantes** (hoje dá 2: é o caso que a fase corrige). No nível 3 aparecem 0 restantes, e os gastos salvos continuam 5.
  - Unidade: `hitDice.current` antigo lido como gastos = nível − current.

### Fase 2 — Dados determinísticos do SRD

Tabelas 1–20 e o que falta no conteúdo. Sem tela nova.

- Depende de: fase 1. **Entregue:** os dados e as contas existem e têm teste; a ficha ainda não os usa (isso é das fases 3 a 5, que dependem das decisões pendentes).
- **Critérios de aceite**
  - Tabelas de espaços (completo, meio, pacto), truques e magias conhecidas, Artes Marciais, Ataque Furtivo, Movimento sem Armadura e dano de fúria estão nos dados, com os números do SRD 5.1.
  - A API de conteúdo expõe proficiências, salvaguardas, perícias à escolha, conjuração e características, por ids.
  - Meia proficiência calculada para Pau pra Toda Obra (arred. pra baixo, todo teste sem PB) e Atleta Extraordinário (arred. pra cima, só FOR/DES/CON).
- **Testes de regressão**
  - Unidade: cada tabela conferida linha a linha, nv 1 a 20, para as 12 classes (os valores do mapa).
  - Unidade: meio conjurador sem espaços no nv 1; pacto com todos os espaços no mesmo círculo.
  - Unidade: meia proficiência não se soma a perícia proficiente nem a salvaguarda; arredondamentos nos PB +3 e +5.
  - Os testes de recursos da #177 (progressão do máximo 1–20) continuam passando.

### Fase 3 — Criação de personagem (#178)

Escolher edição e classe, preencher o determinístico, apresentar as escolhas.

- Depende de: fases 1 e 2; decisões 3 (PV), 8 (proficiências e idiomas), 10 (onde pedir as escolhas). **As três foram aprovadas em 2026-11-15: a fase está liberada.** Fica fora dela: progressão de nível (fase 4), Grimório (fase 5) e multiclasse.
- **Critérios de aceite**
  - Criar com edição 2014 e classe oficial preenche: dado de vida, PV do nv 1, as 2 salvaguardas, proficiências fixas, idiomas de classe, atributo de conjuração, máximo dos espaços, caixinhas (#177).
  - Perícias e ferramentas à escolha aparecem como escolha, e pular deixa a pendência visível na ficha.
  - Criar sem classe, com classe escrita à mão ou com edição 2024 dá a ficha de hoje, sem nada do motor de 2014.
- **Testes de regressão**
  - Unidade, nv 1: **Bárbaro** (d12, 12 + CON, sem conjuração), **Bardo** (3 perícias quaisquer, 3 instrumentos à escolha, 2 truques, 4 conhecidas, 2 espaços), **Clérigo da Vida** (armadura pesada, magias de domínio fora do limite), **Mago** (grimório 6, preparadas INT + 1).
  - E2E: criar um personagem de cada um dos quatro e conferir a ficha.
  - E2E: o fluxo de criação atual (só nome e sistema) continua funcionando.

### Fase 4 — Progressão de nível

Resumo do que o nível trouxe, escolhas pendentes e ajustes preservados.

- Depende de: fase 3; decisão 10.
- **Critérios de aceite**
  - Subir de nível mostra o que mudou e cria as pendências do nível (AVA, Especialização, Estilo de Luta, PV).
  - Uma pendência não resolvida continua visível na ficha em qualquer sessão, até ser resolvida ou dispensada.
  - Descer de nível não apaga escolha nem ajuste: o que é de nível mais alto fica guardado e inativo.
  - Mudar o mod. CON propõe o acerto do PV máximo (±1 por nível) e não mexe sem confirmação.
  - A pendência de CON é **uma só e idempotente**: é recalculada de uma referência salva (mod. e nível conferidos), aplicar move a referência, e aplicar de novo não soma nada.
  - Ficha existente ganha a referência em silêncio, sem pendência e sem mudar o PV.
- **Testes de regressão**
  - Unidade: nível para frente e para trás (5 → 6 → 5) mantém ajustes, usos gastos dentro do novo máximo e escolhas.
  - Unidade: AVA do **Guerreiro** em 4, 6, 8, 12, 14, 16, 19 e do **Ladino** em 4, 8, 10, 12, 16, 19; as outras classes em 4, 8, 12, 16, 19.
  - Unidade: CON 14 → 16 no nv 7 propõe +7 PV; 16 → 14 propõe −7.
  - Unidade: CON 14 → 16 → 18 no nv 7, sem resolver no meio: uma pendência de +14, não duas de +7.
  - Unidade: CON 14 → 16 → 14 sem resolver: nenhuma pendência.
  - Unidade: aplicar a pendência duas vezes seguidas soma uma vez só; dispensar também zera.
  - Unidade: nv 3 → 4 com +2 em CON (mod. +1): +3 pelos níveis antigos, e o nv 4 entra na pendência de nível já com o mod. novo; o total não conta o nv 4 duas vezes.
  - Unidade: CON muda, o nível sobe e só depois ela resolve: a diferença de CON usa o nível conferido, não o atual.
  - Unidade: editar o PV máximo à mão com pendência aberta não aplica nem apaga a pendência.
  - Integração: ficha de antes da mudança abre sem pendência de PV.
  - Unidade: Alma de Diamante (monge 14) e Mente Escorregadia (ladino 15) respeitam uma salvaguarda desligada à mão.
  - Unidade: Resiliência Dracônica soma +1 PV por nível na conta proposta.

### Fase 5 — Grimório e recursos

Tipos de conjuração, espaços comuns e de pacto, limites e recuperação.

- Depende de: fase 2; decisões 4 (espaços), 5 (Magia de Pacto), 6 (contagens do Grimório).
- **Critérios de aceite**
  - Espaços de pacto e espaços comuns têm estado separado; gastar um não altera o outro.
  - **Nenhuma ficha mostra o pacto duas vezes:** a linha de pacto só aparece na ficha com estado de pacto. Bruxo existente continua vendo só o `spellSlots` de hoje até aceitar o convite.
  - O convite "Separar espaços de pacto" preserva os usados, não toca nas outras linhas de `spellSlots` e tem "desfazer", que devolve a ficha ao formato anterior com os usados atuais.
  - As contagens de preparadas usam a marca que já existe (`character_spells.is_prepared`); nenhuma magia perde a marca.
  - O checklist de descanso curto lista os espaços de pacto e **não** os comuns; o de descanso longo lista os dois.
  - O Grimório mostra, sem bloquear: truques, conhecidas ou preparadas, e as fontes adicionais (domínio, círculo, juramento, Segredos Mágicos Adicionais, Arcana Mística, Tomo) fora do limite.
  - O Mago vê duas contagens: magias no grimório e magias preparadas.
  - Passar do limite mostra um aviso e deixa salvar (homebrew).
- **Testes de regressão**
  - Unidade: **Bruxo** nv 5 com 2 espaços de 3º; depois do descanso curto o checklist aponta os espaços de pacto.
  - Unidade: bruxo existente nv 5 com `spellSlots['3'] = { max: 2, used: 1 }` e sem estado de pacto: a ficha mostra uma linha só, e o checklist continua com o lembrete de hoje.
  - Unidade: aceitar o convite nessa ficha dá pacto com 1 usado e nenhuma linha de 3º em `spellSlots`; desfazer devolve `{ max: 2, used: 1 }`.
  - Unidade: gastar mais um espaço de pacto depois do convite e desfazer devolve `used: 2`.
  - Unidade: bruxo com linhas de 1º e 2º anotadas à mão: o convite só mexe na linha do círculo de pacto.
  - Unidade: bruxo sem linha no círculo de pacto: o convite cria o pacto com 0 usados e não altera `spellSlots`.
  - Unidade: máximo de pacto anotado diferente da tabela vira ajuste do pacto.
  - Unidade: classe que não é bruxo nunca recebe o convite nem a linha de pacto.
  - Unidade: **Mago** nv 3, INT 16, com 10 magias no grimório: preparadas 6 de 10, sem aviso de limite no grimório.
  - Unidade: **Clérigo da Vida** nv 3 com as 4 magias de domínio fora da conta de preparadas.
  - Unidade: **Bardo** nv 10 do Conhecimento: 14 conhecidas (com os Segredos Mágicos do nv 10) + 2 adicionais do nv 6 fora da conta.
  - Os testes atuais de `SpellSlots`, `rest-checklist` e `listResourceBoxes` continuam passando.

### Fora de todas as fases

Multiclasse, automação de combate, CA e deslocamento escritos pelo app, resistências e imunidades, deslocamentos extras (voo, escalada), regras de 2024 (SRD 5.2), conversão de pontos de feitiçaria (#204), descanso que aplica sozinho (#205).

---

## EN

The [map](class-sheet-map.md) states what each SRD 5.1 rule is. This matrix states **what the sheet does with every feature**, so nothing is documented and then forgotten. It covers every feature `id` in `content/dnd5e/srd-5.1/classes.json` (a script checked that each id has exactly one destination). SRD 5.1 (2014) only, SRD subclass only, no multiclassing, no combat automation. All of it is a **proposal**.

**Destinations** (the _Destino_ column of the PT tables):

- **automático** (automatic): the sheet computes and shows the SRD default; the player's adjustment is stored apart and wins.
- **automático · caixinha (#177)**: already a resource box.
- **escolha** (choice): the player must decide; it stays as a **visible pending item on the sheet** until resolved, not a dismissable notice.
- **informativo** (informational): a hint, a note, or the read-only "class numbers" line. Writes to no field.
- **fora do escopo** (out of scope): table or combat rule, or no field on the sheet (immunities, resistances, flight).

**Per edition.** Since decision 9 was revised (2026-11-15), each part the class fills in is opened per edition, only after being checked against that edition's SRD (`CLASS_AUTOMATION`). Class saving throws and the hit die apply to 2014 and 2024; weapon, armor and tool proficiencies, skill and tool choices, and spell progression are 2014-only for now. A 2024 sheet never gets a 2014 rule, and a sheet with no edition follows nothing.

**Phases (proposal)**, each shippable alone and each blocked on its pending decisions in the map:

1. **Contract and compatibility.** Fields, ids, default + adjustment, legacy sheets. Accept: an existing sheet shows exactly the same values after the change and nothing changes without a player action; the 2014 engine returns nothing for sheets with no edition, edition 2024 or an unlisted class; adjustments are per item, survive level, attribute, class and edition changes, and can be switched off and back on without losing the value; lowering a maximum never rewrites stored state, so going down a level and back returns the same sheet (hit dice included, which is not the case today).
2. **Deterministic SRD data.** Tables 1–20 in content, content API exposing proficiencies/saves/skills/casting/features, half proficiency. Tests: every table row by row for the 12 classes.
3. **Character creation (#178).** Pick edition and class, fill deterministic values, present choices. Tests: level 1 Barbarian, Bard, Life Cleric and Wizard.
4. **Level progression.** What the level brought, pending choices, preserved adjustments. Tests: level up and back down, Fighter and Rogue ASI levels, and an idempotent CON item (two changes before resolving give one difference, a change and its reversal give none, applying twice adds once, CON and level changing together count no level twice).
5. **Grimoire and resources.** Pact slots apart from regular slots, informational spell counts with extra sources outside the limit, wizard spellbook vs prepared. Tests: Warlock after a short rest; an existing Warlock that keeps pact slots in `spellSlots` shows them once, and the opt-in migration keeps used slots and can be undone; Wizard with a spellbook larger than the prepared list, counted from the existing `is_prepared` flag.

Out of every phase: multiclassing, combat automation, AC and speed written by the app, resistances and immunities, extra speeds, 2024 rules, sorcery point conversion (#204), self-applying rest (#205).
