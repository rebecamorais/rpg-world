# D&D 2024 ("5.5") como um novo sistema

**Data:** 2026-10-15
**Status:** ideia, nada decidido. Depende em parte do plano `2026-10-15-5etools-e-traducoes.md`.

A ideia é testar o suporte a mais de um sistema com o D&D 2024, que divide quase tudo com o 5e de 2014. Se a separação entre "núcleo comum" e "regras de cada edição" funcionar aqui, ela serve
de modelo para os outros sistemas que já estão no enum (`ezd6`, `pathfinder_2e`).

## Como está hoje

- O enum `rpg_system` tem `dnd_5e`, `ezd6` e `pathfinder_2e`; só `dnd_5e` é implementado.
- `SupabaseCharacterRepository.mapToDomain` lança erro para qualquer sistema que não seja
  `dnd_5e`; os dados específicos ficam em `system_data` (JSON).
- As regras vivem em `shared/systems/dnd5e` (`calculations.ts`, `rules.json`, `constants/`).
- Magias têm `system`, mas o `external_index` é único sem ele, então não dá para ter o Fireball
  das duas edições.

## O que é igual e o que muda

**Igual (núcleo comum):** os 6 atributos e modificadores, bônus de proficiência por nível, perícias,
testes de resistência, CA/iniciativa/deslocamento, PV e dados de vida, tabela de espaços de magia,
salvaguardas contra morte, moedas, XP por nível.

**Muda no 2024 (o que já se sabe; conferir no SRD 5.2):**

- "Raça" vira **espécie**; os aumentos de atributo saem da espécie e vão para o **antecedente**,
  que também dá um **talento de origem**.
- **Maestria em armas** (propriedades novas por arma para algumas classes).
- **Exaustão** passa a ser −2 por nível em testes de d20, em vez da tabela de efeitos.
- **Inspiração heroica** no lugar da inspiração.
- Subclasse no 3º nível para todas as classes.
- **Muitas magias foram reescritas** (texto e às vezes mecânica); algumas trocaram de nome.

## Proposta

- **Banco:** novo valor no enum (`dnd_2024`, nome a decidir). Personagem de uma edição não vira
  da outra automaticamente (conversão fica fora do escopo).
- **Código compartilhado:** extrair de `shared/systems/dnd5e` um núcleo (`dnd-core` ou similar)
  com o que é igual, e deixar `dnd5e` e `dnd2024` com as diferenças (tipos, cálculos,
  `rules.json`, constantes). Os componentes da ficha que só usam o núcleo continuam iguais.
- **Domínio:** `DnD2024Character` com o que muda (espécie, talento de origem, maestrias,
  exaustão por nível); `mapToDomain` escolhe a classe pelo `system`.
- **Magias:** linhas separadas por edição, com a chave `(system, source, external_index)` do
  plano do 5etools. `character_spells` só aceita magia do mesmo sistema do personagem
  (validação no caso de uso, talvez também no banco).
- **Interface:** escolha da edição ao criar o personagem; na ficha, os blocos que mudam (espécie
  e antecedente, exaustão, maestrias) por sistema, o resto compartilhado. A busca de magias filtra
  pela edição do personagem.
- **Tradução:** mesma regra do outro plano, `en` como base e `pt` lado a lado. Os termos novos do
  2024 entram no glossário (espécie, maestria, talento de origem, inspiração heroica).

## Perguntas em aberto

- Nome do sistema na interface: "D&D 5e (2014)" e "D&D 5e (2024)"? "D&D 2024"?
- Vale oferecer conversão de personagem 2014 → 2024 algum dia, ou nunca?
- Primeiro passo pode ser só o núcleo comum + magias 2024, sem as mecânicas novas na ficha?

## Ordem sugerida

1. Esquema de magias com `system`/`source` na chave (compartilhado com o plano do 5etools).
2. Extrair o núcleo comum de `shared/systems/dnd5e` sem mudar comportamento (testes atuais
   continuam passando).
3. Enum + `DnD2024Character` + mapeamento no repositório, com a ficha mostrando só o comum.
4. Magias do SRD 5.2 pelo importador do 5etools.
5. Partes específicas da ficha: espécie/antecedente, exaustão, maestrias.
