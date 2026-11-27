# Glossário en → pt-BR: evidência do português já aprovado

**Versão: v0.1 (proposta, 2026-11-27, não revisada pela Rebeca).**

Este documento só **mede** como o português que já está aprovado no repositório traduz cada termo. Não propõe termo novo: onde não há evidência, a linha diz `no-evidence`. Onde o próprio português se divide, a linha diz `inconsistent` e **a escolha é da Rebeca**.

- Script (reproduz tudo): `docs/discovery/localization-infrastructure/scripts/glossary-evidence.mjs`
- Glossário em CSV (230 linhas): `docs/discovery/localization-infrastructure/proposals/glossary.pt-BR.csv`

```sh
node docs/discovery/localization-infrastructure/scripts/glossary-evidence.mjs --csv
```

## 1. Como foi feito

**Corpus.** 3.989 pares de strings (mesmo caminho no JSON em `en` e `pt`, os dois não vazios):

| Fonte | Pares | Observação |
| --- | ---: | --- |
| 5.1 (regras) | 1.566 | `spells`, `items`, `conditions`, `classes` de `content/dnd5e/srd-5.1/i18n`. Em `conditions` só os 15 nomes têm `pt`; as descrições estão vazias. |
| 5.2 (regras) | 771 | Quase só nomes (spells 313 de 999 strings; classes 227 de 740; items 216 de 347; conditions 15 de 30). |
| UI | 1.652 | `messages/en.json` × `messages/pt.json`. |

**Alinhamento.** Só em nível de string. Para cada termo em inglês (regex com fronteira de palavra, singular e plural), pega as strings que o contêm e conta quais formas candidatas em português aparecem na string pareada. A contagem é de **strings**, não de ocorrências.

**Tags do 5etools** (`{@condition charmed||enfeitiçada}`) foram trocadas pelo texto de exibição antes de contar (3º segmento nas tags comuns, 2º em `{@dc 10|CD 10}`). Assim as formas flexionadas das tags entram nas contagens.

**Candidatas.** Comecei pelas óbvias e acrescentei as que apareceram lendo pares reais e pelo ranking de n-gramas do português (palavras que aparecem muito nas strings com o termo e pouco no resto).

**Forma rival "sozinha".** Uma forma rival só conta quando aparece em strings onde a dominante **não** aparece (coluna `alone` na saída do script). Sem isso, qualquer palavra comum na mesma frase viraria rival.

**Classes** (regras no script, `UNCONDITIONAL_SHARE = 0,95`, `COMPETITOR_SHARE = 0,10`):

- `unconditional`: uma forma (com flexão de gênero e número) cobre ≥ 95% das strings.
- `inconsistent`: o `pt` usa duas formas para o mesmo sentido (rival sozinha em ≥ 10% e ≥ 2 strings), ou as fontes (5.1, 5.2, UI) discordam entre si, ou eu marquei à mão depois de ler os exemplos (a razão está na coluna `note`).
- `contextual`: o inglês tem mais de um sentido no corpus; cada sentido é uma linha. As linhas contextuais foram definidas por mim depois de ler pares (regex de contexto, heurística).
- `unconfirmed` (**classe a mais, não estava no pedido**): nenhuma forma rival, mas a dominante cobre menos de 95% porque o `pt` omite ou reescreve o termo no resto. Provavelmente `unconditional`, mas não passa no critério estrito. Exemplo: `melee` 19 de 22.
- `no-evidence`: o termo não aparece no corpus ou nenhuma candidata apareceu.

## 2. Medido

### 2.1 Linhas por classe (230 linhas)

| Classe | Linhas |
| --- | ---: |
| `unconditional` | 137 |
| `unconfirmed` | 35 |
| `contextual` | 28 |
| `inconsistent` | 22 |
| `no-evidence` | 8 |

Uma palavra com vários sentidos ocupa várias linhas (por isso são 230 linhas e não 230 palavras). Das 137 `unconditional`, **43 têm menos de 5 strings** (a maioria das 18 perícias, das escolas e das características de classe, como `Sneak Attack` e `Divine Smite`) e 76 têm menos de 10. No CSV, toda linha com `total_count` menor que 5 leva `low n` na coluna `note`. Confira `total_count` antes de confiar numa linha `unconditional` com n pequeno.

### 2.2 Edições

Os 701 nomes que existem em 5.1 e 5.2 têm **exatamente o mesmo `pt`** nas duas edições (0 diferenças). Hoje o 5.2 herda o 5.1; não há divergência a decidir entre edições para nomes. (Texto de descrição do 5.2 quase não existe em português, então não dá para medir.)

### 2.3 Glossário que já existe no repositório

Não há arquivo de glossário nem lista de termos em `docs/`, `scripts/content/`, `.agents/` ou `messages/`. O que existe:

- `docs/plans/2026-10-15-traducoes-comunitarias.md`: promete um glossário no Weblate (#106; "saving throw" → "salvaguarda", "spell slot" → "espaço de magia"…), "começando pelo que o português do SRD 5.1 já usa". O componente de glossário no Weblate está **vazio**. Este documento é o insumo para enchê-lo.
- `docs/revisao-telas/fase-1-resultados.md`, item 6 (**decisão da Rebeca**): "Mesa", "Nível" nos espaços de magia e "Remover das preparadas". Isso explica `party` → "mesa" e a UI usar "nível" onde as regras usam "círculo".
- `docs/plans/2026-10-15-dnd-2024-novo-sistema.md:52`: termos do 2024 (espécie, maestria, talento de origem, inspiração heroica) "entram no glossário". Nenhum deles está no corpus que medi.

## 3. `inconsistent` (decisão da Rebeca; não escolhi)

Contagens são de strings. `[5.1 / 5.2 / UI]` = quantas strings de cada fonte têm a forma. n = strings com o termo em inglês.

| Termo (en) | Formas no `pt` aprovado | Onde | Exemplo real |
| --- | --- | --- | --- |
| saving throw (n=158) | salvaguarda 153 [5.1 150 / UI 3]; teste de resistência 6 [5.1 5 / UI 1]; teste de salvaguarda 2 [5.1 2] | Magias usam "salvaguarda"; texto de classe do 5.1 (druida, guerreiro, monge) usa "teste de resistência"; uma string da UI também | `r51/classes/fighter.features.indomitable.description`: "reroll a saving throw" → "jogar de novo um teste de resistência" |
| death saving throw (n=9) | teste contra a morte 7 [UI 7]; salvaguarda contra a morte 1 [UI 1]; "e contra a morte" (elíptico) 1 [5.1 1] | UI diz "teste"; magia do 5.1 diz "salvaguardas de Sabedoria e contra a morte" | `ui/savingThrows.deathSaveSuccess` → "Sucesso no teste contra a morte {count}"; `ui/features.items.combat.description` → "salvaguardas contra a morte" |
| ability check (n=24) | teste de atributo 22; teste de habilidade 2 (ambos 5.1) | Só 5.1 | `r51/classes/bard.subclasses.lore…college-of-lore` → "teste de habilidade" |
| turn, substantivo (n=145) | turno 131 [5.1 124 / UI 7]; vez 56 contando co-ocorrência, **6 sozinhas, todas UI** | Regras: "turno". UI de combate: "Sua vez", "Vez atual" | `ui/combat.yourTurn` → "Sua vez"; `ui/combat.turnPassedTo` → "Agora é a vez de {name}" |
| spell level (UI × regras) | regras 5.1: círculo 112 de 115; UI: nível 8 de 8, círculo 0 | UI × regras. Decisão da Rebeca registrada em `fase-1-resultados.md` | `ui/magicSystem.circle`: en "Circle {level}" → "Nível {level}"; `r51/spells/counterspell.higherLevel` → "4º círculo" |
| expertise (n=12) | especialização 9 [5.1 4 / 5.2 4 / UI 1]; especialista 2 [UI 2] | UI usa "Especialista" como rótulo do estado | `ui/skills.expertise` → "Especialista"; `r51/classes/bard.features.expertise-3.name` → "Especialização" |
| HP, abreviação (n=21, só UI) | PV 18; vida 4 (sozinha 3) | Só UI | `ui/combatStats.hitPointsShort` → "PV"; `ui/common.errors.domain_error_hp_max_below_one` → "A vida máxima deve ser…" |
| temporary hit points (n=10) | pontos de vida temporários 4 [5.1]; PV temporário 4 [UI]; vida temporária 2 [UI] | 5.1 × UI e dentro da UI | `ui/combatStats.tempHp` → "PV temporário"; `ui/combatStats.configureHpDescription` → "vida temporária" |
| hit point maximum (n=12) | máximo de pontos de vida 8 [5.1]; PV máximo 1 [UI] | 5.1 × UI | `ui/combatStats.hitPointsMax` → "PV máximos" |
| GM (n=102) | Mestre 63 [UI 63]; **DM 33 [5.1 33]**; "Mestre" 0 no 5.1 | **5.1 diz "DM" onde o inglês diz "GM"**; a UI diz "Mestre" | `r51/spells/animate-dead.description`: "the GM has…" → "o DM fornece…"; `ui/common.errors.party_error_gm_limit` → "mestre de no máximo 5 mesas" |
| DM (n=6) | DM 5; Mestre 1 (5.1) | só 5.1 | `r51/items/lock.description` → "O DM pode decidir"; `…college-of-lore` → "antes do Mestre determinar" |
| roll, verbo (n=50) | jogar 28 [5.1]; rolar 9 [5.1 5 / UI 4] | 5.1 prefere "jogue"; UI "role" | `r51/spells/confusion.description`: "must roll a d10" → "precisa rolar"; `r51/spells/augury…`: "rolling dragon bones" → "jogar ossos" |
| hit, verbo (n=23) | atingir 14; acertar 9; golpear 2 (todos 5.1; acertar também 1 UI) | 5.1 | `…branding-smite` → "atingir uma criatura" |
| miss (n=6) | falhar 4; errar 2; erro 1 | 5.1 | `…acid-arrow`: "On a miss" → "Se errar" |
| weapon attack (n=13) | ataque armado 7; ataque com arma 1 | 5.1 | `…haste` → "ataque armado"; `…hunter` → "ataque com arma" |
| unarmed strike (n=3) | golpe desarmado 2; ataque desarmado 1 | 5.1 | `…monk.features.ki` → "golpes desarmados" |
| Tipos de dano, UI × regras | ver 3.1 | UI × regras | `ui/spellsData.damageTypes.cold` → "Frio"; `r51/spells/cone-of-cold` → "dano gélido" |

### 3.1 Tipos de dano: rótulos da UI × texto das regras

A UI (`messages/pt.json`, `spellsData.damageTypes`) usa um vocabulário e as regras do 5.1 outro. Concordam em ácido, elétrico, necrótico, psíquico, radiante, cortante e trovejante. **Discordam em 6:**

| en | Regras 5.1 | UI |
| --- | --- | --- |
| bludgeoning | contundente (14) | **Contusão** |
| piercing | perfurante (12) | **Perfuração** |
| cold | gélido (9) | **Frio** |
| fire | ígneo (23) | **Fogo** |
| force | energético (9) | **Força** |
| poison | venenoso (6) | **Veneno** |

("Força" na UI também é o nome do atributo Strength: colisão dentro da própria UI.)

Outras: "spell" é "magia" (462 de 467), mas 4 strings do 5.1 dizem "feitiço" (`r51/spells/arcane-sword`: "ataque feitiço"). "challenge rating": "nível de desafio" 13 de 13; a abreviação CR vira "ND" (5 de 5, linha `CR`), então "nível de desafio" e "ND" convivem no 5.1 sem conflito de sentido.

## 4. `contextual` (armadilhas)

Cada sentido tem sua forma. Os exemplos são pares reais (chave do arquivo).

| Termo | Sentido → forma no `pt` | Exemplo real |
| --- | --- | --- |
| **turn** | turno de combate → **turno** (e "vez" na UI); verbo "transformar/virar" → **transformar** 8, **tornar** 8, **em pedra** 3; "Turn Undead" → **Expulsar** | `r51/spells/animal-shapes`: "Your magic turns others into beasts" → "Sua magia transforma outras criaturas em feras"; `r51/classes/cleric…channel-divinity-2`: "Turn Undead" → "Expulsar Mortos-Vivos" |
| **round** | rodada de combate → **rodada** (17 de 18); "round up/down" → **arredondar** | `r51/classes/wizard…arcane-recovery`: "(rounded up)" → "(arredondado para cima)" |
| **level** | nível de personagem/classe → **nível** (146 de 158); nível de magia/espaço → **círculo** (112 de 115, 5.1); nível de exaustão → nível | `r51/spells/acid-splash`: "when you reach 5th level" → "o 5º nível"; `r51/spells/counterspell.higherLevel`: "slot of 4th level" → "4º círculo" |
| **save** | substantivo curto de "saving throw" → **elidido**: "on a failed save" → "Se falhar" (não há palavra); botão "Save" → **Salvar** (UI, 14) | `r51/spells/blight`: "on a failed save" → "Se falhar"; `ui/common.save` → "Salvar" |
| **check** | "Strength check" → **teste** (45 de 47; "teste de Força" em 38); "Security check" → **verificação**; "Checking your parties…" → **Conferindo** | `ui/common.errors.security_widget_unavailable` → "verificação de segurança" |
| **cast** | lançar magia → **conjurar** (210 de 216); "casting gem-inlaid sticks", "cast into the Astral plane" → **lançar** | `r51/spells/augury`: "By casting gem-inlaid sticks" → "Ao lançar varetas…" |
| **target** | substantivo → **alvo** (147 de 166); verbo "target one more creature" → **atingir** 12, **afetar** 10 | `r51/spells/banishment.higherLevel`: "you can target one additional creature" → "você pode atingir uma criatura adicional" |
| **hit** | "On a hit" → **Em caso de acerto** (21 de 25); verbo → **atingir** / **acertar**; "hit points" → pontos de vida | `r51/spells/acid-arrow`: "On a hit" → "Em caso de acerto" |
| **heal / regain** | "regain hit points" → **recuperar** (32 de 34); "heal" → **curar** 18, "healing" → **cura** | `r51/spells/heal.higherLevel`: "amount of healing" → "pontos de vida recuperados" |
| **speed** | deslocamento da criatura → **deslocamento** (26 de 29); velocidade do vento → **velocidade** | `r51/spells/fog-cloud`: "a wind of moderate or greater speed" → "um vento de velocidade moderada" |
| **range** / **reach** | alcance de magia → **alcance** (184 de 192, mais "intervalo" em strings do 5.1 mal traduzidas); "reach" substantivo → **alcance**; "reach 5th level" → **alcançar/atingir/chegar** | `r51/spells/arcane-sword`: "within range" → "dentro do intervalo" |
| **cover** | cobertura de combate → **cobertura**; verbo → **cobrir** | `r51/spells/arcane-hand`: "half cover" → "meia cobertura" |
| **duration** | "for the duration" → **enquanto a magia durar** (129 de 136); substantivo → **duração** | `r51/spells/animal-friendship`: "for the spell's duration" → "enquanto a magia durar" |
| **prone** | estado → **caído**; "fall prone" (verbo) → **cair** ("cairá") | `r51/items/ball-bearings-bag-of-1-000`: "fall prone" → "cairá" |
| **condition** | estado de jogo e sentido comum → **condição** nos dois (31 de 31); 2 vezes "estado" | `r51/spells/awaken`: "the charmed condition" → "a condição de enfeitiçada" |
| **Nature** | perícia → **Natureza**; nome de característica "Nature's Ward" → **Proteção Natural** | `r51/classes/druid…nature-s-ward.name` → "Proteção Natural" |
| **beast** | tipo de criatura → **fera** (11); "beast shape" → **forma animal** | `r51/classes/druid.features.archdruid`: "your beast shape" → "Forma Animal" |
| **fire, cold, force, poison** (não dano) | fire → fogo/chama; cold → frio; force → força/energia/forçar; poison → veneno/envenenar | `r51/spells/floating-disk`: "plane of force" → "feito de energia" |
| **light** | luz → **luz**; armadura leve → **leve** | `ui/proficiencies.armor.light` → "Armaduras leves" |
| **rest** (verbo) | descansar | n=11 |

## 5. `unconfirmed` (35 linhas, provavelmente seguras)

Nenhuma forma rival, mas a dominante cobre menos de 95% porque a string no `pt` omite ou reescreve o termo. Os principais: `attack roll` jogada de ataque 29 de 31; `hit points` pontos de vida 80 de 85; `target` alvo 147 de 166; `melee` corpo a corpo 19 de 22; `concentration` concentração 17 de 18; tipos de criatura (aberração 4/5, constructo 16/17, dragão 9/11, elemental 15/16, feérico 17/18, ínfero 18/19, humanoide 14/15, gosma 2/3, planta 14/17); `Huge` enorme 7/8; as classes Druida, Paladino, Patrulheiro e Mago (nomes de subclasse como "Druid Circle" não repetem o nome da classe). Lista completa: linhas com `class = unconfirmed` no CSV.

## 6. `no-evidence` (8)

`party` em texto de regra (só aparece na UI), `skill check`, `difficulty class` por extenso (só a sigla CD aparece), `Gargantuan`, e as moedas `sp`, `cp`, `ep`, `pp` (os arquivos de itens não têm preço). A moeda `gp` aparece 4 vezes e vira **po**; as outras não podem ser inferidas daqui.

## 7. Correções à lista de 33 termos do `poc2-bench.mjs`

Rodei as 33 entradas sobre o corpus inteiro (`--check33`). Passam bem: spell slot (100%), advantage/disadvantage (100%), bonus action (100%), todos os tipos de dano exceto force, frightened, blinded, deafened, incapacitated, stunned, unconscious, cantrip.

**Erradas ou perigosas**

1. **`/\bcast(s|ing)?\b/i` → `conjurar` (`/conjur/i`)**: 215 de 226 (95%), mas a verificação `/conjur/` casa "conjuração" em strings sem o verbo (a escola Conjuration e "Spellcasting" são ambas "conjuração"), então o acerto é em parte ilusório. E "cast" tem outro sentido: "casting gem-inlaid sticks", "cast into the Astral plane" → **lançar** (3 strings), e "spells can't be cast" saiu "lançadas". Restringir à construção "cast a/the spell" e aceitar `lan[çc]` só nesses casos.
2. **`/\bprone\b/i` → `caído` (`/caíd/i`)**: 9 de 10. "fall prone" (verbo) sai "cairá" (`ball-bearings-bag-of-1-000`); o teste `/caíd/` falha. Aceitar também `ca(ir|irá|i)`.
3. **`/\bhit points?\b/i` → `pontos de vida`**: vale para regras (76 de 76), **não para a UI**, que usa "PV" (`combatStats.hitPointsShort`, `hitPointsMax`, `tempHp`). Sem regra para HP/PV/vida, o motor vai "corrigir" a UI para o termo errado ou o contrário.
4. **`/\bparalyzed\b/` → `/paralisad/`**: falha em "paralisar" (tag de exibição, `freedom-of-movement`). Usar `/paralis/`.
5. **`/\brestrained\b/` → `/contid/`**: 12 de 13; "conter" (tag) e "preso" (1) escapam.
6. **`/\bcharmed\b/` → `/enfeitiçad/`**: 30 de 31; verbo ("enfeitiçou") e uma tag "encantada" escapam.
7. **`/\bforce damage\b/` → energético**: 9 de 11; a UI chama de "Força". **fire/cold/poison**: a UI chama de Fogo/Frio/Veneno; o glossário só vale para as regras.
8. **`/\bability checks?\b/` → teste de atributo**: 22 de 24; "teste de habilidade" aparece 2 vezes. E não cobre "Strength check", "Wisdom (Perception) check" (47 strings, todas "teste de …"). Acrescentar `\b(Strength|…) (\(.*\) )?checks?\b` → "teste".
9. **`/\bsaving throws?\b/` → salvaguarda**: 153 de 158; 6 strings dizem "teste de resistência" (inconsistência do aprovado, seção 3).
10. **`/\bmelee\b/` → corpo a corpo**: 19 de 22; 3 omitidas.
11. **`/\bundead\b/` → morto-vivo**: 46 de 47; o 5.1 usa "mortos-vivos" e "morta-viva" (a regex cobre).

**Entradas que fazem falta** (todas com evidência clara): `turn`/`turno` (com a exceção "vez" da UI), `round` rodada, `initiative` iniciativa (22 de 22), `action` ação (156 de 158), `reaction` reação, `proficiency bonus` bônus de proficiência (14 de 14), `armor class` Classe de Armadura / `AC` CA (20 de 20), `DC` CD (33 de 33), `creature` criatura, `target` alvo, `range` alcance, `ranged` à distância, `difficult terrain` terreno difícil, `long rest`/`short rest` descanso longo/curto, `hit dice` dado de vida, `challenge rating` nível de desafio, `willing creature` criatura voluntária, `spellcasting ability` atributo de conjuração, `spell attack` ataque mágico, `Wild Shape` Forma Selvagem, `Channel Divinity` Canalizar Divindade, `Sneak Attack` Ataque Furtivo, `Rage` Fúria, as 6 habilidades, as 18 perícias, as 12 classes, os tipos de criatura, os tamanhos e `gp` → po. Cuidado: **Divine Smite → "Destruição Divina"** (não "Punição") e **Second Wind → "Recuperar o Fôlego"**.

**Largas demais ou ambíguas**

- `spell` → feitiço/magia: usar só **magia** (462 de 467); "feitiço" é erro isolado do 5.1.
- Nenhuma entrada cobre `GM`/`DM`: o 5.1 diz **DM** e a UI diz **Mestre** (seção 3).
- Sem regra de unidade (a UI e o 5.1 usam metros; já tratado no script de conversão).

## 8. Interpretação (minha leitura, não é medição)

- O português das **regras do 5.1** é bastante consistente nos termos centrais (salvaguarda, espaço de magia, ação bônus, vantagem, jogada de ataque, nomes de condição, de classe, de perícia e de atributo). As exceções são pequenas e concentradas em textos de classe do 5.1 (provavelmente traduzidos em outra leva que o texto das magias).
- As discordâncias que importam para um motor de tradução automática são **UI × regras**: Mestre/DM, vez/turno, PV/pontos de vida, nível/círculo, os 6 tipos de dano, Especialista/especialização. Um glossário único não resolve sozinho; dá para ter dois perfis (regras e interface), mas isso é decisão da Rebeca.
- Dois pares de palavras colidem no próprio português: **"conjuração"** (Spellcasting e a escola Conjuration) e **"Força"** (atributo e rótulo do dano force na UI).
- O 5.1 em português ainda tem restos de tradução automática/antiga ("dentro do intervalo", "5 pés", "ataque feitiço", "[20-foot-radius sphere]"). Tratei como evidência de fraqueza do corpus, não como regra.

## 9. Não verificado

- Alinhamento por **string**, não por palavra: uma string com o termo duas vezes e duas traduções conta uma vez em cada forma.
- As heurísticas de contexto (nível de magia × de personagem; turn substantivo × verbo; hit substantivo × verbo; dano × substância) são regex que escrevi; não conferi todas as linhas.
- Candidatas em português só as que eu pensei ou que apareceram nos pares; pode existir uma forma não listada (ver coluna `none` no CSV e `--none`).
- 5.2: só nomes. Termos novos do 2024 (maestria, talento de origem, espécie, inspiração heroica, Bloodied) **não** estão no corpus.
- Descrições de `conditions` em português estão **vazias** no 5.1 e no 5.2: nada medido além dos 15 nomes e das tags de exibição.
- Nomes de característica de classe (centenas) só foram medidos para 17 deles; o resto está em `classes.json` e pode ser alinhado por chave.
- UI de espanhol e sueco: fora do escopo (vêm do Weblate).
- Moedas sp, cp, ep, pp: sem evidência.
- Plural/gênero: coluna `inflections` lista só o que apareceu; formas não observadas não estão lá.

## Decisões da Rebeca (27/11)

Valem para o texto novo (SRD 5.2). O texto aprovado do 5.1 não é alterado pelo pipeline; alinhar o 5.1 é trabalho à parte, em PR próprio.

| Termo | Decisão | O que muda em relação ao 5.1 |
|---|---|---|
| Nível de magia e de espaço de magia | **nível** | O 5.1 diz "círculo" em 112 de 115 textos; a interface já diz "nível" |
| Saving throw | **salvaguarda** | Nada; 6 textos de classe do 5.1 dizem "teste de resistência" |
| GM | **Mestre** | O 5.1 diz "DM" em 33 textos |
| Roll (verbo) | **rolar** | O 5.1 diz "jogar" em 28 textos. "Jogada de ataque" continua |
| Tipos de dano | **Os dois ficam:** adjetivo na frase ("dano ígneo"), substantivo no rótulo da interface ("Fogo") | Nada |

### Ainda sem decisão: proposta de usar a forma dominante

Interpretação minha; vale até a Rebeca dizer o contrário. Contagens na lista de inconsistentes, acima.

| Termo | Proposta |
|---|---|
| Death saving throw | salvaguarda contra a morte (segue a decisão de "salvaguarda"; a interface hoje diz "teste contra a morte" em 7 textos) |
| Ability check | teste de atributo |
| Turn (substantivo) | turno nas regras; "vez" só nos rótulos de combate da interface |
| Expertise | especialização |
| Temporary hit points | pontos de vida temporários nas regras; "PV" só na interface |
| Hit (verbo) | atingir; "em caso de acerto" para "on a hit" |
| Miss | falhar |
| Weapon attack | ataque armado |
| Unarmed strike | golpe desarmado |

O CSV ainda marca essas linhas como `inconsistent`; ele é atualizado quando o glossário entrar no pipeline.
