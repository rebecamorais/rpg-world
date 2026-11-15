# Recursos de classe e descanso (#177) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The Status tab shows the class resource boxes (Ki, Rage, Bardic Inspiration…) for the character's edition, class, subclass and level. It also gets "hit dice remaining" and Short/Long rest buttons that open a checklist that changes nothing on the sheet.

**Architecture:** The sheet stores only per-box state (`resources[key].used`) and the chosen `edition` in `system_data`. Maximums, names and recovery always come from `content/dnd5e/srd-5.x/classes.json`, served by a light server-only catalog route. A pure shared function, `buildResourceBoxes`, turns content + level + attributes + state into boxes. Spending a box or picking the edition saves at once through `saveNow`.

**Tech Stack:** Next.js 16 (read `node_modules/next/dist/docs/` before any new API), Supabase (`system_data` JSON, no migration), TanStack Query, next-intl, Zod, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-14-recursos-de-classe-design.md`. Read it before your task; this plan argues from it.

## Global Constraints

- No migration. Everything fits in `characters.system_data`. If a migration looks necessary, stop and ask, because a merge to `main` applies migrations in production.
- UI text only through next-intl. Add keys to `messages/en.json` and `messages/pt.json` only (es/sv come from Weblate; missing keys fall back to English).
- Each task adds its keys in **its own new top-level namespace**, inserted right after the existing namespace named in the task. This keeps parallel branches from conflicting.
- The unit guards must stay green: no hardcoded UI text, design tokens only (no raw Tailwind palette such as `bg-blue-500`), game-icons names valid.
- Code comments in English. Test descriptions (`it('…')`) in Portuguese.
- Conventional Commits in Portuguese, ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Mobile first. Touch targets ≥ 44px under `pointer-coarse` (SpellSlots' 24px buttons are the existing desktop pattern).
- Read-only sheets (GM via party, #189 viewer, demo: `useSheetSource(...).readOnly`) show boxes disabled and nothing else new: no edition card, no rest buttons, no gear highlight.
- Unit tests: `npx vitest run --config ./test/vitest.config.unit.ts <path>`. Integration: `npx vitest run --config ./test/vitest.config.integration.ts <path>`. **Subagents never run integration or e2e**: they share one test DB. The coordinator runs those serially.
- The pre-commit hook runs the whole unit suite on the working tree. A failing unrelated test blocks the commit: report it, don't bypass with `--no-verify`.

## Review Focus

1. **Class typed in Portuguese, with case or accents** ("Monge", "monge ", "Bárbara") should still get its boxes. This works through `matchCharacterClass` with the translated label. The test goes in Task 5.
2. **Level goes down below what's spent, or below a resource's level.** `used` shows clamped to the new max, and a box gained later disappears, but its saved state is kept, not deleted. The test goes in Task 2.
3. **Content request fails, or the demo answers 404.** The sheet shows no boxes and keeps working: no crash, no endless spinner, and in the demo no edition card (the demo is read-only). The test goes in Task 5.
4. **Two fast taps on the same box.** The second tap must not compute from the stale value and resave the same `used`. Pips of a box stay disabled while its save is pending. The test goes in Task 4.
5. **Old sheets whose `hitDice.current` was stored as 0 by today's `setHitDice`.** They show 0 remaining (correct per stored data) and can tap back. A sheet with no `current` shows all dice available. `setHitDice` stops writing 0. The test goes in Task 1.

---

## Execution waves (for the coordinator)

All agents branch from `feat/recursos-de-classe`, each in its own worktree (`isolation: "worktree"`). The coordinator merges each finished branch back into `feat/recursos-de-classe` before starting the wave that depends on it.

| Wave | Tasks (parallel inside a wave)                     | Depends on    |
| ---- | -------------------------------------------------- | ------------- |
| 1    | Task 1                                             | —             |
| 2    | Task 2, Task 3, Task 4                             | Task 1        |
| 3    | Task 5, Task 6, Task 7                             | Tasks 2, 3, 4 |
| 4    | Task 8                                             | Wave 3        |
| 5    | Task 9 (coordinator: integration, e2e, visual, PR) | all           |

---

### Task 1: Saved shape — `edition`, `resources`, hit dice fix

**Files:**

- Modify: `shared/systems/dnd5e/types.ts` (add fields to `DnD5eCharacterData`)
- Create: `shared/systems/dnd5e/class-resources.ts` (types only in this task)
- Modify: `src/backend/contexts/characters/interfaces/characters.schemas.ts` (`characterUpdatesSchema`)
- Modify: `src/backend/contexts/characters/application/update-character/update-character.use-case.ts`
- Modify: `src/backend/contexts/characters/domain/entity/DnD5eCharacter.ts` (options, fields, `toJSON`)
- Modify: `src/backend/contexts/characters/infrastructure/repositories/supabase-character.repository.ts` (`mapToDomain`)
- Modify: `src/backend/contexts/characters/infrastructure/in-memory-character.repository.ts` if it maps fields by hand
- Modify: `src/frontend/lib/character-changes.ts` (`MERGED_BY_KEY`)
- Modify: `src/frontend/lib/character-sheet-updates.ts`
- Test: `characters.schemas` unit test (find the existing one next to the file or in `src/backend/contexts/schemas.unit.test.ts`), `update-character.use-case.unit.test.ts`, `src/frontend/lib/character-changes.unit.test.ts`, `src/frontend/lib/character-sheet-updates.unit.test.ts` (create if missing)

**Interfaces — Produces:**

```ts
// shared/systems/dnd5e/class-resources.ts
import type { ClassResource } from './content/class.schema';
import type { Edition } from './content/editions';

export type Recovery = ClassResource['recovery'][number];
export interface ResourceOverrides {
  max?: number;
  recovery?: Recovery[];
  color?: string;
  name?: string;
  description?: string;
} // #180
export interface CustomResource {
  name: string;
  max: number;
  recovery: Recovery[];
  color?: string;
  source: 'class' | 'subclass' | 'feat' | 'item' | 'manual';
} // #180
export interface ResourceState {
  used: number;
  hidden?: boolean;
  overrides?: ResourceOverrides;
  custom?: CustomResource;
}
/** What GET /api/content/classes returns: one class, its SRD subclass, resource texts resolved to one locale. */
export interface ResourceContent extends ClassResource {
  name: string;
  note?: string;
  description: string;
}
export interface ClassResourcesContent {
  classId: string;
  edition: Edition;
  hitDie: 6 | 8 | 10 | 12;
  resources: ResourceContent[];
  subclass: { id: string; names: string[]; resources: ResourceContent[] }; // names: English + locale name, for matching
}
export const RESOURCE_KEY =
  /^(class:[a-z0-9-]+|subclass:[a-z0-9-]+\/[a-z0-9-]+|custom:[0-9a-f-]{36}):?[a-z0-9-]*$/;
```

`RESOURCE_KEY` must accept `class:monk:ki`, `subclass:barbarian/berserker:frenzy` and `custom:<uuid v4>`. It must reject `class:Monk:ki`, `foo` and `class:monk:ki;drop`. Tighten the regex until those cases pass.

- `DnD5eCharacterData` gains `edition?: Edition; resources?: Record<string, ResourceState>;`.
- Patches in `character-sheet-updates.ts`:
  - `setResourceUsed(key: string, used: number): Patch`. It keeps the box's other fields and the other keys: `(c) => ({ resources: { ...c.resources, [key]: { ...c.resources?.[key], used } } })`.
  - `setHitDiceRemaining(current: number): Patch`. It keeps `total`; `total` defaults to `''`.
  - `setHitDice` keeps `current ?? c.level` instead of `?? 0`.
- `MERGED_BY_KEY` becomes `['attributes', 'skills', 'resources']`.
- Server: `resources` merges by key in the use case (`character.resources = { ...character.resources, ...resources }`), like `skills`. `edition` goes in `SIMPLE_FIELDS`.

- [ ] **Step 1: Write failing tests.**
  - Schema accepts `{ edition: '2024', resources: { 'class:monk:ki': { used: 2 } } }`.
  - Schema rejects `edition: '2025'`, the key `'Monk'` and `used: -1`.
  - Schema accepts `hidden`/`overrides`/`custom` with limits: `max` 0–1000, `name` ≤ 100, `description` ≤ 2000, `color` ≤ 32, `recovery` ≤ 4 entries.
  - Use case: saving `resources: { 'class:monk:ki': { used: 1 } }` over stored `{ 'class:monk:ki': {used:3}, 'class:monk:x': {used:1} }` yields both keys, Ki at 1. `edition` round-trips through `toJSON`.
  - `characterChanges` sends only the changed resource key.
  - `setHitDice('d10')` on `{ level: 4, hitDice: undefined }` gives `{ total: 'd10', current: 4 }`.
  - `setResourceUsed` keeps the other keys.
- [ ] **Step 2: Run them, expect FAIL.**
- [ ] **Step 3: Implement.** Map `edition` and `resources` in `mapToDomain` the same way `spellSlots` is mapped. Save already spreads `rest`, so `toJSON` must include both.
- [ ] **Step 4: Run the touched test files, then `npm run lint` and `npx tsc --noEmit`. Expect PASS.**
- [ ] **Step 5: Commit** with `feat(recursos-de-classe): edição e estado das caixinhas na ficha`.

---

### Task 2: `buildResourceBoxes` and recovery (pure, shared)

**Files:**

- Modify: `shared/systems/dnd5e/class-resources.ts`
- Test: `shared/systems/dnd5e/class-resources.unit.test.ts`

**Interfaces:**

- Consumes: Task 1 types; `getModifier` from `shared/systems/dnd5e/calculations.ts`.
- Produces:

```ts
export interface ResourceBox {
  key: string; // class:<classId>:<id> | subclass:<classId>/<subId>:<id>
  name: string;
  description: string;
  note?: string;
  unit: 'uses' | 'points' | 'hit-points'; // spell-slots never reach a box
  max: number | null; // null = unlimited
  used: number; // clamped to [0, max]; 0 when unlimited
  recovery: Recovery[]; // only entries active at this level (fromLevel <= level)
  die?: number; // faces at this level
  source: 'class' | 'subclass';
}
export function buildResourceBoxes(input: {
  content: ClassResourcesContent;
  subclassId: string | null;
  level: number;
  attributes: Record<AttributeKey, number>;
  state: Record<string, ResourceState> | undefined;
}): ResourceBox[];
/** What a rest gives back to this box: 'all', a number, or null for nothing. */
export function recoveryOn(box: ResourceBox, rest: 'short' | 'long'): 'all' | number | null;
/** The SRD subclass if the free-text subclass names it (English or locale name; case, accents and surrounding spaces ignored). */
export function matchSubclass(
  content: ClassResourcesContent,
  text: string | undefined,
): string | null;
```

The rules:

- `max`, `steps`: the value of the last step with `level <= character level`.
- `max`, `classLevel`: `level × multiplier`.
- `max`, `ability`: `max(minimum, getModifier(attr) + bonus)`.
- A resource with `level >` the character's level is left out.
- `unit: 'spell-slots'` is left out.
- `die` uses the same step lookup.
- Order: class resources first, then subclass resources, each in content order.

- [ ] **Step 1: Write failing tests.** Use small inline fixtures shaped like `classes.json`, plus one test that loads the real `content/dnd5e/srd-5.1/classes.json` + `i18n/en/classes.json` for monk.
  - Monk 5 (2014): box `class:monk:ki` with max 5, `points`, and recovery `short` + `long`.
  - Barbarian 20 (2014): Rage `max === null`.
  - Bard CHA 8 → Bardic Inspiration max 1 (minimum). Bard CHA 16 → 3.
  - Bard 4: `recoveryOn(box,'short') === null`. Bard 5: `'all'` (`fromLevel: 5`).
  - Rage on SRD 5.2: `recoveryOn(box,'short') === 1`.
  - Paladin 5, Lay on Hands: `unit 'hit-points'`, max 25.
  - Warlock: no box with `unit 'spell-slots'`. Warlock 11: `mystic-arcanum-6` is present.
  - **Review Focus 2:** state `used: 9` with max 5 → `used === 5`. A resource gained at 6 for a level-5 character is absent, and the input `state` object is unchanged.
  - Subclass boxes appear only when `subclassId` matches. `matchSubclass(content, ' berserker ')` returns `'berserker'`; `'Path of Wild Magic'` returns `null`.
- [ ] **Step 2: Run, expect FAIL.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run, expect PASS.**
- [ ] **Step 5: Commit** with `feat(recursos-de-classe): monta as caixinhas a partir da classe`.

---

### Task 3: Class content catalog and route

**Files:**

- Create: `src/backend/contexts/classes/` following `src/backend/contexts/conditions/` 1:1. It contains `domain/class-resources.ts` (`ClassCatalog` interface), `infrastructure/srd-classes.ts` (`import 'server-only'`; loads and validates `classes.json` + `i18n/en` + `i18n/pt` once with `classDataSchema`/`classTextSchema`/`classTranslationSchema`), `infrastructure/file-class-catalog.ts`, `index.ts` (`ClassesContext`, `createClassesContext`), `interfaces/classes.api.ts` and `interfaces/classes.schemas.ts`.
- Modify: `src/backend/index.ts` and wherever `container.contexts.conditions` is built: register `classes`.
- Create: `app/api/content/classes/route.ts`
- Create: `src/frontend/hooks/useClassResources.ts`
- Modify: `src/frontend/demo/transport.ts`: `/api/content/classes` throws `notFound()` (already the default; add a test).
- Test: `src/backend/contexts/classes/infrastructure/file-class-catalog.unit.test.ts`, `src/frontend/demo/transport.unit.test.ts`

**Interfaces:**

- Consumes: `ClassResourcesContent`, `ResourceContent` (Task 1).
- Produces:
  - `GET /api/content/classes?edition=2014|2024&class=<classId>&locale=<loc>`. It is wrapped in `withAuth` like `app/api/conditions/route.ts`. It returns `ClassResourcesContent`, or 404 for an unknown class. The query schema has `edition` as an enum of `EDITIONS`, `class` matching `/^[a-z0-9-]+$/` and `locale` with the same rule as conditions.
  - `FileClassCatalog.resources(edition: Edition, classId: string, locale?: string): ClassResourcesContent | null`.
  - Each `ResourceContent.description` is the text of the feature named by `resource.feature` in the same class/subclass. Locale text wins when it is non-empty; otherwise English. Do the same for `name` and `note`.
  - `subclass.names` holds the English name and the locale name, without duplicates.
  - The response never carries descriptions of features that don't grant a resource.
  - `useClassResources(edition: Edition | undefined, classId: string | null): { content: ClassResourcesContent | null; isLoading: boolean }`. It uses `rpgWorldApi.get` and is disabled without edition/classId. Query key `['class-resources', edition, classId, locale]`, `staleTime: Infinity`, `gcTime: 30 min`, `retry: false`. An error gives `content: null`.

- [ ] **Step 1: Write failing catalog tests.**
  - `resources('2014','monk','en')` returns `classId 'monk'`, `hitDie 8`, and a resource `ki` whose description starts with the English Ki text.
  - `resources('2014','monk','pt')` falls back to English (pt is empty).
  - `resources('2024','barbarian','en').subclass.id === 'berserker'`.
  - `resources('2014','artificer')` returns `null`.
  - The serialized monk response does not include the text of `unarmored-defense`.
  - Transport: GET `/api/content/classes?...` rejects with status 404.
- [ ] **Step 2: Run, expect FAIL.**
- [ ] **Step 3: Implement.** Before writing the route, read the route-handler doc in `node_modules/next/dist/docs/`.
- [ ] **Step 4: Run, expect PASS. Also `npx tsc --noEmit`.**
- [ ] **Step 5: Commit** with `feat(recursos-de-classe): rota de conteúdo das classes`.

---

### Task 4: `UsePips` — the spend/return control

**Files:**

- Create: `src/frontend/components/character/stats/UsePips.tsx`
- Test: `src/frontend/components/character/stats/UsePips.unit.test.tsx`
- Messages: new namespace `usePips`, inserted after `magicSystem`.

**Interfaces — Produces:**

```ts
interface UsePipsProps {
  label: string; // "Ki"; goes into each button's accessible name
  max: number | null; // null → shows the "unlimited" text, no buttons
  used: number;
  onChange: (used: number) => void | Promise<void>;
  disabled?: boolean; // read-only
  asNumber?: boolean; // force the number form (hit-points unit)
  className?: string;
}
export function UsePips(props: UsePipsProps): JSX.Element;
```

- Squares like `SpellSlots`: a 24px button around a 10px mark, no gap, ≥ 44px under `pointer-coarse`.
- Tapping an available square calls `onChange(used + 1)`; tapping a spent one calls `onChange(used - 1)`.
- Color comes from the character's tokens (`bg-character-flare` / `border-character-muted` or whatever the character theme tokens are; check `CharacterHeader`), not `info`.
- Accessible names: `"{label}, {n} de {max} disponíveis"` on the group, and `usePips.available` / `usePips.spent` per button (`{label} {slot}`).
- `asNumber || max > 20`: renders `−` / `+` buttons around `"{available} / {max}"`. `−` spends 1 and `+` returns 1, bounded to `[0,max]`.
- **Review Focus 4:** while the promise returned by `onChange` is pending, every button is disabled. They re-enable when it settles, even if it rejects.

- [ ] **Step 1: Write failing tests.**
  - max 3 used 1: three buttons. Clicking the first available → `onChange(2)`. Clicking the spent one → `onChange(0)`.
  - `max=null` → the text `usePips.unlimited`, no buttons.
  - `asNumber` max 25 used 5 → "20 / 25"; `−` → `onChange(6)`; `+` at used 0 is disabled.
  - max 30 → number form.
  - `disabled` → every button disabled.
  - Pending `onChange` → buttons disabled until it resolves; a second click calls nothing.
- [ ] **Step 2: Run, expect FAIL.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run, expect PASS** (including the hardcoded-text and tokens guards: run the whole unit suite once).
- [ ] **Step 5: Commit** with `feat(recursos-de-classe): controle de gastar e devolver`.

---

### Task 5: Resources box, edition card and the new Status row

**Files:**

- Create: `src/frontend/components/character/resources/useResourceBoxes.ts`. It reads the loaded character, runs `matchCharacterClass` with the translated class label (same `labelOf` the sheet already uses; find it with `matchCharacterClass` callers), calls `useClassResources` and `matchSubclass`, and returns `{ boxes: ResourceBox[]; content; isLoading }`.
- Create: `src/frontend/components/character/resources/ResourcesCard.tsx`
- Create: `src/frontend/components/character/resources/EditionCard.tsx`
- Create: `src/frontend/components/character/resources/ResourcesRow.tsx`
- Modify: `src/frontend/components/character/StatusView.tsx`
- Messages: new namespace `classResources`, inserted after `characterAppearance`.
- Test: one `*.unit.test.tsx` per component under `resources/`, plus `StatusView.unit.test.tsx` (create or extend).

**Interfaces:**

- Consumes:
  - `useClassResources` (Task 3).
  - `buildResourceBoxes`, `matchSubclass`, `recoveryOn` (Task 2).
  - `UsePips` (Task 4).
  - `setResourceUsed` (Task 1).
  - `saveNow` from `useCharacterActions`.
  - `readOnly` from `useSheetSource`.
- Produces:
  - `useResourceBoxes()`, used by Task 8.
  - DOM id `sheet-resources` on the Resources card, the target of the checklist's "go".

Behavior:

- **ResourcesCard.** Each box shows its name, the die when present ("d8"), recovery tags (`classResources.short` / `classResources.long`), and `UsePips`.
  - `unit 'hit-points'` passes `asNumber`.
  - Tapping calls `saveNow(setResourceUsed(key, used)(character))`, so the optimistic cache keeps all keys.
  - The name is a button that opens a popover/tooltip with `description` (+ `note`). Use the existing popover/tooltip primitive in `components/ui`.
  - An "editar" link (`classResources.edit`) goes to `${pagesPath}/appearance#class-resources`. Hidden when read-only.
- **EditionCard.** Title `classResources.newTitle` ("Novo: recursos de classe"), a one-line text, and buttons `2014` and `2024`. Clicking calls `saveNow({ edition })`.
- **ResourcesRow** renders:
  - `readOnly`: if `boxes.length > 0`, `[ResourcesCard][DeathSavesCard]`; otherwise nothing.
  - not readOnly, `!edition`: `[EditionCard][DeathSavesCard]`.
  - not readOnly, `edition` and boxes: `[ResourcesCard][DeathSavesCard]`.
  - otherwise: nothing.
  - The layout is a grid, two columns from `md`, stacked below.
  - It exports `useResourcesRowVisible(): boolean` so `StatusView` keeps `DeathSavesCard` in the side column when the row is hidden.
- **StatusView:** `ResourcesRow` goes right after `<CharacterHeader />`, inside `SheetFieldset`. `DeathSavesCard` stays in the side column only when the row is not visible. With an edition chosen and no boxes, the DOM order and classes must be identical to today.

- [ ] **Step 1: Write failing tests** (wrap with `CharacterContextProvider` and a mocked `useClassResources`).
  - Monk 5 with `edition: '2014'`: shows "Ki", 5 buttons and the tag "curto".
  - Clicking one calls `saveNow` with `resources['class:monk:ki'].used === 1` and keeps an existing other key.
  - **Review Focus 1:** class `"Monge"` with the pt locale → Ki shows.
  - Class `"Artífice"` → no row; `DeathSavesCard` is in the side column.
  - No edition → EditionCard. Clicking `2024` → `saveNow({ edition: '2024' })`.
  - **Review Focus 3:** read-only without edition → neither card nor row. `useClassResources` returning `content: null` (error) → no row, no throw.
  - Read-only with boxes → buttons disabled, no "editar".
  - Paladin 5 → Lay on Hands as "25 / 25".
  - Opening the description shows the Ki feature text.
- [ ] **Step 2: Run, expect FAIL.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run the whole unit suite, expect PASS.**
- [ ] **Step 5: Commit** with `feat(recursos-de-classe): caixa Recursos e cartão da edição na Status`.

---

### Task 6: Hit dice remaining

**Files:**

- Modify: `src/frontend/components/character/stats/CombatStatsSection.tsx`, next to the hit dice `StatBlock` (around line 108).
- Messages: new namespace `hitDiceRemaining`, inserted after `combatStats` (or whichever namespace `CombatStatsSection` uses; insert right after it).
- Test: `CombatStatsSection.unit.test.tsx` (extend or create)

**Interfaces:**

- Consumes: `UsePips` (Task 4), `setHitDiceRemaining` (Task 1), `saveNow`.
- Produces: DOM ids `sheet-hp` (HP block) and `sheet-hit-dice` (this control), the targets for Task 8.

Behavior:

- `max = character.level`.
- `available = clamp(character.hitDice?.current ?? level, 0, level)`.
- `UsePips` gets `used = level - available`. `onChange(used)` calls `saveNow(setHitDiceRemaining(level - used)(character))`.
- The label is `hitDiceRemaining.label` ("Dados de vida restantes").
- Read-only → disabled.
- Also put `id="sheet-spell-slots"` on the `SpellSlots` card wrapper in this file, if it renders there. If it doesn't, put it where `SpellSlots` is rendered.

- [ ] **Step 1: Write failing tests.**
  - Level 4, no `hitDice` → 4 available.
  - Clicking one → `saveNow({ hitDice: { total: '', current: 3 } })`, keeping the stored `total` when there is one.
  - **Review Focus 5:** stored `current: 0` → 0 available, and clicking a spent one → `current: 1`.
  - Stored `current: 9` at level 4 → shows 4.
  - Read-only → disabled.
- [ ] **Step 2: Run, expect FAIL.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run the whole unit suite, expect PASS.**
- [ ] **Step 5: Commit** with `feat(recursos-de-classe): dados de vida restantes`.

---

### Task 7: Sheet settings — "Recursos de classe" section and gear highlight

**Files:**

- Modify: `src/frontend/components/character/appearance/AppearanceTab.tsx`. Add a `Section` with `id="class-resources"`, title `sheetSettings.classResourcesTitle`, and a radio group 2014 / 2024 (the existing radio-group primitive in `components/ui`). It writes `update({ edition })`, i.e. it follows the page's save flow.
- Modify: `messages/*.json`: `characterAppearance.title` becomes "Configurar ficha" / "Sheet settings". Adjust `characterAppearance.description` so it no longer says only the look changes.
- Modify: `src/frontend/components/character/sheet/SheetPage.tsx` (`AppearanceLink`)
- Create: `src/frontend/components/character/sheet/useSettingsHint.ts`
- Messages: new namespace `sheetSettings`, inserted after `characterAppearance`. **Task 5 also inserts after `characterAppearance`.** Put `sheetSettings` _before_ `characterAppearance` instead, to avoid the conflict.
- Test: `AppearanceTab.unit.test.tsx`, `SheetPage.unit.test.tsx`, `useSettingsHint.unit.test.ts`

**Interfaces — Produces:** `useSettingsHint(): { show: boolean; dismiss: () => void }`.

- localStorage key `'rpgworld:hint:sheet-settings-177'`.
- `show` is true only when reading succeeds and finds nothing.
- `dismiss` writes `'1'` and hides.
- Every access is inside try/catch. If reading throws → `show: false`.
- Mark the hook and its call site `// TEMPORARY (#177): remove after 2027-02-01`.

Behavior:

- The gear shows a dot (token color, `aria-hidden`) plus a short hint `sheetSettings.hint` ("Novo: edição e recursos aqui") with a dismiss button.
- Clicking the gear or the dismiss button calls `dismiss`.
- Not shown when `readOnly`.

- [ ] **Step 1: Write failing tests.**
  - Empty storage → `show` true. After `dismiss`, `show` is false and storage holds `'1'`.
  - `localStorage.getItem` throwing → `show` false, no throw.
  - The SheetPage gear shows the hint when `show` is true, and clicking the gear dismisses it.
  - Read-only → no gear.
  - AppearanceTab: picking 2024 calls `update({ edition: '2024' })`. The section exists with id `class-resources`.
- [ ] **Step 2: Run, expect FAIL.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run the whole unit suite, expect PASS.**
- [ ] **Step 5: Commit** with `feat(recursos-de-classe): edição na configuração da ficha e destaque da engrenagem`.

---

### Task 8: Rest buttons and checklist

**Files:**

- Create: `src/frontend/lib/rest-checklist.ts` (pure)
- Create: `src/frontend/components/character/rest/RestChecklist.tsx`
- Create: `src/frontend/components/character/rest/RestButtons.tsx`
- Modify: `app/[locale]/(app)/(dashboard)/system/[system_name]/character/[id]/page.tsx`. `actions={<><RestButtons /><SaveCharacterButton /></>}`, so the rest buttons sit next to the gear.
- Messages: new namespace `restChecklist`, inserted after `hitDiceRemaining`.
- Test: `src/frontend/lib/rest-checklist.unit.test.ts`, `RestChecklist.unit.test.tsx`

**Interfaces:**

- Consumes: `useResourceBoxes` (Task 5), `recoveryOn` (Task 2), `getModifier`. DOM ids: `sheet-hp`, `sheet-hit-dice` (Task 6), `sheet-spell-slots` (Task 6), `sheet-resources` (Task 5).
- Produces:

```ts
export type RestTarget = 'sheet-hp' | 'sheet-hit-dice' | 'sheet-spell-slots' | 'sheet-resources';
export interface RestItem {
  id: string;
  target: RestTarget | null;
  message: string;
  values?: Record<string, string | number>;
} // message = key under restChecklist
export function buildRestChecklist(input: {
  rest: 'short' | 'long';
  level: number;
  hitDie: number | null;
  conMod: number;
  hitDiceAvailable: number;
  boxes: ResourceBox[];
  hasSpellSlots: boolean;
  hasPactSlots: boolean;
}): RestItem[];
```

Short rest items:

1. `spendHitDice` {die, bonus, left} → `sheet-hit-dice`. `bonus` is formatted as a sign string ("+2", "−1"). When the die is unknown, use `spendHitDiceNoDie`.
2. One `boxBack` {name, amount} per box where `recoveryOn(box,'short') !== null` → `sheet-resources`. `amount` is "todos" for `'all'`, otherwise the number.
3. `pactSlotsBack` when `hasPactSlots` → `sheet-spell-slots`.
4. `notBackShort` (spell slots and full HP don't come back) → `null`.

Long rest items:

1. `fullHp` → `sheet-hp`.
2. `hitDiceBack` {count: max(1, floor(level/2))} → `sheet-hit-dice`.
3. `spellSlotsBack` when `hasSpellSlots` → `sheet-spell-slots`.
4. One `boxBack` per box where `recoveryOn(box,'long') !== null`.

`hitDie`: `content.hitDie` when the class matched, else `null`. `hasPactSlots`: `content` has a resource with `unit 'spell-slots'` at this level.

RestChecklist UI:

- A non-modal `<aside aria-labelledby>` titled `restChecklist.shortTitle` / `longTitle`, with checkboxes. Ticks live in component state only.
- "Terminei" (`restChecklist.done`) and Esc close it. Focus returns to the button that opened it. There is no focus trap.
- Desktop (`md:`): `fixed bottom-4 right-4 w-80`, scrolls inside.
- Phone: `fixed inset-x-0` above `SheetTabBar` (read its height in `SheetTabBar.tsx` and use the same value) and below nothing on top (`VitalsBar` stays free).
  - Collapsed, it is a one-button-tall bar: "Descanso curto · 1 de 2" (`restChecklist.progress`). Tapping it expands.
  - Each item with a `target` has an "ir" (`restChecklist.go`) button. It runs `document.getElementById(target)?.scrollIntoView({ block: 'center' })`, focuses the first focusable element inside, and collapses the bar.
- **RestButtons:** two buttons, `restChecklist.shortRest` and `longRest`. Opening one while the other is open replaces it. Hidden when `readOnly`.

- [ ] **Step 1: Write failing tests.**
  - Monk 5, CON 14, 3 hit dice available, short rest → `spendHitDice {die:'d8', bonus:'+2', left:3}`, then `boxBack {name:'Ki', amount:'all'}`, then `notBackShort`, and no `fullHp`.
  - Long rest at level 5 → `hitDiceBack {count:2}`, and Ki is included.
  - Bard 4, short rest → no Bardic Inspiration. Bard 5 → present.
  - No class match → `spendHitDiceNoDie`, no boxes.
  - UI: ticking 1 of 2 shows "1 de 2". "Terminei" closes and focus returns to the opener. Esc closes. Reopening starts unticked.
  - "ir" calls `scrollIntoView` on `#sheet-hit-dice` (stub it on `Element.prototype`).
  - Read-only → no RestButtons.
- [ ] **Step 2: Run, expect FAIL.**
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run the whole unit suite, expect PASS.**
- [ ] **Step 5: Commit** with `feat(recursos-de-classe): botões de descanso e checklist`.

---

### Task 9 (coordinator): integration, e2e, visual, PR

**Files:**

- Test: `src/backend/contexts/characters/infrastructure/repositories/*.integration.test.ts` (extend the existing repository test). It saves `edition: '2024'` and `resources: { 'class:monk:ki': { used: 2 } }`, rereads them, then saves `{ 'class:monk:x': { used: 1 } }` through the use case and checks that both keys are kept.
- Create: `e2e/class-resources.spec.ts`. Old monk 5 sheet → pick 2014 on the card → Ki box with 5 → spend one → reload → still 4 available → Short rest → "Ki" item visible → "Terminei" closes.
- Create: `e2e/class-resources.mobile.spec.ts`. At 375px: the bar sits above the tab bar; "ir" on hit dice scrolls and collapses.
- Visual: `npm run test:visual -- --update-snapshots=all`.

- [ ] **Step 1:** In this worktree, run a real `npm ci` (Turbopack rejects a symlinked `node_modules`).
- [ ] **Step 2:** `npx vitest run --config ./test/vitest.config.integration.ts <repo test>`, then `npm run test:e2e -- e2e/class-resources*.spec.ts`, then the full `npm run test:e2e`. Run them serially, never concurrently.
- [ ] **Step 3:** Run the visual update and look at the changed snapshots. The Status tab should only change where the new row or hit dice appear.
- [ ] **Step 4:** Run `superpowers:requesting-code-review` on the whole branch.
- [ ] **Step 5:** Push and open the PR with a bilingual body (pt, then en) that closes #177, ending with `🤖 Generated with [Claude Code](https://claude.com/claude-code)`. Then move #177 to "In progress"/review on Project 1.
