# Traduções do Foundry → Crowdin (nomes de classes) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Um comando que lê as traduções dos módulos do Foundry, monta os nomes curtos das classes
(pt 5.1, pt 5.2, es 5.2) no formato de `i18n/<locale>/classes.json` e os envia ao Crowdin como
traduções **não aprovadas**, pulando o que já existe no repositório ou no Crowdin.

**Architecture:** Três camadas em `scripts/content/`: fontes (download fixado por commit), casamento
puro (índice nome-em-inglês → tradução, aplicado aos textos em inglês) e cliente Crowdin (filtro +
upload pela API v2 com `fetch`). Um script de entrada junta tudo, com `--dry-run` para rodar sem
Crowdin. Um workflow manual roda o script no GitHub Actions.

**Tech Stack:** TypeScript rodado com `tsx`, Zod (schemas existentes), `yaml` (devDependency nova),
Vitest (`*.unit.test.ts`), Crowdin API v2, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-11-14-traducoes-do-foundry-classes-design.md`

## Global Constraints

- Campos traduzidos: só `name` e `subclassTitle` (classe, `features.*`, `resources.*`, `choices.*`, `subclasses.*` e seus `features`/`resources`). Nunca `description` nem `note`.
- Lotes: `srd-5.1`/`pt` e `srd-5.2`/`pt` (fonte Foundry VTT Brasil), `srd-5.2`/`es` (fonte sinregistrar). Nada de `es` 5.1 nem `sv`.
- Commits fixados: Foundry VTT Brasil `0c813e5b2cb22bb4de46a1c69c87c6c89b954f3c`, sinregistrar `1c0f60911e7167b40ea58192a51e1c9ca64c31f3`, foundryvtt/dnd5e `81af804b22c02c3faa5ddf66db0051dfd768d5fb`.
- Crédito pt pelo endereço `https://gitlab.com/fvtt-brasil/dnd5e` (download pode usar `gitlab.com/foundryvtt-pt-br/foundryvtt-dnd5e-brazilian-portuguese`, mesmo projeto).
- Nunca sobrescrever: campo presente e não vazio no repositório, ou string com qualquer tradução no Crowdin, é pulado.
- Ambíguo ou sem par → não traduz.
- Upload sempre com `autoApproveImported: false` e `importEqSuggestions: false`. O `crowdin.yml` existente não muda.
- Nenhuma escrita em `content/`: a saída vai para `.foundry-import/` (gitignored).
- Mesmas versões de entrada → mesma saída (ordem de chaves estável, `writeFormatted`).
- Comentários de código em inglês, como o resto de `scripts/content/`. Commits no formato `tipo(escopo): pt / en`, terminando com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. Mesmo nome em inglês em classes diferentes ("Ability Score Improvement", "Channel Divinity", "Expertise") → a variante `"<nome> (<Classe ou Subclasse>)"` da fonte vence a chave simples.
2. Arquivo do repositório com `""` (Crowdin exporta não traduzido assim) → conta como ausente.
3. Tradução da fonte vazia, só espaços, igual ao inglês, ou com entidade HTML (`&amp;`) → aparar, decodificar; vazia ou igual ao inglês é pulada.
4. Rodar duas vezes → a segunda não envia nada (o filtro do Crowdin pega o que a primeira mandou).
5. Mesmo nome em inglês com duas traduções diferentes na fonte es (dois IDs) → ambíguo, pulado e listado no relatório.

---

### Task 1: Índices de nomes das fontes do Foundry

**Files:**

- Create: `scripts/content/foundry-names.ts`
- Test: `scripts/content/foundry-names.unit.test.ts`

**Interfaces:**

- Produces:
  - `type BabeleEntries = Record<string, { name?: string }>` (o campo `entries` de um arquivo Babele)
  - `type NameIndex = { get(enName: string, context: string[]): string | undefined; ambiguous: Set<string> }`
  - `cleanName(value: string | undefined, enName: string): string | undefined` — apara, decodifica entidades HTML (`&amp;`, `&#39;`, `&quot;`), devolve `undefined` se vazio ou igual a `enName`.
  - `ptNameIndex(files: BabeleEntries[]): NameIndex` — chaves já são o nome em inglês.
  - `esNameIndex(entries: BabeleEntries, enNameById: Map<string, string>): NameIndex` — chave é ID do Foundry; ID sem nome em inglês é ignorado.

`get(enName, context)`: tenta `"<enName> (<c>)"` para cada `c` de `context` (na ordem dada: subclasse, depois classe), depois `enName`. Nome em `ambiguous` devolve `undefined`.

- [ ] **Step 1: Write the failing tests**

```ts
describe('ptNameIndex', () => {
  const index = ptNameIndex([
    {
      Rage: { name: 'Fúria' },
      'Ability Score Improvement': { name: 'Aumento no Valor de Atributo' },
    },
    { 'Ability Score Improvement (Fighter)': { name: 'Aumento no Valor de Atributo (Guerreiro)' } },
  ]);
  it('finds by English name', () => expect(index.get('Rage', ['Barbarian'])).toBe('Fúria'));
  it('prefers the class variant', () =>
    expect(index.get('Ability Score Improvement', ['Fighter'])).toBe(
      'Aumento no Valor de Atributo (Guerreiro)',
    ));
  it('falls back to the plain name', () =>
    expect(index.get('Ability Score Improvement', ['Wizard'])).toBe(
      'Aumento no Valor de Atributo',
    ));
  it('misses unknown names', () =>
    expect(index.get('Weapon Mastery', ['Fighter'])).toBeUndefined());
});

describe('esNameIndex', () => {
  const ids = new Map([
    ['a', 'Rage'],
    ['b', 'Spellcasting'],
    ['c', 'Spellcasting'],
  ]);
  const index = esNameIndex(
    {
      a: { name: 'Furia' },
      b: { name: 'Lanzamiento de conjuros' },
      c: { name: 'Conjuros' },
      z: { name: 'X' },
    },
    ids,
  );
  it('maps Foundry ids to English names', () => expect(index.get('Rage', [])).toBe('Furia'));
  it('skips names with two different translations', () => {
    expect(index.get('Spellcasting', [])).toBeUndefined();
    expect(index.ambiguous).toContain('Spellcasting');
  });
});

describe('cleanName', () => {
  it('trims and decodes', () =>
    expect(cleanName('  Armas &amp; Armaduras ', 'Arms')).toBe('Armas & Armaduras'));
  it('drops empty and untranslated', () => {
    expect(cleanName('  ', 'Rage')).toBeUndefined();
    expect(cleanName('Halfling', 'Halfling')).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run --config ./test/vitest.config.unit.ts scripts/content/foundry-names.unit.test.ts`
Expected: FAIL (módulo não existe)

- [ ] **Step 3: Implement `scripts/content/foundry-names.ts`** com as assinaturas acima. Duas traduções iguais do mesmo nome não são ambíguas; só diferentes.

- [ ] **Step 4: Run to verify they pass** (mesmo comando, PASS)

- [ ] **Step 5: Commit** — `feat(i18n): índices de nomes do Foundry / Foundry name indexes`

---

### Task 2: Montar a tradução dos nomes de uma classe

**Files:**

- Create: `scripts/content/foundry-class-names.ts`
- Test: `scripts/content/foundry-class-names.unit.test.ts`

**Interfaces:**

- Consumes: `NameIndex` (Task 1); `classTextSchema` / `classTranslationSchema` de `@shared/systems/dnd5e/content/class.schema` (use `z.infer` para os tipos `ClassText` e `ClassTranslation`).
- Produces:
  - `type NamesReport = { translated: number; missing: string[]; ambiguous: string[] }` — `missing`/`ambiguous` como caminhos `"<classId>.features.<id>.name"`.
  - `translateClassNames(en: Record<string, ClassText>, existing: Record<string, ClassTranslation>, index: NameIndex): { translation: Record<string, ClassTranslation>; report: NamesReport }`

Regras: percorre todos os campos `name` e o `subclassTitle`. O contexto do `get` é `[nome da subclasse em inglês, nome da classe em inglês]` dentro de uma subclasse, e `[nome da classe em inglês]` fora. Campo já não vazio em `existing` não entra (nem no relatório). A saída só contém os campos traduzidos, com os objetos intermediários que eles precisam (sem `description`/`note`). Ordem das chaves igual à do inglês.

- [ ] **Step 1: Write the failing tests**

```ts
const en = {
  fighter: {
    name: 'Fighter',
    subclassTitle: 'Martial Archetype',
    features: {
      asi: { name: 'Ability Score Improvement', description: 'x' },
      'second-wind': { name: 'Second Wind', description: 'x' },
    },
    resources: { 'second-wind': { name: 'Second Wind', note: 'n' } },
    choices: {},
    subclasses: {
      champion: {
        name: 'Champion',
        features: { crit: { name: 'Improved Critical', description: 'x' } },
        resources: {},
      },
    },
  },
};
const index = ptNameIndex([
  {
    Fighter: { name: 'Guerreiro' },
    'Second Wind': { name: 'Retomar o Fôlego' },
    Champion: { name: 'Campeão' },
    'Ability Score Improvement (Fighter)': { name: 'Aumento no Valor de Atributo (Guerreiro)' },
  },
]);

it('translates only names, resources by the same index', () => {
  const { translation } = translateClassNames(en, {}, index);
  expect(translation.fighter).toEqual({
    name: 'Guerreiro',
    features: {
      asi: { name: 'Aumento no Valor de Atributo (Guerreiro)' },
      'second-wind': { name: 'Retomar o Fôlego' },
    },
    resources: { 'second-wind': { name: 'Retomar o Fôlego' } },
    subclasses: { champion: { name: 'Campeão' } },
  });
});
it('reports what had no match', () => {
  const { report } = translateClassNames(en, {}, index);
  expect(report.missing).toEqual([
    'fighter.subclassTitle',
    'fighter.subclasses.champion.features.crit.name',
  ]);
});
it('keeps what the repository already has, treating "" as missing', () => {
  const { translation } = translateClassNames(
    en,
    { fighter: { name: 'Lutador', features: { 'second-wind': { name: '' } } } as never },
    index,
  );
  expect(translation.fighter?.name).toBeUndefined();
  expect(translation.fighter?.features?.['second-wind']).toEqual({ name: 'Retomar o Fôlego' });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run --config ./test/vitest.config.unit.ts scripts/content/foundry-class-names.unit.test.ts` — FAIL

- [ ] **Step 3: Implement `translateClassNames`** em `scripts/content/foundry-class-names.ts`. Se `classTranslationSchema` exigir campos que a saída parcial não tem, tipar a saída como `DeepPartial` local em vez de mudar o schema.

- [ ] **Step 4: Run to verify they pass** — PASS

- [ ] **Step 5: Commit** — `feat(i18n): nomes de classe a partir do Foundry / class names from Foundry`

---

### Task 3: Fontes fixadas (download)

**Files:**

- Create: `scripts/content/foundry-sources.ts`
- Test: `scripts/content/foundry-sources.unit.test.ts`
- Modify: `package.json` (devDependency `yaml` `^2.9.1`, já presente em `node_modules` como dependência transitiva)

**Interfaces:**

- Consumes: `BabeleEntries` (Task 1).
- Produces:
  - constantes `PT_COMMIT`, `ES_COMMIT`, `DND5E_COMMIT` (Global Constraints)
  - `fetchPtCompendia(): Promise<BabeleEntries[]>` — `entries` de `dnd5e.classes.json`, `dnd5e.subclasses.json`, `dnd5e.classfeatures.json` em `dnd5e_pt-BR/lang/pt-BR/compendium/` (raw do GitLab no commit).
  - `fetchEsClasses(): Promise<BabeleEntries>` — `entries` de `compendium/dnd5e.classes24.json` (raw do GitHub no commit).
  - `fetchDnd5eClassNames(): Promise<Map<string, string>>` — uma chamada à API de árvore do GitHub (`/repos/foundryvtt/dnd5e/git/trees/<commit>?recursive=1`), filtra `packs/_source/classes24/**/*.yml`, baixa cada um pelo raw e lê `_id` → `name`. Usa `GITHUB_TOKEN` no header quando existir.
  - `idNameOf(yamlSource: string): [string, string] | undefined` — parse com `yaml`; `undefined` sem `_id` ou `name`.

- [ ] **Step 1: Write the failing test** de `idNameOf`:

```ts
it('reads _id and name', () =>
  expect(
    idNameOf("_id: phbClcPotentSpel\nname: 'Blessed Strikes: Potent Spellcasting'\ntype: feat\n"),
  ).toEqual(['phbClcPotentSpel', 'Blessed Strikes: Potent Spellcasting']));
it('ignores folders without a name', () => expect(idNameOf('_id: x\n')).toBeUndefined());
```

- [ ] **Step 2: Run to verify it fails** — `npx vitest run --config ./test/vitest.config.unit.ts scripts/content/foundry-sources.unit.test.ts` — FAIL

- [ ] **Step 3: Implement** `foundry-sources.ts` (fetch com erro claro `"<arquivo>: HTTP <status>"`, como `5etools-source.ts`) e `npm install -D yaml@^2.9.1`.

- [ ] **Step 4: Run to verify it passes**, e `npx knip` sem apontar `yaml`.

- [ ] **Step 5: Commit** — `feat(i18n): fontes do Foundry fixadas / pinned Foundry sources`

---

### Task 4: Cliente Crowdin (filtro e upload)

**Files:**

- Create: `scripts/content/crowdin-translations.ts`
- Test: `scripts/content/crowdin-translations.unit.test.ts`

**Interfaces:**

- Produces:
  - `leafPaths(json: unknown): string[][]` — caminhos de todas as folhas string (`[['fighter','features','asi','name'], …]`).
  - `withoutPaths(json: T, skip: (path: string[]) => boolean): T` — copia sem as folhas puladas e sem objetos que ficaram vazios.
  - `class CrowdinClient { constructor(projectId: string, token: string) }` com:
    - `fileId(path: string): Promise<number>` — pelo caminho do arquivo de origem, ex. `/content/dnd5e/srd-5.2/i18n/en/classes.json`.
    - `languageId(twoLetters: 'pt' | 'es'): Promise<string>` — idioma alvo do projeto cujo `twoLettersCode` bate.
    - `translatedIdentifiers(fileId: number, languageId: string): Promise<Set<string>>` — identificadores (`identifier` da string) que já têm qualquer tradução, paginando de 500 em 500.
    - `uploadTranslation(fileId: number, languageId: string, fileName: string, json: unknown): Promise<void>` — `POST /storages` e depois `POST /projects/{id}/translations/{languageId}` com `{ storageId, fileId, importEqSuggestions: false, autoApproveImported: false }`.
  - `identifierOf(path: string[]): string` — formato do identificador do Crowdin para JSON aninhado.

**Antes de fixar `identifierOf`:** rodar uma vez `GET /projects/{id}/strings?fileId=<classes 5.2>&limit=3` com o token e copiar o formato real do campo `identifier` para o teste. Não supor o separador.

- [ ] **Step 1: Write the failing tests** de `leafPaths` e `withoutPaths` (puras), e de `identifierOf` com o formato observado:

```ts
const json = { fighter: { name: 'Guerreiro', features: { asi: { name: 'AVA' } } } };
it('lists leaf paths', () =>
  expect(leafPaths(json)).toEqual([
    ['fighter', 'name'],
    ['fighter', 'features', 'asi', 'name'],
  ]));
it('drops skipped leaves and empty parents', () =>
  expect(withoutPaths(json, (p) => p.includes('features'))).toEqual({
    fighter: { name: 'Guerreiro' },
  }));
```

- [ ] **Step 2: Run to verify they fail** — `npx vitest run --config ./test/vitest.config.unit.ts scripts/content/crowdin-translations.unit.test.ts` — FAIL

- [ ] **Step 3: Implement** `crowdin-translations.ts`. `fetch` com `Authorization: Bearer <token>` na base `https://api.crowdin.com/api/v2`; erro com status e corpo. Sem SDK.

- [ ] **Step 4: Run to verify they pass** — PASS

- [ ] **Step 5: Commit** — `feat(i18n): envio de sugestões ao Crowdin / Crowdin suggestion upload`

---

### Task 5: Comando de importação e workflow manual

**Files:**

- Create: `scripts/content/import-foundry-class-names.ts`
- Create: `.github/workflows/crowdin-foundry.yml`
- Modify: `package.json` (script `"content:foundry-class-names": "npx tsx scripts/content/import-foundry-class-names.ts"`)
- Modify: `.gitignore` (`/.foundry-import/`)

**Interfaces:**

- Consumes: Tasks 1–4.

Fluxo do script, para cada lote `[book, locale, index]` = `[srd-5.1, pt, pt]`, `[srd-5.2, pt, pt]`, `[srd-5.2, es, es]`:

1. Lê `content/dnd5e/<book>/i18n/en/classes.json` e, se existir, `i18n/<locale>/classes.json` (`{}` se não existir).
2. `translateClassNames(...)`.
3. Sem `--dry-run`: `CrowdinClient` com `CROWDIN_PROJECT_ID` e `CROWDIN_PERSONAL_TOKEN` (erro claro se faltar); remove com `withoutPaths` o que `translatedIdentifiers` já tem; se sobrar algo, `uploadTranslation`.
4. Sempre: grava o JSON final (depois do filtro, quando houver) em `.foundry-import/<book>/<locale>/classes.json` com `writeFormatted`, e imprime `"<book> <locale>: N traduzidos, M sem par, K ambíguos, E enviados"`, mais as listas de sem par e ambíguos.

Workflow `crowdin-foundry.yml`: só `workflow_dispatch` (sem entradas), `permissions: contents: read`, mesma `concurrency: group: crowdin` do `crowdin.yml`. Passos: `actions/checkout@v7`, `actions/setup-node` com a versão de `.nvmrc`/`package.json` (a mesma do `test.yml`), `npm ci`, `npm run content:foundry-class-names`. Env: `CROWDIN_PROJECT_ID: ${{ vars.CROWDIN_PROJECT_ID }}`, `CROWDIN_PERSONAL_TOKEN: ${{ secrets.CROWDIN_PERSONAL_TOKEN }}`, `GITHUB_TOKEN: ${{ github.token }}`. Envia o relatório para `$GITHUB_STEP_SUMMARY`. Comentário no topo, no estilo do `crowdin.yml`: o que faz, que tudo chega sem aprovação e que `/sync-crowdin` traz o aprovado.

- [ ] **Step 1: Run the dry run**

Run: `npm run content:foundry-class-names -- --dry-run`
Expected: três linhas de relatório. Para `srd-5.1 pt`, a maior parte dos ~355 nomes traduzida. `srd-5.2 es` com centenas traduzidos. `.foundry-import/` criado; `git status` sem mudanças em `content/`.

- [ ] **Step 2: Run it twice and compare**

Run: `npm run content:foundry-class-names -- --dry-run && git diff --no-index` entre duas cópias de `.foundry-import/`
Expected: idênticas.

- [ ] **Step 3: Spot-check 10 names per batch** contra a fonte (ex.: `rage` → "Fúria", `fighter` es → "Guerrero") e anotar no PR.

- [ ] **Step 4: Verify the repo**

Run: `npx tsc --noEmit && npm run lint && npx knip && npm run test:unit`
Expected: tudo passando.

- [ ] **Step 5: Commit** — `feat(i18n): comando e workflow das traduções do Foundry / Foundry translations command and workflow`

O primeiro envio de verdade é a Rebeca rodar o workflow (Actions → Crowdin Foundry → Run workflow) depois do merge. Não rodar o workflow nem o script sem `--dry-run` durante a implementação.

---

### Task 6: Créditos e licença OGL

**Files:**

- Modify: `NOTICE.md` (seção "Tradução em português do Brasil: Foundry VTT Brasil" e nova seção do módulo es)
- Create: `content/dnd5e/OGL-1.0a.txt`
- Check/modify: `README.md`, `app/[locale]/(public)/terms/page.tsx` (e as mensagens que ele usa, se o texto estiver em `messages/*.json`)

- [ ] **Step 1: NOTICE.md, seção Foundry VTT Brasil** — passa a cobrir as magias pt 5.1 **e** os nomes de classes pt (5.1 e 5.2). Trocar a frase "O texto traduzido é uma adaptação do SRD 5.1 (CC-BY-4.0…). O módulo é distribuído sob a licença MIT" por: o texto traduzido é Open Game Content sob a OGL 1.0a (texto em `content/dnd5e/OGL-1.0a.txt`); o MIT (manter o bloco atual) cobre só o código do módulo.

- [ ] **Step 2: `content/dnd5e/OGL-1.0a.txt`** — texto oficial completo da Open Game License v1.0a (o mesmo que acompanha o SRD 5.1 em PDF), com a seção 15:

```text
15. COPYRIGHT NOTICE
Open Game License v 1.0a Copyright 2000, Wizards of the Coast, LLC.
System Reference Document 5.1 Copyright 2016, Wizards of the Coast, Inc.; Authors Mike Mearls, Jeremy Crawford, Chris Perkins, Rodney Thompson, Peter Lee, James Wyatt, Robert J. Schwalb, Bruce R. Cordell, Chris Sims, and Steve Townshend, based on original material by E. Gary Gygax and Dave Arneson.
DnD5e Brazilian Portuguese Translation Copyright 2020, Cauã Pessoa and the Foundry VTT Brasil contributors.
```

- [ ] **Step 3: Nova seção no NOTICE.md** para `translate-dnd5e-sdr2-es` (autor `foundryvtt-sinregistrar`, link do repositório, CC-BY 4.0 com link, "nomes de classes do SRD 5.2.1 em espanhol; só a forma foi adaptada"), no mesmo estilo das outras.

- [ ] **Step 4: README e termos** — onde citarem o módulo pt com "MIT" como licença do texto, ajustar igual ao Step 1; se só creditarem, não mexer. Se mudar texto em `messages/en.json`, mudar `messages/pt.json` junto (en + pt no PR).

- [ ] **Step 5: Verify** — `npm run lint && npm run test:unit` passando.

- [ ] **Step 6: Commit** — `docs(licenças): OGL do texto pt-BR e crédito do módulo es / OGL for pt-BR text and es module credit`
