# Feiticeiros & Maldições (Jujutsu Kaisen) como sistema

**Data:** 2026-10-15
**Status:** planejamento, nada implementado. Vem antes dos próximos passos do D&D (vida e magia,
limites de uso).

Feiticeiros & Maldições (F&M) é um RPG brasileiro feito por fãs, baseado em Jujutsu Kaisen. A
base lembra o D&D 5e (d20, seis atributos, perícias, nível, bônus de maestria), mas tudo gira em
torno da **energia amaldiçoada**: técnica inata, aptidões, expansão de domínio, e um segundo
"recurso de vida", a **integridade** da alma.

## Decisões já tomadas

- **Só a ficha e as regras.** O app traz os campos, os cálculos (PV, PE, defesa, perícias,
  salvaguardas) e listas curtas (origens, especializações, perícias, aptidões). Técnicas,
  habilidades, expansão de domínio e invocações **o jogador escreve**. O app não copia texto do
  livro: o sistema é de fãs e tem autor.
- **Sistema próprio, reaproveitando o que é genérico.** Novo valor no enum e um módulo
  `shared/systems/feiticeiros` próprio. Não passa pela extração do "núcleo D&D" do plano do
  D&D 2024; reaproveita só o que já é de qualquer sistema (ver abaixo).
- **Versão base: Livro de Regras v2.5.** É a estável mais recente; a v3.0 ainda está em prévia e
  troca nomes (Combatente/Conjurador no lugar de Especialista em Combate/Técnica). Tudo que muda
  entre versões fica num `rules.json`, para trocar de versão ser troca de dados, não de código.

## O que entra na ficha (v2.5)

Levantado de modelos de ficha v2.0/v2.5 e de trechos do livro; **a confirmar no livro** onde
indicado.

| Bloco              | Campos                                                                                                                                                                                      | Comparando com o D&D                                       |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Identidade         | Nome, **origem**, **especialização**, nível, experiência, **grau**, nome da técnica                                                                                                         | Raça → origem; classe → especialização; grau é novo        |
| Atributos          | Força, Destreza, Constituição, Inteligência, Sabedoria, **Presença** (10 é a média; modificador como no D&D)                                                                                | Carisma → Presença                                         |
| Maestria           | Bônus de maestria por nível (+2 no nível 1)                                                                                                                                                 | Igual ao bônus de proficiência                             |
| Perícias           | Lista própria, cada uma com seu atributo (ex.: Feitiçaria INT, Ocultismo SAB, Enganação PRE, Furtividade DES…). **Lista completa a confirmar.**                                             | Parecida, com perícias novas                               |
| Salvaguardas       | **Fortitude, Reflexos, Vontade, Integridade**                                                                                                                                               | Quatro em vez de seis (uma por atributo)                   |
| Defesa             | **Defesa** (v2.5), com partes natural/uniforme/escudo                                                                                                                                       | CA                                                         |
| Recursos           | **PV** (atual/máx), **PE** — pontos de energia amaldiçoada (atual/máx), **Integridade** (atual/máx). Restringido usa **Pontos de Vigor** no lugar de PE.                                    | PV igual; PE e integridade são novos; sem espaços de magia |
| Testes de morte    | Sucessos e falhas                                                                                                                                                                           | Igual                                                      |
| Perfil Amaldiçoado | Técnica inata (nome + descrição livre), **aptidões amaldiçoadas** (ex.: Aptidão em Aura; **lista e escala a confirmar**), **expansão de domínio** (descrição + efeitos), votos vinculativos | Substitui a aba de magias                                  |
| Habilidades        | Habilidades de especialização e talentos: lista de texto livre (nome, custo em PE, descrição)                                                                                               | Como "features" escritas pelo jogador                      |
| Invocações         | Para o Controlador: lista de invocações (nome, PV, notas)                                                                                                                                   | Novo                                                       |
| Inventário e lore  | Iguais ao do D&D (uniforme no lugar de armadura)                                                                                                                                            | Reaproveitado                                              |

**Origens (v2.5):** Inato, Herdado, Sem Técnica (comuns); Derivado, Restringido, Feto
Amaldiçoado, Corpo Amaldiçoado (raras). Regras que a ficha precisa respeitar: o Inato ganha 3
pontos extras de atributo; o Sem Técnica não tem técnica nem pode ser Especialista em Técnica; o
Restringido só pode ter a especialização Restringido, não tem PE (usa Vigor) e não faz
multiclasse.

**Especializações (v2.5):** Lutador, Especialista em Combate, Especialista em Técnica,
Controlador, Suporte, Restringido.

### Cálculos (a confirmar e completar no livro)

O que já apareceu nas fontes; o resto fica numa tabela do `rules.json` preenchida a partir do
livro antes de codar.

| Regra                                | Valor encontrado                                                                               |
| ------------------------------------ | ---------------------------------------------------------------------------------------------- |
| PV no 1º nível                       | Lutador 12 + CON; Especialista em Combate 12 + CON; Especialista em Técnica 10 + CON; demais ? |
| PV por nível                         | ?                                                                                              |
| PE no 1º nível / por nível           | Lutador 9 / +3; Suporte ? / +5; demais ?                                                       |
| Vigor (Restringido)                  | ?                                                                                              |
| Bônus de maestria por nível          | +2 no 1º nível; progressão ?                                                                   |
| Limite de gasto de PE por habilidade | 2 + nível (regra opcional; não vale para técnica e habilidades amaldiçoadas)                   |
| Defesa                               | ?                                                                                              |
| Integridade (máximo e o que a reduz) | ?                                                                                              |
| Nível máximo e relação nível × grau  | ?                                                                                              |

## Como encaixa no código

**O que já é genérico e se reaproveita:** colunas `attributes`, `hp_current`, `hp_max`,
`system_data` (JSON), `theme_color`, `avatar_url`; `Character` (entidade base), `Attributes` e
`HealthPoints`; lore; inventário; `NumberInput`, `AttributeCard`, `HealthPointsCard`,
`DeathSavesCard`, `SaveControls`, `SheetPage`, `CharacterSheetShell`. A rota já tem
`/system/[system_name]/character/[id]`, e os links já usam `character.system`.

**O que hoje assume D&D e precisa abrir:**

- `GameSystem = 'DnD_5e'` (`shared/types/character.ts`) e `createCharacterSchema`
  (`z.literal('DnD_5e')`).
- `mapToDomain` lança erro para outro sistema; o salvar monta `system_data` só para D&D.
- `updateCharacterSchema` é o do D&D. Precisa de um schema por sistema, escolhido pelo sistema
  do personagem salvo (não pelo que o cliente diz).
- `CharacterContext` é tipado como `DnD5eCharacter` (21 usos no frontend). Proposta: o contexto
  passa a guardar `SheetCharacter = DnD5eCharacter | FeiticeirosCharacter`, com hooks que
  estreitam o tipo (`useLoadedDnd5e()`, `useLoadedFeiticeiros()`); os componentes do D&D só
  trocam o hook, sem mudar a lógica.
- As abas da ficha (`CharacterNavSection`) e a página de status escolhem os componentes pelo
  `character.system` (os dados mandam; a URL só acompanha). F&M: Status, Perfil Amaldiçoado,
  Lore, Inventário. Sem a aba de magias.
- `NewCharacterForm` passa a listar o sistema novo.

**Novo:**

- `shared/systems/feiticeiros/`: `types.ts`, `constants/` (atributos, perícias, salvaguardas,
  origens, especializações, aptidões), `rules.json` (tabelas da versão), `calculations.ts`
  (modificador, maestria, PV/PE iniciais e por nível, perícia, salvaguarda), `factory.ts`.
- `FeiticeirosCharacter` no domínio, com o mapeamento de ida e volta para `system_data`.
- Validações de regra no caso de uso (não só no schema): Restringido só com especialização
  Restringido e sem PE; Sem Técnica sem Especialista em Técnica.
- Componentes da ficha F&M: cabeçalho (origem, especialização, grau, técnica), recursos
  (PV, PE/Vigor, Integridade), salvaguardas, perícias, Perfil Amaldiçoado e listas de
  habilidades/invocações.

**Chaves:** atributos em inglês como no D&D (`STR DEX CON INT WIS` + `PRE` para Presença), e
rótulos pelas traduções. Enum do banco e id no app a decidir; proposta
`feiticeiros_maldicoes` / `Feiticeiros_Maldicoes` (o repositório já converte com
`toLowerCase()`).

## Banco

- `ALTER TYPE rpg_system ADD VALUE 'feiticeiros_maldicoes'`, numa migration só para isso (valor
  novo de enum não pode ser usado na mesma transação em que é criado).
- É aditiva, mas **o merge na main aplica a migration em produção**. Entra no PR da fundação,
  com aviso no corpo do PR.
- Nada de tabelas novas: tudo do F&M cabe em `system_data`. Magias continuam só do D&D.

## Tradução

O sistema é brasileiro: **português é o texto de referência**, e o inglês segue os termos da
tradução oficial do anime (Cursed Energy, Innate Technique, Domain Expansion, Binding Vow,
Heavenly Restriction). Glossário no próprio plano de tradução quando ele andar.

## Testes

- `calculations.unit.test.ts` com as tabelas do livro (um caso por especialização).
- Schema e caso de uso: regras de origem/especialização, schema escolhido pelo sistema salvo
  (um personagem D&D não aceita campos do F&M e vice-versa).
- Repositório: ida e volta de `system_data`.
- Componentes: ficha F&M com `renderWithCharacter` generalizado para os dois sistemas.
- E2E: criar um personagem F&M, editar e salvar; a ficha D&D continua igual (os testes atuais).
- Baselines visuais da ficha F&M (desktop e celular).

## Fora do escopo

- Catálogo de técnicas, habilidades ou maldições do livro (precisaria de autorização do autor).
- Rolagem de dados e automação de combate.
- Fichas de maldições/NPCs do Grimório das Maldições.
- Conversão de personagem entre sistemas.

## Perguntas em aberto

- **Versão:** a mesa joga a v2.5? Se for esperar a v3.0, o plano muda só no `rules.json` e nos
  nomes das especializações.
- **Nome no app:** "Feiticeiros & Maldições"? Com "(Jujutsu Kaisen)" para quem procura?
- **Regras a confirmar no livro:** a tabela de cálculos acima, a lista completa de perícias e de
  aptidões (e se aptidão tem nível), como funciona a Integridade, nível máximo e grau.
- **Multiclasse:** guardar só a especialização principal no começo, ou já uma lista com níveis?
- **Grau:** campo livre ou derivado do nível?
- **Aparecer para todos já na fundação**, ou esconder o sistema na criação até a ficha básica
  existir?

## Ordem sugerida

Um PR por fase, um commit por item.

0. **Regras no papel:** preencher a tabela de cálculos e as listas a partir do livro v2.5 (com
   você, que tem o livro). Sem isso, as fases 2 e 3 chutam números.
1. **Fundação:** migration do enum; `GameSystem` como união; `shared/systems/feiticeiros` com
   tipos, constantes e `rules.json`; entidade, mapeamento, schema por sistema e criação. O
   contexto da ficha vira `SheetCharacter` com os hooks que estreitam o tipo (o D&D não muda de
   comportamento). Ficha F&M só com cabeçalho e lore.
2. **Ficha de status:** atributos, maestria, perícias, salvaguardas, defesa, PV/PE/Vigor,
   integridade, testes de morte.
3. **Perfil Amaldiçoado:** técnica, aptidões, expansão de domínio, votos, habilidades e
   invocações.
4. **Acabamento:** baselines visuais, a11y, textos em inglês, e liberar o sistema na criação de
   personagem.

## Fontes

Modelos de ficha e trechos dos livros publicados por terceiros; conferir tudo no livro oficial.

- [Livro de Regras v2.5 (Scribd)](https://pt.scribd.com/document/883154471/Feiticeiros-Maldicoes-Livro-de-Regras-v2-5)
- [Livro de Regras v2.5.2 (Scribd)](https://pt.scribd.com/document/989085254/Feiticeiros-Maldicoes-Livro-de-Regras-v2-5-2)
- [Livro Básico v3.0, prévia 1 (Scribd)](https://pt.scribd.com/document/808516630/Feiticeiros-Maldicoes-Livro-Basico-v3-0-Previa-1)
- [Modelo de ficha v2.5 (Scribd)](https://scribd.com/document/885333895/Modelo-de-Ficha-Feiticeiros-Maldicoes-2-5-Ficha-Pessoal)
- [Modelo de ficha v2.0 (Scribd)](https://pt.scribd.com/document/744300107/Modelo-de-Ficha-Feiticeiros-e-Maldicoes-v2-0)
- [Livro Básico v1.0 (AnyFlip)](https://anyflip.com/pyrag/qxba/basic)
