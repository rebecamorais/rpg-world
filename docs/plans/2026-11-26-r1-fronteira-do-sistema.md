# R1: fronteira do sistema — plano de implementação

> **Para agentes:** sub-skill obrigatória: superpowers:subagent-driven-development (recomendada) ou superpowers:executing-plans, tarefa por tarefa. Os passos usam `- [ ]` para acompanhar.

**Objetivo:** dar ao app um id único de sistema e um registro de sistemas, para que o núcleo pare de depender do D&D direto, sem mudar nada que a pessoa veja nem nada salvo no banco.

**Arquitetura:** um registro em `shared/systems/registry.ts` diz quais sistemas existem e converte os três nomes que convivem hoje (`DnD_5e`, `dnd_5e`, `dnd5e`) num `SystemId`. O mapeamento linha → personagem sai do repositório para um mapper por sistema. Um teste em catraca congela os imports de `@shared/systems/dnd5e` que já existem e barra os novos.

**Stack:** Next.js (App Router; leia `node_modules/next/dist/docs/` antes de mexer em rota), TypeScript, Zod, Vitest, Playwright.

**Proposta (spec):** artifact "RPGWorld Multissistema" (https://claude.ai/artifact/TdPYMoEp9sDR8Gb5yqwVJC), seções "D&D ou refatorar?" (R1) e "Módulo de sistema". O resumo que importa está abaixo; quem executa não precisa abrir o artifact.

## Contexto

- O app tem um sistema só (D&D 5e, edições 2014 e 2024). O 2024 continua sendo **edição**, não sistema.
- Três nomes para a mesma coisa: `DnD_5e` no domínio, na API e nas URLs; `dnd_5e` no enum `rpg_system` do banco; `dnd5e` no prefixo das chaves de conteúdo e em `shared/systems/dnd5e`.
- O segmento `[system_name]` da rota da ficha é ignorado: qualquer valor abre a ficha.
- 95 arquivos fora de `shared/systems/dnd5e` importam `@shared/systems/dnd5e`. A R1 **não** move esses arquivos; só impede que aumentem.
- A R2 (conteúdo genérico com manifesto) e a generalização do banco ficam fora deste plano.

## Restrições globais

- **Ficha salva nunca muda nem é reinterpretada** ([class-sheet-coverage.md](../class-sheet-coverage.md), regra das fichas existentes). Nenhuma migration nesta R1. O banco continua gravando `dnd_5e`.
- Os baselines visuais (`npm run test:visual`) passam **sem** `--update-snapshots`. Se algum mudar, é bug da R1.
- Código, nomes e comentários em inglês; este doc em português; commits `tipo(escopo): português / english`.
- Textos do app nunca fixos no código (`hardcoded-text.unit.test.ts`).
- Trabalhar num worktree em `.claude/worktrees/r1-fronteira`, nunca trocando a branch do checkout principal. PR no fim pelo front-ship.
- O valor canônico do sistema passa a ser `dnd5e` em todo lugar fora do banco. A entrada aceita `DnD_5e` e `dnd_5e` para sempre (links salvos, clientes com o JS antigo em cache).

## Foco da revisão

1. **Links antigos:** `/system/DnD_5e/character/<id>` e `/system/dnd_5e/character/<id>` (favoritos, links compartilhados) continuam abrindo a ficha. Teste na tarefa 2.
2. **Cliente antigo em cache depois do deploy:** `POST /api/characters` com `system: 'DnD_5e'` continua criando a ficha, e ela sai com `system: 'dnd5e'`. Teste na tarefa 3.
3. **Mesa:** a ficha aberta por `/parties/<id>/characters/<id>` redireciona para o endereço novo quando é sua (`parties/[partyId]/characters/[id]/layout.tsx:67`). Teste na tarefa 2.
4. **Demo:** `/demo` continua traduzindo endereços de ficha para `/demo/characters/...` com o slug novo (`src/frontend/demo/href.ts`). Teste na tarefa 2.
5. **Linha de sistema desconhecido no banco** (`ezd6`, `pathfinder_2e` existem no enum): o repositório continua lançando o mesmo erro de hoje, sem quebrar a listagem de outras fichas de forma diferente da atual. Teste na tarefa 4.

---

### Tarefa 1: registro de sistemas

**Arquivos:**

- Criar: `shared/systems/registry.ts`
- Teste: `shared/systems/registry.unit.test.ts`
- Modificar: `shared/types/character.ts:1` (`type GameSystem = SystemId`)

**Interfaces:**

- Produz:
  - `type SystemId = 'dnd5e'`
  - `type DbSystem = Database['public']['Enums']['rpg_system']` (de `lib/types/database.ts`)
  - `interface GameSystemInfo { id: SystemId; dbValue: DbSystem; labelKey: string; levels: { min: number; max: number } }`
  - `const SYSTEMS: Readonly<Record<SystemId, GameSystemInfo>>`
  - `const DEFAULT_SYSTEM: SystemId`
  - `parseSystemId(value: string): SystemId | null`
  - `toDbSystem(id: SystemId): DbSystem`
  - `fromDbSystem(value: string): SystemId | null`

- [ ] **Passo 1: escrever o teste que falha**

```ts
describe('parseSystemId', () => {
  it.each(['dnd5e', 'DnD_5e', 'dnd_5e'])('reads %s as dnd5e', (value) => {
    expect(parseSystemId(value)).toBe('dnd5e');
  });
  it.each(['', 'DND5E ', 'pathfinder_2e', 'ezd6', 'daggerheart'])('rejects %j', (value) => {
    expect(parseSystemId(value)).toBeNull();
  });
});

it('writes dnd5e as the database value dnd_5e and reads it back', () => {
  expect(toDbSystem('dnd5e')).toBe('dnd_5e');
  expect(fromDbSystem('dnd_5e')).toBe('dnd5e');
  expect(fromDbSystem('pathfinder_2e')).toBeNull();
});

it('describes D&D 5e with levels 1 to 20 and its label key', () => {
  expect(SYSTEMS.dnd5e).toEqual({
    id: 'dnd5e',
    dbValue: 'dnd_5e',
    labelKey: 'systems.dnd5e',
    levels: { min: 1, max: 20 },
  });
  expect(DEFAULT_SYSTEM).toBe('dnd5e');
});
```

- [ ] **Passo 2: rodar e ver falhar**

Rodar: `npx vitest run --config ./test/vitest.config.unit.ts shared/systems/registry.unit.test.ts`
Esperado: FAIL, módulo `./registry` não existe.

- [ ] **Passo 3: implementar `shared/systems/registry.ts`**

`parseSystemId` compara exato com uma tabela de apelidos (`{ dnd5e: 'dnd5e', DnD_5e: 'dnd5e', dnd_5e: 'dnd5e' }`), sem `toLowerCase`, para não aceitar variações que nunca existiram. Comentário curto dizendo de onde vem cada apelido (domínio antigo, banco). `labelKey` aponta para a chave que `NewCharacterForm` já usa (`t('systems.dnd5e')`). O arquivo não importa nada de `shared/systems/dnd5e`.

- [ ] **Passo 4: trocar `GameSystem` em `shared/types/character.ts` por `SystemId`**

`type GameSystem = SystemId | 'DnD_5e'`, com `SystemId` importado de `registry`. O `| 'DnD_5e'` é provisório, para esta tarefa ficar verde sozinha; a tarefa 3 o remove.

- [ ] **Passo 5: rodar e ver passar**

Rodar: `npx vitest run --config ./test/vitest.config.unit.ts shared/systems/registry.unit.test.ts && npx tsc --noEmit`
Esperado: PASS e tsc sem erro.

- [ ] **Passo 6: commit**

```bash
git add shared/systems/registry.ts shared/systems/registry.unit.test.ts shared/types/character.ts
git commit -m "feat(sistemas): registro de sistemas e id único / system registry and a single id"
```

---

### Tarefa 2: endereço da ficha por `sheetHref`

**Arquivos:**

- Criar: `shared/systems/sheet-href.ts`, teste `shared/systems/sheet-href.unit.test.ts`
- Modificar (trocar o template de string por `sheetHref`):
  - `src/frontend/components/combat/OwnHitPoints.tsx:71`
  - `src/frontend/components/combat/CombatRow.tsx:30`
  - `src/frontend/components/character/sheet/SheetPreview.tsx:75`
  - `src/frontend/components/character/sheet/SheetViewer.tsx:53`
  - `src/frontend/components/character/CharacterCard.tsx:45`
  - `src/frontend/hooks/useSheetSource.ts:61`
  - `src/frontend/hooks/useCreateCharacter.ts:34`
  - `src/frontend/hooks/useDuplicateCharacter.ts:30`
  - `app/[locale]/(app)/(dashboard)/parties/[partyId]/characters/[id]/layout.tsx:67`
  - `e2e/support/fixtures.ts:118` (`characterUrl`) e os regex de `e2e/characters.spec.ts:19`, `e2e/character-creation-class.spec.ts:5`, `e2e/class-pending-choices.spec.ts:5`
- Teste novo: em `e2e/characters.spec.ts`

**Interfaces:**

- Consome: `SystemId`, `parseSystemId`, `DEFAULT_SYSTEM` (tarefa 1).
- Produz: `sheetHref(system: string, characterId: string, tab?: SheetTab): string`, onde `type SheetTab = 'lore' | 'spells' | 'inventory' | 'appearance'`. Recebe `string` de propósito: normaliza com `parseSystemId` e cai em `DEFAULT_SYSTEM` quando não reconhece, para que um valor antigo nunca gere link quebrado.

- [ ] **Passo 1: teste que falha**

```ts
it.each([
  ['dnd5e', 'c1', undefined, '/system/dnd5e/character/c1'],
  ['DnD_5e', 'c1', undefined, '/system/dnd5e/character/c1'],
  ['dnd_5e', 'c1', 'spells', '/system/dnd5e/character/c1/spells'],
  ['unknown', 'c1', 'lore', '/system/dnd5e/character/c1/lore'],
])('sheetHref(%s, %s, %s) is %s', (system, id, tab, href) => {
  expect(sheetHref(system, id, tab as SheetTab | undefined)).toBe(href);
});
```

- [ ] **Passo 2: rodar e ver falhar** (`npx vitest run --config ./test/vitest.config.unit.ts shared/systems/sheet-href.unit.test.ts`, FAIL por módulo ausente)

- [ ] **Passo 3: implementar `sheetHref` e trocar os nove pontos de `src/` e `app/` listados acima**

Os testes unitários que montam caminho na mão (`SheetTabBar`, `LoreTab`, `useSheetSource`, `href.unit.test.ts`) já usam valores variados e devem continuar passando sem mudança. Se algum quebrar, o componente dependia do texto exato do segmento; corrigir o componente, não o teste.

- [ ] **Passo 4: conferir a demo**

Ler `src/frontend/demo/href.ts`. Se o regex fixar `DnD_5e`, trocar por qualquer segmento (`[^/]+`). Acrescentar em `src/frontend/demo/href.unit.test.ts` o caso `['/system/DnD_5e/character/joan', '/demo/characters/joan']`, para links antigos.

- [ ] **Passo 5: e2e de link antigo e da mesa**

Em `e2e/characters.spec.ts`, teste "abre a ficha pelos endereços antigos": cria uma ficha pela fixture, visita `/system/DnD_5e/character/<id>` e `/system/dnd_5e/character/<id>` e espera o nome do personagem no cabeçalho nas duas. Atualizar `characterUrl` e os três regex para `dnd5e`. Para o foco 3, procurar o spec que abre a ficha pela mesa (`grep -rn "parties/.*characters" e2e`) e trocar o regex esperado para `/system/dnd5e/`.

- [ ] **Passo 6: rodar**

`npx vitest run --config ./test/vitest.config.unit.ts shared/systems src/frontend/demo src/frontend/components/character/sheet src/frontend/hooks` e `npx playwright test e2e/characters.spec.ts e2e/character-creation-class.spec.ts e2e/class-pending-choices.spec.ts` mais o spec da mesa do passo 5. Esperado: tudo PASS.

- [ ] **Passo 7: commit** — `refactor(sistemas): endereço da ficha por sheetHref / sheet address through sheetHref`

---

### Tarefa 3: `dnd5e` como valor do sistema no domínio e na API

**Arquivos:**

- Modificar:
  - `src/backend/contexts/characters/domain/entity/DnD5eCharacter.ts:103` (`SYSTEMS.dnd5e.id`)
  - `shared/systems/dnd5e/types.ts:74` (`system: 'dnd5e'`) e `shared/systems/dnd5e/factory.ts:26`
  - `src/frontend/demo/data/build.ts:53,214,240,261`
  - `src/frontend/components/character/NewCharacterForm.tsx:46-47` (apagar `SYSTEM`; usar `DEFAULT_SYSTEM`; o rótulo vem de `SYSTEMS[DEFAULT_SYSTEM].labelKey`)
  - `src/backend/contexts/characters/interfaces/characters.schemas.ts:37`
  - `src/backend/contexts/characters/infrastructure/repositories/supabase-character.repository.ts:126` (`toDbSystem(...)` no lugar de `.toLowerCase()`)
  - `e2e/character-creation-class.spec.ts:145`
  - `shared/types/character.ts` (tirar o `| 'DnD_5e'` da tarefa 1)
- Teste: `src/backend/contexts/characters/interfaces/characters.schemas.unit.test.ts` (criar ou acrescentar)

**Interfaces:**

- Consome: `SYSTEMS`, `DEFAULT_SYSTEM`, `parseSystemId`, `toDbSystem` (tarefa 1).
- Produz: `createCharacterSchema.shape.system` aceita qualquer apelido e devolve `SystemId` (Zod `.transform`), opcional como hoje.

- [ ] **Passo 1: teste que falha**

```ts
it.each(['DnD_5e', 'dnd5e', 'dnd_5e'])('accepts the system %s and keeps it as dnd5e', (system) => {
  expect(createCharacterSchema.parse({ name: 'Arani', system }).system).toBe('dnd5e');
});
it('rejects a system the app does not have', () => {
  expect(createCharacterSchema.safeParse({ name: 'Arani', system: 'pathfinder_2e' }).success).toBe(
    false,
  );
});
it('still accepts a character without a system', () => {
  expect(createCharacterSchema.parse({ name: 'Arani' }).system).toBeUndefined();
});
```

- [ ] **Passo 2: rodar e ver falhar** (o caso `dnd5e` falha com o `z.literal('DnD_5e')` atual)

- [ ] **Passo 3: trocar o schema e os literais da lista**

Schema: `z.string().max(40).transform(parseSystemId).refine((id): id is SystemId => id !== null)` (ou equivalente com `superRefine`), dentro do `optional(...)` atual. O use case de criação recebe `SystemId`.

- [ ] **Passo 4: conferir o que sai na API e o que entra no banco**

`grep -rn "DnD_5e" src app shared e2e --include='*.ts' --include='*.tsx'` só pode sobrar dentro de `registry.ts` (tabela de apelidos) e dos testes de apelido. O teste de integração do repositório que cria uma ficha (`src/backend/contexts/characters/infrastructure/repositories/*.integration.test.ts`) deve ganhar uma asserção: depois do `save`, a linha no banco tem `system = 'dnd_5e'`, e `getById` devolve `system: 'dnd5e'`.

- [ ] **Passo 5: rodar**

`npm run test:unit && npx tsc --noEmit && npm run test:integration -- src/backend/contexts/characters` (banco de teste na porta 54421 de pé, ver [ambiente-local.md](../ambiente-local.md)), e `npx playwright test e2e/character-creation-class.spec.ts`. Esperado: PASS.

- [ ] **Passo 6: commit** — `refactor(sistemas): dnd5e como id do sistema no domínio e na API / dnd5e as the system id in the domain and API`

---

### Tarefa 4: mapper de ficha por sistema no repositório

**Arquivos:**

- Criar: `src/backend/contexts/characters/infrastructure/repositories/sheet-mappers/dnd5e.ts`, `.../sheet-mappers/index.ts`, teste `.../sheet-mappers/dnd5e.unit.test.ts`
- Modificar: `supabase-character.repository.ts:165-223` (`mapToDomain`)

**Interfaces:**

- Consome: `fromDbSystem`, `SystemId` (tarefa 1).
- Produz:
  - `interface SheetMapper { fromRow(row: DbCharacterRow, common: CommonCharacterFields): Character }`
  - `interface CommonCharacterFields { attributes: Attributes; hp: HealthPoints; lore: Lore }`
  - `const dnd5eSheetMapper: SheetMapper` (o corpo do `if (row.system === 'dnd_5e')` de hoje, sem mudar nenhum default)
  - `sheetMapperFor(dbSystem: string): SheetMapper` em `index.ts`, que lança `Error(\`System ${dbSystem} not implemented in repository mapping\`)` para sistema sem mapper (mesma mensagem de hoje).
  - `revision` e `rowVersion` continuam sendo atribuídos no `mapToDomain`, depois do mapper, para todo sistema.

- [ ] **Passo 1: teste que falha, com as fichas legadas**

```ts
it('keeps the old 30 ft speed for a sheet saved without one', () => {
  expect(dnd5eSheetMapper.fromRow(row({ system_data: {} }), common()).toJSON().speed).toBe(30);
});
it('reads legacy hit dice {total,current} as what was spent', () => {
  const sheet = dnd5eSheetMapper.fromRow(
    row({ level: 5, system_data: { hitDice: { total: 5, current: 2 } } }),
    common(),
  );
  expect(sheet.toJSON().hitDice).toEqual(readHitDice({ total: 5, current: 2 }, 5));
});
it('fails the same way as before for a system with no mapper', () => {
  expect(() => sheetMapperFor('pathfinder_2e')).toThrow(
    'System pathfinder_2e not implemented in repository mapping',
  );
});
```

`row()` e `common()` são helpers locais do teste que montam uma `DbCharacterRow` mínima com `system: 'dnd_5e'`.

- [ ] **Passo 2: rodar e ver falhar** (módulo ausente)

- [ ] **Passo 3: mover o corpo para `dnd5e.ts` sem alterar nenhuma linha de default** (`|| 30`, `|| 10`, `readHitDice`, `|| 0` do `hpTemp`) e fazer `mapToDomain` chamar `sheetMapperFor(row.system).fromRow(row, { attributes, hp, lore })`.

- [ ] **Passo 4: rodar** — o teste novo, `npm run test:unit` e `npm run test:integration -- src/backend/contexts/characters` (os testes de ficha legada, `character-revision` e `class-resources`, têm que passar sem mudança). Esperado: PASS.

- [ ] **Passo 5: commit** — `refactor(fichas): mapper de ficha por sistema / per-system sheet mapper`

---

### Tarefa 5: catraca de imports do D&D

**Arquivos:**

- Criar: `system-boundary.unit.test.ts` (na raiz, como `docs-index.unit.test.ts`) e `system-boundary.allowlist.json`

**Interfaces:**

- Consome: nada das outras tarefas, mas roda por último para a lista nascer com o estado final da R1 (o mapper novo e o `registry.ts` não podem estar na lista).

Regras do teste:

- Varre `app/`, `src/` e `shared/` (sem `*.test.*`, sem `*.spec.*`) procurando import de `@shared/systems/dnd5e` ou caminho relativo para `shared/systems/dnd5e`.
- Um arquivo pode importar se o caminho tiver um segmento `dnd5e/` ou o nome começar com `dnd5e` (cobre `shared/systems/dnd5e/**`, `sheet-mappers/dnd5e.ts` e o futuro `src/frontend/systems/dnd5e/**`).
- Fora disso, o arquivo tem que estar na lista. Arquivo novo fora da lista: falha com a mensagem "Novo import do D&D fora do módulo do sistema: <arquivo>. Use o registro (`shared/systems/registry.ts`) ou ponha o código em `.../dnd5e/`."
- A lista só diminui: falha se um arquivo da lista não existir mais ou não importar mais o D&D, com a mensagem "Tire <arquivo> de system-boundary.allowlist.json".
- A lista é um array JSON ordenado de caminhos relativos à raiz.

- [ ] **Passo 1: escrever o teste com a lista vazia e ver falhar** listando os ~95 arquivos.
- [ ] **Passo 2: gerar a lista** a partir da saída do teste (ou do mesmo glob), ordenada, e conferir que `shared/systems/registry.ts`, `shared/systems/sheet-href.ts` e `sheet-mappers/index.ts` **não** estão nela.
- [ ] **Passo 3: rodar** `npx vitest run --config ./test/vitest.config.unit.ts system-boundary.unit.test.ts`. Esperado: PASS. Depois, acrescentar um import temporário de `@shared/systems/dnd5e/calculations` num arquivo fora da lista e confirmar que falha com a mensagem certa; desfazer.
- [ ] **Passo 4: `npm run knip`** para garantir que o JSON e o teste não acusam arquivo solto.
- [ ] **Passo 5: commit** — `test(sistemas): catraca de imports do D&D fora do módulo / ratchet on D&D imports outside the module`

---

### Tarefa 6: docs e verificação final

**Arquivos:**

- Modificar: `docs/INDEX.md` (seção "Regras do jogo": uma linha sobre `shared/systems/registry.ts`, `sheetHref` e a catraca; em "Planos", marcar este plano como entregue com o número do PR), `.agents/rules/MAP_AND_STRUCTURE.md` (onde vive código de sistema e a regra da catraca)

- [ ] **Passo 1: atualizar os dois docs.**
- [ ] **Passo 2: verificação completa, nesta ordem, uma de cada vez:**
  - `npm run lint && npx tsc --noEmit && npm run knip`
  - `npm test` (unit + integration)
  - `npx playwright test`
  - `npm run test:visual` **sem** `--update-snapshots` (nunca junto com outro Playwright). Esperado: zero diferença.
- [ ] **Passo 3: commit** — `docs(sistemas): registro de sistemas no índice e nas regras / system registry in the index and rules`
- [ ] **Passo 4: abrir o PR pelo front-ship**, descrição em português e inglês, citando a proposta e dizendo que não há migration nem mudança visível. Fechar a #95 com um comentário (o 2024 seguiu como edição) só se a Rebeca confirmar.
