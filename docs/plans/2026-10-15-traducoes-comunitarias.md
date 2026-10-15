# Traduções comunitárias: vários idiomas e vários sistemas

**Data:** 2026-10-15
**Status:** planejamento. Complementa `2026-10-15-5etools-e-traducoes.md` (de onde vêm os dados
mecânicos) e vale para os sistemas novos (`2026-10-15-dnd-2024-novo-sistema.md`,
`2026-10-15-feiticeiros-e-maldicoes.md`).

O objetivo é oferecer o conteúdo de regras **em vários idiomas, não só pt-BR e inglês, e para
vários sistemas**, feito em comunidade. Em vez de criar uma comunidade de tradução do zero, o
plano é **usar e contribuir com as traduções que a comunidade do Foundry VTT já mantém**.

## O que já existe

- **O texto em pt da nossa seed veio do módulo Foundry VTT Brasil / dnd5e**
  ([gitlab.com/fvtt-brasil/dnd5e](https://gitlab.com/fvtt-brasil/dnd5e)). A Bola de Fogo, por
  exemplo, tem o mesmo texto nos dois, e os dois têm as 319 magias do SRD 5.1.
  - Licença do módulo: MIT (Copyright (c) 2020 Cauã Pessoa). O conteúdo é tradução do SRD 5.1
    (CC-BY-4.0). **Os dois pedem crédito**, e até agora o projeto não dava (corrigido no PR de créditos:
    `NOTICE.md` e Termos; ver "Créditos").
  - Formato Babele: um JSON por compêndio (`dnd5e.spells.json`, `dnd5e.classes.json`,
    `dnd5e.monsters.json`…), com `entries` indexadas pelo nome em inglês e `name`/`description`
    traduzidos. A descrição vem em HTML.
  - Tradução feita no Crowdin da comunidade Foundry (`fvtt.crowdin.com`).
  - Parado desde junho de 2023 e só com o SRD 5.1. **Não existe pt-BR do SRD 5.2 (2024)** no
    Foundry ainda.
- **Babele é o padrão de tradução de compêndio do Foundry**, para todos os sistemas e idiomas.
  Exemplos: alemão (`foundryvtt-dnd5e-lang-de`, e um parcial do 2024), espanhol do SRD 2024
  (`translate-dnd5e-sdr2-es`), italiano (`dnd5e-it-translation`). Outros sistemas (Pathfinder 2e
  etc.) seguem o mesmo esquema.

## Proposta

### 1. Importar de várias fontes por adaptadores

O script de importação (em `scripts/`, gerando migração de seed como hoje) passa a ter um
adaptador por formato, todos convertendo para um formato intermediário nosso:

- **Babele / Foundry**: textos traduzidos de qualquer idioma e sistema que tenha módulo.
  - Mapear a chave (nome em inglês) para o nosso `external_index`.
  - Converter o HTML e as marcações do Foundry (`@UUID[...]{texto}`, `[[/r 8d6]]`,
    `&Reference[...]`) para o nosso formato (Markdown + marcações de dado/link).
  - Tratar os originais entre colchetes que o pt-BR usa ("6 metros [20-foot-radius sphere]"):
    manter, esconder ou mostrar como dica, a decidir.
- **5etools**: dados mecânicos e texto em inglês (ver o outro plano).
- **Nosso próprio formato**: para o que não existir em nenhuma fonte.

Uma fonte nova (idioma ou sistema) passa a ser configuração do importador, não código novo.

### 2. Registro de fontes e licenças

Um arquivo versionado (ex.: `content-sources.json`) com cada fonte: nome, URL, versão/commit,
licença, autores, idiomas, sistemas e o texto de atribuição exigido.

- O importador **recusa fonte sem licença registrada**.
- O mesmo registro gera a página de créditos do site e o `NOTICE.md`.
- Licenças esperadas: SRD 5.1 e 5.2 da WotC (CC-BY-4.0), módulos Foundry (normalmente MIT, conferir
  um por um), Pathfinder 2e (ORC). **Conteúdo proprietário** (ex.: Tormenta20, livros fora do
  SRD) não entra sem autorização.

### 3. Idiomas sem limite fixo

- `spell_translations.locale` já é texto livre, mas hoje guarda `pt` e `en`. Passar a usar
  códigos BCP 47 (`pt-BR`, `en`, `es`, `de`…). Migração simples de `pt` → `pt-BR`.
- **Fallback:** idioma pedido → idioma base (`pt-BR` → `pt`) → `en`. Mostrar aviso discreto quando
  o texto vier de outro idioma.
- `is_verified` e a origem da tradução (`source_id`) por linha, para saber de onde veio e se foi
  revisada.
- A interface do app (`messages/*.json`) segue o mesmo caminho: novos idiomas em `next-intl`
  quando houver tradução.

### 4. Contribuir de volta em vez de copiar

- Correções que fizermos nas traduções vão para o Crowdin/repo de origem, não ficam só no nosso
  banco. Assim Foundry e rpg-world melhoram juntos.
- **Colaboração concreta:** ajudar a manter o módulo pt-BR do dnd5e e puxar a tradução do
  **SRD 5.2 em pt-BR** no Crowdin do Foundry. Serve aos dois projetos e é o que falta hoje.
- Contato antes: falar com os mantenedores (Foundry VTT Brasil, Discord do Foundry) sobre a
  intenção de usar e contribuir.

### 5. O que fica nosso

- Glossário por idioma e por sistema (reaproveitando o do Foundry quando existir).
- Tradução automática só como rascunho, gravada com `is_verified = false`, e só para o que não
  existir em nenhuma fonte comunitária.

## Créditos

Feito no PR de créditos (junto com este plano):

- `NOTICE.md` na raiz com a atribuição do SRD 5.1 (CC-BY-4.0), o aviso de não afiliação com a
  WotC e o crédito e a licença MIT da tradução Foundry VTT Brasil.
- Seção "Conteúdo de jogo e créditos" nos Termos de Uso (pt e en).
- Link no README.

Depois, com o registro de fontes, essa seção passa a ser gerada a partir dele.

## Perguntas em aberto

- De onde veio o texto em inglês da seed (5e SRD API? outro)? Registrar a fonte.
- Os originais entre colchetes do pt-BR ("[20-foot-radius sphere]"): mostrar ou esconder?
- Babele indexa pelo nome em inglês: o que fazer quando o nome muda entre SRD 5.1 e 5.2?

## Ordem sugerida

1. Créditos (PR de créditos).
2. `locale` em BCP 47 + fallback de idioma.
3. Registro de fontes e licenças.
4. Adaptador Babele, reimportando o pt-BR atual e conferindo que nada muda sem querer.
5. Conversar com a comunidade Foundry pt-BR e combinar a tradução do SRD 5.2.
6. Outros idiomas do dnd5e (es, de, it) e outros sistemas, conforme as fontes.
