# Condições pelo 5etools — preparação para o brainstorm

**Data:** 2026-10-23
**Issue:** #105 (continuação do #92)
**Status:** rascunho. Falta o brainstorm (fechar as perguntas abaixo) e depois o plano de
implementação neste mesmo arquivo.

## O que já existe

- **Importador** `scripts/content/import-5etools-spells.ts` (`npm run content:spells`): baixa o
  5etools fixado em `v2.38.0`, filtra o que é SRD (`srd`, `srd52`) e grava em
  `content/dnd5e/<fonte>/`. Formatado com o Prettier, então rodar de novo não gera diff.
- **Formato:** `spells.json` (dados de regra) + `i18n/<idioma>/spells.json` (textos), com chave
  `dnd5e:<fonte>:spell:<id>` (`shared/content/content-key`). O Crowdin já pega
  `content/dnd5e/**/i18n/en/*.json`, então um `conditions.json` novo entra **sem mexer no
  `crowdin.yml`**.
- **Catálogo** `FileSpellCatalog`: carrega tudo em memória, faz o fallback para o inglês campo a
  campo e marca `untranslated`.
- **Tags:** `stripTags` em `scripts/content/5etools-spells.ts` transforma `{@condition frightened}`
  em texto puro. Hoje nenhuma descrição de magia guarda a informação de que ali havia uma condição.
- **No app:** não existe nada de condição (nem na ficha, nem na interface).

## Perguntas para o brainstorm

1. **Onde as condições aparecem?**
   - a) Só como referência: tocar em "Amedrontado" numa magia abre a explicação.
   - b) Também na ficha: marcar as condições ativas do personagem. Precisa de coluna no banco e
     de UI na ficha, e dá para fazer depois.
   - c) Uma página/lista de condições.

   Sugestão: **a** agora (é o que a issue promete), **b** vira issue separada.

2. **Como achar as condições no texto das magias?**
   - a) Guardar uma marcação no texto (ex.: `[Frightened](condition:frightened)`). Os tradutores
     precisam preservar a marcação no Crowdin, e o 5.1 em português (que não veio do 5etools) não
     teria marcação nenhuma.
   - b) Reconhecer pelo nome no front, no idioma da tela ("amedrontado", "frightened"), usando os
     nomes do próprio catálogo de condições. Não muda os arquivos de magia nem as traduções.

   Sugestão: **b**. Cuidado com o plural e o gênero no português ("amedrontada", "caídos"). Dá para
   começar com uma lista de formas por condição no arquivo de tradução.

3. **5.1 e 5.2 separados?** Como nas magias, uma entrada por fonte
   (`dnd5e:srd-5.1:condition:exhaustion` ≠ `dnd5e:srd-5.2:condition:exhaustion`, porque a Exaustão
   mudou em 2024). A magia linka para a condição da **mesma edição**.
4. **De onde vem o português?** Para o 5.2 é o Crowdin, como nas magias. Para o 5.1, o mesmo lugar
   de onde vieram as magias em pt (Foundry VTT Brasil?) ou traduzir à mão: são ~15 condições.
5. **Código: generalizar ou duplicar?** `FileSpellCatalog` → catálogo genérico, ou um
   `FileConditionCatalog` pequeno ao lado? Sugestão: duplicar o mínimo agora e generalizar quando
   chegarem os itens (regra de três).
6. **Doenças:** o 5etools junta condições e doenças (`conditionsdiseases.json`). Ficam de fora?

## Esboço das tarefas (depois do brainstorm)

1. Schema `condition.schema.ts` (dados + texto + tradução), como `spell.schema.ts`.
2. Importador: `content:conditions` (ou estender o atual) gerando `conditions.json` e
   `i18n/en/conditions.json` para 5.1 e 5.2. Teste de conteúdo em `content/dnd5e/content.unit.test.ts`.
3. Catálogo + rota de API (`/api/conditions?locale=`) ou entrega junto com as magias.
4. Front: reconhecer as condições na descrição da magia e abrir um popover/tooltip (acessível no
   toque e no teclado, como as explicações da ficha do #80).
5. e2e: abrir uma magia com condição e ver a explicação, em `en` e `pt`.
