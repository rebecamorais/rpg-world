# Traduções comunitárias: vários idiomas e vários sistemas

**Data:** 2026-10-15 (reescrito em 2026-10-23)
**Status:** entregue no #101 a base (Crowdin funcionando para a interface e para as magias). Este plano
agora lista o que já existe, como liberar um idioma novo e o que ficou para depois.

O objetivo continua o mesmo: conteúdo de regras e interface **em vários idiomas, feito em
comunidade**, sem tradução automática.

## Como funciona hoje

- **Crowdin**, projeto público [`rpgworld`](https://crowdin.com/project/rpgworld) (id 940585).
  Idiomas no projeto: português, espanhol e sueco.
- **Fontes em inglês** (`crowdin.yml`): `messages/en.json` (interface) e
  `content/dnd5e/*/i18n/en/*.json` (magias do SRD 5.1 e 5.2, um arquivo por livro).
- **Action `crowdin.yml`:** envia o inglês quando ele muda na `main` e, todo dia, abre ou atualiza
  o PR "i18n: traduções do Crowdin" com o que foi **aprovado** (`export_only_approved`). O PR é
  revisado e entra como qualquer outro.
  - Um PR aberto pela Action não roda os testes (o `GITHUB_TOKEN` não dispara outros
    workflows): rodar `npm run test:unit` no branch `l10n/crowdin` antes do merge.
- **O que falta traduzir aparece em inglês:** na interface, a chave vem em inglês (o next-intl
  quebra com chave faltando); nas magias, o campo vem vazio ou some e o `FileSpellCatalog` usa o
  inglês daquele campo, com o selo "Em inglês" quando é a descrição.
- **Tradução editada no repositório** (por exemplo, o português de uma funcionalidade nova): quando
  chega na `main`, a Action envia as traduções do repositório para o Crowdin já aprovadas; sem
  isso, o próximo PR do Crowdin as voltaria para o inglês. Ela sobrescreve no Crowdin o que estiver
  diferente, então, se o PR do Crowdin estiver aberto com mudanças nos mesmos textos, fazer o merge
  dele antes. O merge do próprio PR do Crowdin não reenvia nada. Para enviar à mão, rodar a Action
  com `upload_translations = true`.
- **Origem do que já existe:** as magias do SRD 5.1 em português vieram do módulo
  [Foundry VTT Brasil / dnd5e](https://gitlab.com/fvtt-brasil/dnd5e) (MIT, sobre o SRD 5.1 em
  CC-BY-4.0); os créditos estão no `NOTICE.md` e nos Termos. Não existe tradução do SRD 5.2 em
  português em nenhuma fonte: as 339 magias de 2024 são traduzidas do zero no Crowdin.

## Liberar um idioma novo no app

Os arquivos de um idioma (`messages/es.json`, `content/dnd5e/*/i18n/es/`) chegam pelo PR do
Crowdin antes de o app oferecer o idioma; enquanto ele não é liberado, ficam no repositório sem
efeito.

**Quando liberar:** a interface (`messages/<idioma>.json`) aprovada por inteiro. As magias podem
estar incompletas: o que faltar aparece em inglês com o selo.

**O que mudar** (um PR por idioma):

1. `src/i18n.ts`: o código em `locales`.
2. `src/frontend/components/LanguageSwitcher.tsx`: a opção no seletor, e o nome do idioma em
   `messages/*.json` (a chave que o seletor usa, hoje `en` e `pt`).
3. `src/backend/contexts/spells/infrastructure/srd-spells.ts`: carregar
   `i18n/<idioma>/spells.json` de cada livro (hoje só `pt` está fixo). No primeiro idioma novo,
   vale trocar a lista fixa por uma leitura dos idiomas liberados em `src/i18n.ts`.
4. `app/layout.tsx`: o `locale` do Open Graph (`pt_BR`, `en_US`…).
5. `src/frontend/components/landing/FeatureShowcase.tsx`: as capturas da landing existem só em
   `pt` e `en`; o idioma novo usa as de `en` até ter as suas (`npm run showcase`).
6. `public/llms.txt` e a página de funcionalidades, que listam os idiomas.
7. Conferir no `next dev`: ficha, lista de magias (busca com acento do idioma), Termos.

## Ficou para depois

- **Registro de fontes e licenças** (`content-sources.json`): cada fonte com URL, versão, licença,
  idiomas e o texto de atribuição; o importador recusaria fonte sem licença e o `NOTICE.md` e os
  Termos seriam gerados dele. Hoje as fontes são poucas (SRD 5.1 e 5.2, 5e SRD API, 5etools,
  Foundry VTT Brasil) e o `NOTICE.md` à mão dá conta; vale fazer quando entrar o primeiro sistema novo
  (Feiticeiros & Maldições) ou a primeira fonte de tradução externa.
- **Adaptador Babele (Foundry)** para importar traduções de outros idiomas que já existem nos
  módulos do Foundry (alemão, espanhol do SRD 2024, italiano). Só se algum idioma for liberado e
  o módulo dele tiver licença compatível; senão, o Crowdin basta.
- **Contribuir de volta:** levar ao Foundry VTT Brasil as correções que fizermos no português e,
  quando o SRD 5.2 estiver traduzido no Crowdin, oferecer a tradução a eles. Falar com os
  mantenedores antes.
- **Glossário no Crowdin** (termos de regra: "saving throw" → "salvaguarda", "spell slot" →
  "espaço de magia"…), começando pelo que o português do SRD 5.1 já usa.

## Decisões que mudaram desde o plano original

- **Crowdin** no lugar de montar uma comunidade própria; Weblate e Tolgee leem os mesmos arquivos,
  se um dia for preciso trocar.
- **Códigos de idioma de duas letras** (`pt`, `es`), como o Crowdin exporta, em vez de BCP 47
  (`pt-BR`). Se um dia houver duas variantes do mesmo idioma, mudar o padrão no `crowdin.yml`.
- **Sem tradução automática**, nem como rascunho.
- **Conteúdo em arquivo, não no banco** (`2026-10-15-conteudo-e-homebrew.md`): `locale`,
  `is_verified` e `source_id` por linha deixaram de fazer sentido; o que está aprovado no Crowdin é
  o que vale.
