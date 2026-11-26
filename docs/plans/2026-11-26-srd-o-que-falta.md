# SRD 5.1 e 5.2.1: fontes oficiais e o que falta no RPG World

Pesquisa de 26/11/2026, feita de madrugada sem aprovações intermediárias. Só leitura: nenhuma PR, issue ou mudança de código. Este arquivo não está commitado.

Como foi feito: um agente levantou as fontes oficiais (PDFs do D&D Beyond, páginas da Wizards, texto da licença CC); outro comparou o repositório com o que o 5etools marca como SRD; um terceiro (organizador) conferiu os dois de forma adversarial e montou as prioridades. Conferi à mão a Poção de Cura, os nomes "Spider's Sting"/"Crawler Mucus" e o `followsClassFully`.

## Fontes oficiais

| Versão                         | Data                                                  | Licença                     | PDF oficial                                                                         | Traduções oficiais                                                   |
| ------------------------------ | ----------------------------------------------------- | --------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| SRD 5.1 (2014)                 | OGL 1.0a (2016); relançado em CC BY 4.0 em 27/01/2023 | CC BY 4.0 ou OGL, à escolha | https://media.dndbeyond.com/compendium-images/srd/5.1/SRD_CC_v5.1.pdf               | DE, ES, FR, IT (`SRD_CC_v5.1_{DE,ES,FR,IT}.pdf`)                     |
| SRD 5.2 (2024)                 | 22/04/2025                                            | CC BY 4.0                   | https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.pdf               | nenhuma                                                              |
| **SRD 5.2.1** (versão atual)   | 01/05/2025                                            | CC BY 4.0                   | https://media.dndbeyond.com/compendium-images/srd/5.2/SRD_CC_v5.2.1.pdf             | DE, ES, FR, IT, desde 08/12/2025 (`{DE,SP,FR,IT}_SRD_CC_v5.2.1.pdf`) |
| Guia "Converting to SRD 5.2.1" | 27/05/2025                                            | (guia, não é SRD)           | https://media.dndbeyond.com/compendium-images/srd/guide/converting-to-srd-5.2.1.pdf | —                                                                    |

- Página oficial: https://www.dndbeyond.com/srd (o endereço antigo da Wizards redireciona para lá).
- O 5.2.1 só acrescentou ao 5.2: 15 itens mágicos esquecidos, as fichas do Knight e do Octopus (no lugar de um Iron Golem duplicado) e números de página.
- Não existe 5.2.2 até hoje. Só PDF: a Wizards não publica HTML nem JSON.
- **Não existe SRD oficial em português nem em sueco**, em nenhuma versão. O pt continua vindo da comunidade (Foundry VTT Brasil, decito).
- O 5etools fixado (v2.38.0) **já segue o 5.2.1** (os 15 itens, Knight e Octopus têm `srd52`). A última versão, v2.41.3 (23/11/2026), não mudou nenhuma flag de SRD: atualizar não é urgente.
- O D&D Beyond passou a chamar 2024 de "5.5e" (nota de 02/03/2026), mas é só nome: o documento continua sendo o SRD 5.2.1.
- As "Free Rules"/"Basic Rules" do D&D Beyond (e `basicRules*` no 5etools) **não são SRD** e não podem ser usadas.

Texto de atribuição exigido pelo 5.2.1:

> This work includes material from the System Reference Document 5.2.1 ("SRD 5.2.1") by Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International License, available at https://creativecommons.org/licenses/by/4.0/legalcode.

O que o SRD tem, em resumo:

|                      | 5.1               | 5.2.1                                                       |
| -------------------- | ----------------- | ----------------------------------------------------------- |
| Classes / subclasses | 12 / 1 por classe | 12 / 1 por classe                                           |
| Raças / espécies     | 9 (+4 sub-raças)  | 9 (Golias e Orc novos; sem Meio-Elfo e Meio-Orc)            |
| Antecedentes         | 1 (Acólito)       | 4 (Acólito, Criminoso, Sábio, Soldado)                      |
| Talentos             | 1 (Agarrador)     | 17 (4 Origem, 2 Gerais, 4 Estilo de Luta, 7 Dádivas Épicas) |
| Magias               | 319               | 339                                                         |
| Criaturas            | ~317              | ~330                                                        |
| Itens mágicos        | ~236 entradas     | 249 entradas                                                |
| Maestria de armas    | —                 | 8 propriedades                                              |
| Glossário de regras  | —                 | sim (115 entradas no 5etools)                               |

---

## O que precisamos adicionar, por prioridade

Critério: o produto é a ficha + a mesa com combate. Primeiro vem o que trava quem cria ou joga uma ficha de 2024 (hoje ela sai com PV 10, sem perícias e sem contagens de magias), depois o que a pessoa usa em toda sessão (poções, armas, condições), e por último o que é do mestre (criaturas, armadilhas).

### (A) Paridade 2024 no que já existe

| #   | O quê                                                                                                                                                                                                                                     | Por que agora                                          | Issue                                  | Tam. | Depende de                   |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | -------------------------------------- | ---- | ---------------------------- |
| A1  | Criação 2024 com PV do nível 1, armas/armaduras/ferramentas e perícias à escolha. Dividir `classDefaults` por parte, ler `martialWeaponsWithProperty` na ficha, conferir as 12 classes contra o PDF                                       | toda ficha nova de 2024 é afetada; os dados já existem | #178, #181                             | S–M  | nada                         |
| A2  | Magia de 2024: novo campo "preparadas por tabela" no schema, importar truques, preparadas e grimório do 5.2, e `spellCounts` por edição. Marcar os espaços como já conferidos (`checkSlots`)                                              | conjuradores são metade das classes                    | #181                                   | M    | A1 (mesmo portão)            |
| A3  | Tabelas da classe 2024 (`CLASS_TABLES['srd-5.2']`): Fúria, Ataque Furtivo, Artes Marciais, Movimento sem Armadura, e as colunas novas de Maestria e Invocações                                                                            | número usado em todo turno                             | #181 (implícito)                       | S    | nada                         |
| A4  | ~~Correções de dado: Assinatura de Magia (1 uso por magia) e o recurso da Fúria Implacável, nas duas edições~~ **Entregue no #296 (26/11)**, junto com a Canção de Descanso; #179 e #262 fechadas. A revisão de quem joga foi para a #297 | —                                                      | #296                                   | —    | —                            |
| A5  | Lista de raças e antecedentes filtrada por edição: hoje uma ficha de 2014 oferece Golias, Orc, Criminoso, Sábio e Soldado                                                                                                                 | conserto pequeno, evita escolha errada                 | sem issue (encaixa na #207)            | S    | nada (fica melhor com B1/B2) |
| A6  | Common Sign Language nos idiomas de 2024 (`languages.ts` hoje é só o 5.1)                                                                                                                                                                 | conserto pequeno                                       | sem issue                              | S    | nada                         |
| A7  | Inspiração (2014) / Inspiração Heroica (2024) como campo na ficha. O Humano de 2024 ganha uma a cada descanso longo                                                                                                                       | usado na mesa toda sessão                              | sem issue                              | S    | nada                         |
| A8  | Efeito da Exaustão por edição (na ficha e no combate)                                                                                                                                                                                     | o nível de 1 a 6 já existe, falta o efeito             | sem issue                              | S–M  | nada                         |
| A9  | Recuperações especiais                                                                                                                                                                                                                    | regras de nível alto                                   | #213                                   | M–L  | —                            |
| A10 | Fases 4 e 5 (subir de nível, grimório)                                                                                                                                                                                                    | grande; vale para as duas edições                      | #181                                   | L    | A1, A2                       |
| A11 | Textos das invocações (5.1: 32, 5.2: 28) e da metamagia (8 / 10) a partir de `optionalfeatures.json`. Hoje só há a escolha, sem o texto                                                                                                   | Bruxo e Feiticeiro consultam isso o tempo todo         | #204 (metamagia); invocações sem issue | M    | nada                         |

### (B) Conteúdo novo do SRD

| #   | Categoria                                                                                                                                                                                                                                                                                              | 5.1                                                                              | 5.2                                                            | Arquivo 5etools                                                | Issue                              | Tam.                            | Depende de                                                |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------- | ------------------------------- | --------------------------------------------------------- |
| B1  | **Raças / espécies** (traços, tamanho, deslocamento, visão no escuro; em 2024 sem bônus de atributo nem idiomas)                                                                                                                                                                                       | 9 + 4 sub-raças com nome                                                         | 9 (linhagens do Elfo, Gnomo, Golias e Tiefling em `_versions`) | `races.json`                                                   | #207                               | M (dado) + M (efeito na ficha)  | —                                                         |
| B2  | **Antecedentes** (2024: +2/+1 ou +1/+1/+1, talento de origem, perícias, ferramenta, equipamento)                                                                                                                                                                                                       | 1                                                                                | 4                                                              | `backgrounds.json`                                             | **sem issue**                      | S (dado) + M (criação 2024)     | B3 (talento de origem)                                    |
| B3  | **Talentos** (Origem, Geral, Estilo de Luta, Dádiva Épica). Os Estilos de Luta de 2024 são talentos e o `classes.json` já os referencia em `choices`                                                                                                                                                   | 1 (Grappler)                                                                     | 17                                                             | `feats.json`                                                   | **sem issue** (#182 só a caixinha) | S–M                             | Iniciado em Magia → lista de magias (existe)              |
| B4  | **Itens mágicos** (raridade, sintonização, cargas, variantes). **Fazer primeiro: a família Poção de Cura e o Pergaminho de Magia.** O importador hoje exige `source === PHB\|XPHB`, `=== true` e raridade "none": precisa aceitar DMG/XDMG e a flag como texto (14 nomes do SRD diferentes do 5etools) | 313 + 41 variantes                                                               | 320 + 51 variantes (≈249 entradas no PDF)                      | `items.json`, `magicvariants.json`                             | **sem issue** (#182 só as cargas)  | L (Poção de Cura sozinha: S)    | schema de item (raridade/sintonização); #182 para cargas  |
| B5  | **Maestria de armas** (Cleave, Graze, Nick, Push, Sap, Slow, Topple, Vex) + campo `mastery` nas 38 armas + quantas armas a classe domina (coluna da A3)                                                                                                                                                | —                                                                                | 8 propriedades, 38 armas                                       | `items-base.json` (`itemMastery`, `mastery`)                   | **sem issue**                      | S (dado) + M (escolha na ficha) | A3                                                        |
| B6  | **Venenos e itens comuns do DMG** (5.1: 14 venenos + 6 navios; 5.2: 14 venenos, com "Spider's Sting" e "Crawler Mucus" como nomes do SRD)                                                                                                                                                              | 20                                                                               | 14                                                             | `items.json` (DMG/XDMG)                                        | **sem issue**                      | S                               | ajuste do filtro do importador (o mesmo da B4)            |
| B7  | **Glossário de regras / ações / estados** (consulta durante o combate; Bloodied e Concentration na mesa)                                                                                                                                                                                               | 20 ações, 2 estados (o texto de regras de 2014 não vem como entradas no 5etools) | 115 regras, 17 ações, 3 estados                                | `variantrules.json`, `actions.json`, `conditionsdiseases.json` | **sem issue** (#106 é outra coisa) | M (muito texto para traduzir)   | tags `{@variantrule}` nos textos já existentes            |
| B8  | **Criaturas** (o mestre cria um PdM a partir de uma ficha de criatura no combate da mesa; os PdMs de hoje são fichas do mestre)                                                                                                                                                                        | 322                                                                              | 330                                                            | `bestiary/bestiary-mm.json`, `bestiary-xmm.json`               | **sem issue**                      | L                               | schema de criatura; ligar ao `add-participant` do combate |
| B9  | Doenças, armadilhas, perigos, sentidos, tabela de bugigangas                                                                                                                                                                                                                                           | 3 / 8 / 0 / 4                                                                    | 3 / 8 / 14 / 4                                                 | `conditionsdiseases.json`, `trapshazards.json`, `senses.json`  | sem issue                          | S cada                          | baixa prioridade (coisa do mestre)                        |

Ordem sugerida, para uma pessoa jogando na mesa:

1. **A1, A3, A5, A6, e a Poção de Cura da B4** (a A4 já entrou no #296). Tudo pequeno, e já melhora a ficha de 2024 e o inventário.
2. **A2 e B5.** Completam o turno de combate de 2024: magias preparadas e maestria.
3. **B1, B2 e B3 juntos.** Na criação de 2024, origem é um pacote só (espécie + antecedente + talento de origem), e entregar um sem os outros deixa a criação incoerente.
4. **A7, A8, B6, B7.** Consulta e estado na mesa.
5. **Resto da B4** (itens mágicos completos) e **A11**.
6. **B8** (criaturas) e **B9**: é o maior volume e serve mais ao mestre.

### (C) Licença e atribuição

1. NOTICE.md e a página de termos: trocar o texto do SRD 5.2 pelo do **5.2.1** (S, sem issue).
2. Completar as linhas "Usado em". 5.1 EN: magias, **classes** (nomes e descrições), **itens**, **condições**. 5.2 EN: magias, classes, itens, condições. Dizer que o 5etools também é fonte do 5.1 (classes, itens, condições). Corrigir o caminho da versão fixada para `scripts/content/5etools-source.ts` (S).
3. Página de termos, itens 3 e 5: listar tudo o que vem do 5etools e do módulo ES (S).
4. Dizer de onde vêm os nomes em es (5.1) e pt (condições, magias e itens de 2024) que entraram pelo Crowdin/Weblate (S).
5. Indicar a adaptação ("só a forma/marcação foi adaptada") nos blocos EN; tirar a frase de marcas de dentro do bloco do SRD 5.2 (S).
6. Toda categoria nova da parte B precisa entrar no "Usado em" na mesma PR.
7. Opcional: existe tradução **oficial** em espanhol do SRD 5.2.1 (08/12/2025). Ela poderia substituir ou conferir o módulo da comunidade.

### (D) O que NÃO adicionar (fora do SRD)

- Outras subclasses: o SRD tem uma por classe. Artífice, Mystic e Sidekick estão em `dl5e/class/`, mas não são SRD.
- Aasimar e outras espécies; os outros 12 antecedentes do PHB 2024; os outros talentos. **A #182 usa "Sortudo (Lucky)" como exemplo, e ele não está em nenhum SRD.** Trocar o exemplo.
- Beholder, Devorador de Mentes, Githyanki e afins; nomes como Strahd, Orcus, Tiamat, Lolth.
- **Nomes dos itens marcados com flag de texto**: usar o nome do SRD (Handy Haversack, Efficient Quiver, Mysterious Deck, Spider's Sting…), nunca o do 5etools (Heward's, Ehlonna's, Lolth's Sting…).
- `basicRules` / `basicRules2024` do 5etools e as "Free Rules" do D&D Beyond: não são SRD e não podem ser usados.
- Deidades: as 49 do 5etools com `srd` são os panteões histórico-fantásticos do 5.1, que estão no SRD 5.1 mas não servem à ficha. Não há nenhuma no 5.2.
- Tradução oficial em português ou sueco: não existe. O sueco fica só com o que a comunidade traduzir.

---

## Correções aos relatórios anteriores

1. **code-inventory.md, "nenhuma entrada mundana com flag de texto"**: errado. Há duas: `Carrion Crawler Mucus → "Crawler Mucus"` (5.1 e 5.2) e `Lolth's Sting → "Spider's Sting"` (5.2). As duas são DMG/XDMG e por isso já ficam de fora. A lista de "itens mundanos que faltam no 5.2" deveria dizer **Spider's Sting**, não Lolth's Sting; o nome "Lolth" nem aparece no PDF da 5.2.1.
2. **code-inventory.md não percebeu a Poção de Cura**: ela é `rarity: common` (item mágico), então o filtro "sem raridade" a deixa de fora. Hoje não existe nenhum id `potion*` em `srd-5.{1,2}/items.json`.
3. **code-inventory.md, "40 armas do SRD com `mastery`"**: são 38 armas. As outras 2 entradas são "Staff" e "Wooden Staff" (foco arcano/druídico).
4. **A tarefa e o code-inventory, "5.2 não tem `tables` (espaços de magia)"**: os espaços de magia nunca ficaram em `tables`, nem no 5.1. Eles saem de `slotMaximums` nas duas edições. O que falta em 2024 são as tabelas de **números da classe** (Fúria, Ataque Furtivo, Artes Marciais, Movimento sem Armadura) e as **contagens de magias** (`cantrips`, `prepared`, `spellbook`). Os espaços de 2024 já são conferidos pelo `checkSlots`.
5. **"Liberar `proficiencies` e `skillChoices` para 2024 basta"** (ideia implícita na tarefa): não basta. `classDefaults` exige todas as partes (`followsClassFully`), e a UI não lê `martialWeaponsWithProperty`.
6. **srd-sources.md, "o 5etools segue o SRD atual (UNCONFIRMED)"**: agora está **confirmado**: os 15 itens e as fichas do Knight e do Octopus têm `srd52`. Ele também não falou da página de termos, que reproduz a mesma atribuição do 5.2.0 e tem as mesmas lacunas.
7. **code-inventory.md não cita os textos das invocações e da metamagia**: em `optionalfeatures.json` são 49 (5.1) / 38 (5.2) entradas, e o repositório só tem a escolha, sem o texto.
8. **code-inventory.md, "ships são itens"**: no 5.1, os 6 navios (Galley, Keelboat, Longship, Rowboat, Sailing Ship, Warship) são da origem DMG e **não** estão no `items.json` do repositório. Os 5 "vehicle" que estão lá são carroças e afins, do PHB. No 5.2 os navios estão no catálogo, porque vêm do XPHB.

---

## Anexo: o que já temos (conferido)

| Categoria                                                          | 5.1     | 5.2     | Situação                                                               |
| ------------------------------------------------------------------ | ------- | ------- | ---------------------------------------------------------------------- |
| Magias                                                             | 319     | 339     | completo                                                               |
| Condições                                                          | 15      | 15      | completo                                                               |
| Classes e subclasses                                               | 12 + 12 | 12 + 12 | completo; em 2024 faltam contagens de magias e tabelas da classe       |
| Itens comuns                                                       | 251     | 216     | completo do PHB/XPHB; faltam venenos e navios do DMG e a Poção de Cura |
| Idiomas / perícias                                                 | 18 / 18 | 18 / 18 | 2024 sem Common Sign Language                                          |
| Raças, antecedentes, talentos, itens mágicos, criaturas, glossário | —       | —       | nada em arquivo                                                        |

Traduções: en completo; pt completo menos 26 magias de 2024 (313/339); es sem parte dos nomes de itens (5.1 147/251, 5.2 179/216); os arquivos sv existem mas estão vazios.

Relatórios completos dos agentes (podem sumir num reboot): `/tmp/claude-1000/-home-rebs-Github-rpg-world/29fc3da1-f35d-459e-943e-a46b615096f0/scratchpad/` (`srd-sources.md`, `code-inventory.md`, `review.md`).

---

## Issues abertas a partir desta pesquisa (26/11)

Todas no Project com Status "Idea" e sem prioridade (a prioridade é decisão da Rebeca).

| Item do relatório                                                           | Issue |
| --------------------------------------------------------------------------- | ----- |
| A2 + A3 contagens de magias e tabelas da classe em 2024 (sub-issue da #181) | #277  |
| B2 antecedentes                                                             | #278  |
| B3 talentos                                                                 | #279  |
| B4 itens mágicos, começando pela Poção de Cura                              | #280  |
| B6 venenos e itens comuns do DMG                                            | #281  |
| B5 maestria de armas (sub-issue da #175)                                    | #282  |
| A7 Inspiração / Inspiração Heroica                                          | #283  |
| A8 efeito da Exaustão                                                       | #284  |
| A11 texto das Invocações (sub-issue da #175)                                | #285  |
| B7 glossário de regras, ações e estados (+ B9 como nota)                    | #286  |
| B8 criaturas no combate                                                     | #287  |
| A5 + A6 raças, antecedentes e idiomas por edição                            | #288  |
| C atribuição do SRD 5.2.1 no NOTICE e nos termos                            | #289  |

Sem issue nova porque já tinham: A1 (#178, #181), A4 (entregue no #296), A9 (#213), A10 (#181), B1 (#207), metamagia (#204). A correção do exemplo "Sortudo" na #182 não foi feita: está anotada na #279.
