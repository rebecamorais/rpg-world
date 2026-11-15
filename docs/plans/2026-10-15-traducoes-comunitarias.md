# Traduções comunitárias: vários idiomas e vários sistemas

**Issue:** [#93](https://github.com/rebecamorais/rpg-world/issues/93)

**Data:** 2026-10-15 (reescrito em 2026-10-23; Weblate no lugar do Crowdin em 2026-11-15)
**Status:** a base foi entregue no [#101](https://github.com/rebecamorais/rpg-world/issues/101) e as traduções passaram do Crowdin para o Weblate no
[#218](https://github.com/rebecamorais/rpg-world/pull/218). Este plano lista o que já existe, como liberar um idioma novo e o que ficou para
depois.

O objetivo continua o mesmo: conteúdo de regras e interface **em vários idiomas, feito em
comunidade**, sem tradução automática.

## Como funciona hoje

- **Weblate**, projeto público [`rpgworldapp`](https://hosted.weblate.org/projects/rpgworldapp/)
  no Hosted Weblate (plano gratuito para software livre). Idiomas no projeto: português, espanhol
  e sueco. O português aparece lá como `pt_BR`; os arquivos continuam em `pt`.
- **Componentes:** `interface` (`messages/*.json`, com `messages/en.json` como fonte) e um por
  livro e tipo de conteúdo de regras (`content/dnd5e/srd-5.{1,2}/i18n/*/{spells,items,conditions,classes}.json`,
  com o `en` como fonte). O projeto também tem um componente de glossário, ainda vazio
  ([#106](https://github.com/rebecamorais/rpg-world/issues/106)).
- **Sem Action e sem comando para sincronizar.** O Weblate lê os arquivos direto do repositório:
  um webhook do GitHub avisa cada push na `main`, e texto novo em inglês aparece lá para traduzir.
  O que é traduzido volta num pull request aberto pelo Weblate (branch `weblate`, de um fork, com o
  label `translations`), revisado e aceito como qualquer outro. Não há merge automático.
- **O que falta traduzir aparece em inglês:** na interface, o Weblate deixa a chave fora do
  arquivo (ou vazia) e o `withFallback` (`src/i18n/messages.ts`) completa com o inglês, então
  `messages/es.json` e `messages/sv.json` podem estar incompletos; nas regras, o campo vem vazio
  ou some e o catálogo usa o inglês daquele campo, com o selo "Em inglês" quando é a descrição.
- **Tradução editada no repositório** (por exemplo, o português de uma funcionalidade nova): entra
  na `main` como qualquer mudança e o Weblate a lê de lá. Não existe mais o envio que sobrescrevia
  a plataforma.
- **Traduções de fora viram sugestões:** `npm run content:foundry-class-names` (rodado à mão, com
  a chave em `WEBLATE_TOKEN` ou em `~/.config/weblate`) envia as traduções dos módulos do Foundry
  ao Weblate como sugestões. Elas só chegam aos arquivos depois de aceitas lá.
- **Origem do que já existe:** as magias do SRD 5.1 em português vieram do módulo
  [Foundry VTT Brasil / dnd5e](https://gitlab.com/fvtt-brasil/dnd5e) (MIT, sobre o SRD 5.1 em
  CC-BY-4.0); os créditos estão no `NOTICE.md` e nos Termos. Não existe tradução do SRD 5.2 em
  português em nenhuma fonte: as 339 magias de 2024 são traduzidas do zero no Weblate.

## Liberar um idioma novo no app

Os arquivos de um idioma (`messages/es.json`, `content/dnd5e/*/i18n/es/`) chegam pelo PR do
Weblate antes de o app oferecer o idioma; enquanto ele não é liberado, ficam no repositório sem
efeito.

**Quando liberar:** a interface (`messages/<idioma>.json`) traduzida por inteiro. As regras podem
estar incompletas: o que faltar aparece em inglês com o selo.

**O que mudar** (um PR por idioma):

1. `src/i18n/routing.ts`: o código em `locales`.
2. `src/frontend/components/LanguageSwitcher.tsx`: a opção no seletor, e o nome do idioma em
   `messages/*.json` (a chave que o seletor usa, hoje `en` e `pt`).
3. Os `srd-*.ts` em `src/backend/contexts/{spells,items,conditions,classes}/infrastructure/`:
   carregar os arquivos `i18n/<idioma>/` de cada livro (hoje só `pt` está fixo). No primeiro
   idioma novo, vale trocar a lista fixa por uma leitura dos idiomas liberados em
   `src/i18n/routing.ts`.
4. `app/[locale]/layout.tsx`: o `locale` do Open Graph (`pt_BR`, `en_US`…).
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
  o módulo dele tiver licença compatível; senão, o Weblate basta.
- **Contribuir de volta:** levar ao Foundry VTT Brasil as correções que fizermos no português e,
  quando o SRD 5.2 estiver traduzido no Weblate, oferecer a tradução a eles. Falar com os
  mantenedores antes.
- **Glossário no Weblate** ([#106](https://github.com/rebecamorais/rpg-world/issues/106); termos de regra: "saving throw" → "salvaguarda",
  "spell slot" → "espaço de magia"…), começando pelo que o português do SRD 5.1 já usa.

## Decisões que mudaram desde o plano original

- **Uma plataforma de tradução** no lugar de montar uma comunidade própria. Começou no Crowdin;
  em 2026-11-15 passou para o Weblate, que é software livre, porque o projeto estourou a cota do
  plano gratuito do Crowdin. Os arquivos são os mesmos.
- **Códigos de idioma de duas letras** (`pt`, `es`) nos arquivos, em vez de BCP 47 (`pt-BR`). No
  Weblate, um apelido do projeto liga `pt` a `pt_BR`. Se um dia houver duas variantes do mesmo
  idioma, mudar o apelido e os nomes dos arquivos.
- **Sem tradução automática**, nem como rascunho.
- **Conteúdo em arquivo, não no banco** (`2026-10-15-conteudo-e-homebrew.md`): `locale`,
  `is_verified` e `source_id` por linha deixaram de fazer sentido; o que está no arquivo, aceito no Weblate,
  é o que vale.
