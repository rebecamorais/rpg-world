# measure-volume.mjs output

Generated: 2026-11-27T17:10:10.826Z (repo HEAD 3ad7d31d)

## A. Source-language (English) volume per category

Columns: files / strings (=keys or segments) / unique strings (exact dedup within the category) / words / chars / est. tokens (ESTIMATE, chars/4).

| Group | Category | Files | Strings | Unique | Words | Chars | Est. tokens (chars/4) | Words (unique) | Chars (unique) |
|---|---|---|---|---|---|---|---|---|---|
| Application UI | messages/*.json | 1 | 1,652 | 1,468 | 8,714 | 51,158 | 12,790 | 8,411 | 49,348 |
| SRD 5.1 | srd-5.1 spells | 1 | 917 | 900 | 50,698 | 281,876 | 70,469 | 50,379 | 280,248 |
| SRD 5.1 | srd-5.1 items | 1 | 337 | 334 | 3,645 | 20,711 | 5,178 | 3,550 | 20,205 |
| SRD 5.1 | srd-5.1 conditions | 1 | 30 | 30 | 821 | 5,042 | 1,261 | 821 | 5,042 |
| SRD 5.1 | srd-5.1 classes | 1 | 675 | 452 | 22,704 | 130,796 | 32,699 | 19,137 | 110,458 |
| SRD 5.2 | srd-5.2 spells | 1 | 999 | 957 | 45,307 | 266,761 | 66,690 | 44,802 | 263,760 |
| SRD 5.2 | srd-5.2 items | 1 | 347 | 329 | 6,034 | 36,004 | 9,001 | 5,414 | 32,493 |
| SRD 5.2 | srd-5.2 conditions | 1 | 30 | 30 | 969 | 7,078 | 1,770 | 969 | 7,078 |
| SRD 5.2 | srd-5.2 classes | 1 | 740 | 461 | 21,354 | 133,564 | 33,391 | 19,502 | 121,100 |
| Docs under docs/ | docs/plans | 26 | 832 | 717 | 36,781 | 260,270 | 65,068 | 36,488 | 258,238 |
| Docs under docs/ | docs/superpowers | 12 | 355 | 319 | 18,471 | 117,336 | 29,334 | 18,282 | 116,338 |
| Docs under docs/ | docs/revisao-telas | 11 | 610 | 589 | 55,177 | 525,467 | 131,367 | 55,087 | 524,963 |
| Docs under docs/ | docs/grimoire-enchantments | 21 | 730 | 608 | 38,785 | 354,680 | 88,670 | 38,346 | 352,136 |
| Docs under docs/ | docs/(other) | 6 | 289 | 274 | 20,942 | 202,200 | 50,550 | 20,884 | 201,839 |
| Root *.md | root *.md | 8 | 163 | 154 | 3,960 | 28,416 | 7,104 | 3,949 | 28,368 |
| Other repo Markdown | .agents/ + .github/ *.md | 4 | 93 | 93 | 3,199 | 24,825 | 6,206 | 3,199 | 24,825 |
| Public files | public/llms.txt | 1 | 13 | 13 | 459 | 3,217 | 804 | 459 | 3,217 |
| Legal text | content/dnd5e/OGL-1.0a.txt (third-party licence text, not ours) | 1 | 21 | 21 | 1,016 | 6,593 | 1,648 | 1,016 | 6,593 |

NOTE: docs/, root *.md, .agents/ and .github/ Markdown are mostly written in Portuguese (see docs/INDEX.md), so chars/4 understates their tokens (Portuguese ~3.5 chars/token). The UI, SRD and llms.txt rows are English sources.

Length distribution per category (characters per string; words in the last two columns):

| Category | Mean | Median | p95 | Max | Median words | Max words |
|---|---|---|---|---|---|---|
| messages/*.json | 31 | 15 | 98 | 607 | 3 | 95 |
| srd-5.1 spells | 307 | 71 | 1,249 | 3,879 | 14 | 707 |
| srd-5.1 items | 61 | 13 | 313 | 766 | 2 | 152 |
| srd-5.1 conditions | 168 | 13 | 613 | 1,282 | 1 | 210 |
| srd-5.1 classes | 194 | 25 | 718 | 5,944 | 4 | 1,042 |
| srd-5.2 spells | 267 | 52 | 1,175 | 3,848 | 9 | 680 |
| srd-5.2 items | 104 | 14 | 413 | 5,429 | 2 | 1,113 |
| srd-5.2 conditions | 236 | 13 | 728 | 824 | 1 | 107 |
| srd-5.2 classes | 180 | 25 | 773 | 4,451 | 3 | 755 |
| docs/plans | 313 | 128 | 1,206 | 7,138 | 16 | 688 |
| docs/superpowers | 331 | 130 | 1,194 | 4,258 | 21 | 659 |
| docs/revisao-telas | 861 | 115 | 4,181 | 19,473 | 13 | 1,533 |
| docs/grimoire-enchantments | 486 | 137 | 1,991 | 13,375 | 20 | 1,089 |
| docs/(other) | 700 | 168 | 3,390 | 13,824 | 25 | 1,184 |
| root *.md | 174 | 65 | 651 | 2,329 | 8 | 374 |
| .agents/ + .github/ *.md | 267 | 104 | 1,147 | 1,631 | 14 | 279 |
| public/llms.txt | 247 | 190 | 898 | 898 | 8 | 140 |
| content/dnd5e/OGL-1.0a.txt (third-party licence text, not ours) | 314 | 185 | 782 | 2,277 | 32 | 309 |

Characters inside fenced code blocks, EXCLUDED from the Markdown counts above: docs/plans: 2,612; docs/superpowers: 748; docs/revisao-telas: 204; docs/grimoire-enchantments: 7,795; docs/(other): 373; root *.md: 2,447; .agents/ + .github/ *.md: 202; public/llms.txt: 0; content/dnd5e/OGL-1.0a.txt (third-party licence text, not ours): 0.

Group subtotals (unique = exact dedup ACROSS the whole group, so it can be lower than the sum of the rows above):

| Group | Files | Strings | Unique | Words | Chars | Est. tokens (chars/4) | Words (unique) | Chars (unique) |
|---|---|---|---|---|---|---|---|---|
| Application UI | 1 | 1,652 | 1,468 | 8,714 | 51,158 | 12,790 | 8,411 | 49,348 |
| SRD 5.1 (4 types) | 4 | 1,959 | 1,715 | 77,868 | 438,425 | 109,606 | 73,886 | 415,947 |
| SRD 5.2 (4 types) | 4 | 2,116 | 1,776 | 73,664 | 443,407 | 110,852 | 70,686 | 424,425 |
| PRODUCT CORPUS = UI + SRD 5.1 + SRD 5.2 | 9 | 5,727 | 4,282 | 160,246 | 932,990 | 233,248 | 151,547 | 880,747 |
| docs/ (md, excl. docs/discovery) | 76 | 2,816 | 2,488 | 170,156 | 1,459,953 | 364,988 | 169,034 | 1,453,243 |
| root *.md + .agents/.github *.md | 12 | 256 | 247 | 7,159 | 53,241 | 13,310 | 7,148 | 53,193 |
| public/llms.txt | 1 | 13 | 13 | 459 | 3,217 | 804 | 459 | 3,217 |

SRD by type, both books together (strings, words):

| Type | Strings 5.1 | Strings 5.2 | Words 5.1 | Words 5.2 |
|---|---|---|---|---|
| spells | 917 | 999 | 50,698 | 45,307 |
| items | 337 | 347 | 3,645 | 6,034 |
| conditions | 30 | 30 | 821 | 969 |
| classes | 675 | 740 | 22,704 | 21,354 |

UI by top-level namespace (top 15 by words; total namespaces: 55):

| Namespace | Strings | Words | Chars |
|---|---|---|---|
| parties | 233 | 1,415 | 7,773 |
| common | 162 | 1,023 | 5,739 |
| privacy | 45 | 942 | 5,920 |
| features | 86 | 742 | 4,336 |
| terms | 32 | 666 | 4,486 |
| characters | 225 | 600 | 3,618 |
| combat | 87 | 291 | 1,690 |
| accountDeletion | 41 | 290 | 1,630 |
| resourceEditor | 49 | 204 | 982 |
| skills | 46 | 170 | 1,121 |
| demo | 23 | 154 | 953 |
| spellsData | 61 | 146 | 986 |
| combatStats | 39 | 139 | 715 |
| feedback | 21 | 124 | 692 |
| proficiencies | 48 | 119 | 664 |

Public/marketing/legal namespaces INSIDE the UI file (a subset of the UI row, NOT additional): landing, features, seo, terms, privacy, footer, translationInvite, demo, login, register, forgotPassword, resetPassword, maintenance, notFound, errorPage.
Subset total: 299 strings, 2,997 words, 18,561 chars. Of which terms+privacy (legal): 1,608 words.

## B. Translatable fields (SRD en files)

Field role (leaf key name) across both books:

| Type :: field | Strings | Words | Chars |
|---|---|---|---|
| spells :: description | 658 | 86,361 | 495,394 |
| classes :: * | 1,367 | 43,986 | 263,852 |
| items :: description | 217 | 8,924 | 51,999 |
| spells :: higherLevel | 215 | 5,091 | 27,966 |
| spells :: material | 373 | 3,121 | 16,163 |
| conditions :: description | 30 | 1,760 | 11,858 |
| spells :: name | 658 | 1,226 | 8,003 |
| items :: name | 467 | 755 | 4,716 |
| spells :: trigger | 12 | 206 | 1,111 |
| classes :: subclassTitle | 24 | 48 | 360 |
| conditions :: name | 30 | 30 | 262 |
| classes :: name | 24 | 24 | 148 |

## C. Must-preserve tokens

UI (messages/en.json), ICU / rich-text usage (measured, regex-based; a plural counts once even if nested):

| Pattern | Strings |
|---|---|
| strings with {var} placeholder (any) | 180 |
| strings with plural | 19 |
| strings with select | 1 |
| strings with selectordinal | 0 |
| strings with rich-text tags <x> | 34 |
| strings with ICU apostrophe-escape (') next to { or } | 0 |
| strings with "#" inside a plural | 11 |
| strings with a literal newline | 1 |
| strings with markdown-ish **/[]() | 0 |

Distinct argument names used: 68. Rich-text tag names (occurrences): bold=16, magic=2, srd=2, ccby=4, srd52=2, srdEs=2, ccbyEs=2, api=2, database=2, fivetools=2, foundry=2, foundryEs=2, notice=2, supabase=8, google=6, vercel=6, cloudflare=8, resend=4, discord=8, lgpd=6, support=4, server=4, b=6, i=6, strong=4.

SRD content (en, both books), Foundry/5etools-style tags and formatting inside strings:

| Item | Count |
|---|---|
| strings containing at least one {@tag ...} | 1,023 |
| {@tag ...} occurrences | 3,349 |
| of which with a 3rd segment (display-text override, translatable) | 555 |
| bare dice expressions (NdM, incl. inside {@damage}/{@dice}) | 621 |
| Markdown table lines (^|...|$) | 77 |
| bullet lines (starting with •) | 370 |
| newline characters inside strings | 2,558 |

Tag types (occurrences): variantrule=901, condition=491, item=313, spell=299, damage=232, action=164, filter=137, 5etools=126, dc=105, skill=85, dice=83, feat=64, optfeature=63, scaledamage=52, i=43, creature=36, book=35, status=27, b=19, sense=15, deity=13, hazard=11, chance=10, race=10, scaledice=6, language=3, quickref=3, itemMastery=3

## D. Coverage per target language

Per category, relative to the English keys (en = 100%). translated = key present with non-empty text; empty = key present with ""; missing = key absent. "same as en" = translated text identical to the English (a copy or a legitimately identical proper noun; a subset of translated). Words are English words of the covered keys.

| Category | Lang | en keys | Translated | Empty | Missing | % keys translated | Same as en | % en words covered |
|---|---|---|---|---|---|---|---|---|
| messages/*.json | pt | 1,652 | 1,652 | 0 | 0 | 100.0% | 61 | 100.0% |
| messages/*.json | es | 1,652 | 0 | 0 | 1,652 | 0.0% | 0 | 0.0% |
| messages/*.json | sv | 1,652 | 0 | 0 | 1,652 | 0.0% | 0 | 0.0% |
| srd-5.1 spells | pt | 917 | 733 | 184 | 0 | 79.9% | 1 | 96.1% |
| srd-5.1 spells | es | 917 | 917 | 0 | 0 | 100.0% | 2 | 100.0% |
| srd-5.1 spells | sv | 917 | 0 | 917 | 0 | 0.0% | 0 | 0.0% |
| srd-5.1 items | pt | 337 | 324 | 13 | 0 | 96.1% | 3 | 87.5% |
| srd-5.1 items | es | 337 | 147 | 190 | 0 | 43.6% | 1 | 6.2% |
| srd-5.1 items | sv | 337 | 0 | 337 | 0 | 0.0% | 0 | 0.0% |
| srd-5.1 conditions | pt | 30 | 15 | 15 | 0 | 50.0% | 0 | 1.8% |
| srd-5.1 conditions | es | 30 | 30 | 0 | 0 | 100.0% | 1 | 100.0% |
| srd-5.1 conditions | sv | 30 | 0 | 30 | 0 | 0.0% | 0 | 0.0% |
| srd-5.1 classes | pt | 675 | 494 | 180 | 1 | 73.2% | 1 | 43.8% |
| srd-5.1 classes | es | 675 | 146 | 522 | 7 | 21.6% | 0 | 1.3% |
| srd-5.1 classes | sv | 675 | 0 | 668 | 7 | 0.0% | 0 | 0.0% |
| srd-5.2 spells | pt | 999 | 313 | 686 | 0 | 31.3% | 1 | 1.3% |
| srd-5.2 spells | es | 999 | 983 | 16 | 0 | 98.4% | 3 | 95.8% |
| srd-5.2 spells | sv | 999 | 0 | 999 | 0 | 0.0% | 0 | 0.0% |
| srd-5.2 items | pt | 347 | 216 | 131 | 0 | 62.2% | 2 | 5.4% |
| srd-5.2 items | es | 347 | 287 | 60 | 0 | 82.7% | 2 | 64.0% |
| srd-5.2 items | sv | 347 | 0 | 347 | 0 | 0.0% | 0 | 0.0% |
| srd-5.2 conditions | pt | 30 | 15 | 15 | 0 | 50.0% | 0 | 1.5% |
| srd-5.2 conditions | es | 30 | 15 | 15 | 0 | 50.0% | 1 | 1.5% |
| srd-5.2 conditions | sv | 30 | 0 | 30 | 0 | 0.0% | 0 | 0.0% |
| srd-5.2 classes | pt | 740 | 227 | 511 | 2 | 30.7% | 0 | 2.5% |
| srd-5.2 classes | es | 740 | 449 | 283 | 8 | 60.7% | 0 | 81.9% |
| srd-5.2 classes | sv | 740 | 0 | 732 | 8 | 0.0% | 0 | 0.0% |

Roll-up per language (all categories with a translation structure: UI + SRD 5.1 + SRD 5.2; docs/markdown have no translations):

| Lang | en keys | Translated | Empty | Missing | % keys translated | en words translated | en words still to translate | % words translated |
|---|---|---|---|---|---|---|---|---|
| pt | 5,727 | 3,989 | 1,735 | 3 | 69.7% | 72,027 | 88,219 | 44.9% |
| es | 5,727 | 2,974 | 1,086 | 1,667 | 51.9% | 116,805 | 43,441 | 72.9% |
| sv | 5,727 | 0 | 4,060 | 1,667 | 0.0% | 0 | 160,246 | 0.0% |

Cheap quality/staleness proxies among TRANSLATED keys (not proof of error): "parity breaks" = the translation differs from the English in the multiset of dice expressions, {@tags}, ICU {args} or <rich> tags; "length outliers" = English >= 80 chars and translated length < 0.5x or > 2.0x of it (possible truncation or stale text).

| Category | Lang | Translated | Parity breaks | Length outliers |
|---|---|---|---|---|
| messages/*.json | pt | 1,652 | 11 | 0 |
| srd-5.1 spells | pt | 733 | 13 | 2 |
| srd-5.1 spells | es | 917 | 15 | 1 |
| srd-5.1 items | pt | 324 | 0 | 0 |
| srd-5.1 items | es | 147 | 0 | 0 |
| srd-5.1 conditions | pt | 15 | 0 | 0 |
| srd-5.1 conditions | es | 30 | 0 | 0 |
| srd-5.1 classes | pt | 494 | 0 | 0 |
| srd-5.1 classes | es | 146 | 0 | 0 |
| srd-5.2 spells | pt | 313 | 0 | 0 |
| srd-5.2 spells | es | 983 | 0 | 0 |
| srd-5.2 items | pt | 216 | 0 | 0 |
| srd-5.2 items | es | 287 | 0 | 0 |
| srd-5.2 conditions | pt | 15 | 0 | 0 |
| srd-5.2 conditions | es | 15 | 0 | 0 |
| srd-5.2 classes | pt | 227 | 0 | 0 |
| srd-5.2 classes | es | 449 | 0 | 0 |

First parity-break keys (for manual inspection): ui/pt/restChecklist.boxBack; ui/pt/spellsDrawer.filtersToggle; ui/pt/spellsData.castingTimes.minute; ui/pt/spellsData.castingTimes.hour; ui/pt/spellsData.castingTimes.day; ui/pt/spellsData.ranges.feet; ui/pt/spellsData.ranges.mile; ui/pt/spellsData.durations.minute; ui/pt/spellsData.durations.hour; ui/pt/spellsData.durations.day; ui/pt/spellsData.durations.round; srd51:spells/pt/bane.description

Coverage by field role (leaf key name), SRD only, both books (en keys = non-empty English strings):

| Field | en keys | pt translated | es translated | sv translated |
|---|---|---|---|---|
| classes :: name | 752 | 574 (76.3%) | 407 (54.1%) | 0 (0.0%) |
| spells :: name | 658 | 632 (96.0%) | 658 (100.0%) | 0 (0.0%) |
| spells :: description | 658 | 319 (48.5%) | 651 (98.9%) | 0 (0.0%) |
| classes :: description | 603 | 128 (21.2%) | 188 (31.2%) | 0 (0.0%) |
| items :: name | 467 | 467 (100.0%) | 326 (69.8%) | 0 (0.0%) |
| spells :: material | 373 | 0 (0.0%) | 372 (99.7%) | 0 (0.0%) |
| items :: description | 217 | 73 (33.6%) | 108 (49.8%) | 0 (0.0%) |
| spells :: higherLevel | 215 | 91 (42.3%) | 215 (100.0%) | 0 (0.0%) |
| classes :: note | 36 | 7 (19.4%) | 0 (0.0%) | 0 (0.0%) |
| conditions :: name | 30 | 30 (100.0%) | 30 (100.0%) | 0 (0.0%) |
| conditions :: description | 30 | 0 (0.0%) | 15 (50.0%) | 0 (0.0%) |
| classes :: subclassTitle | 24 | 12 (50.0%) | 0 (0.0%) | 0 (0.0%) |
| spells :: trigger | 12 | 4 (33.3%) | 4 (33.3%) | 0 (0.0%) |

Measured expansion on translated pairs (target/en; excludes identical and empty pairs):

| Lang | Paired en chars | Chars ratio | Words ratio |
|---|---|---|---|
| pt | 407,397 | 1.096 | 1.059 |
| es | 679,021 | 1.135 | 1.088 |
| sv | 0 | n/a | n/a |

## E. Duplicates (English source)

Distinct strings in the product corpus: 4,282; present in more than one category: 655 (1,413 words once); of those >= 40 chars: 7 (166 words once).

Category pairs sharing identical strings (top by words; "long" = >= 40 chars):

| Pair | Shared strings | Words | Shared (long) | Words (long) |
|---|---|---|---|---|
| srd51:spells <-> srd52:spells | 349 | 850 | 4 | 133 |
| srd51:classes <-> srd52:classes | 119 | 282 | 3 | 33 |
| srd51:items <-> srd52:items | 170 | 263 | 0 | 0 |
| srd51:classes <-> ui | 15 | 16 | 0 | 0 |
| srd52:classes <-> ui | 15 | 16 | 0 | 0 |
| srd51:conditions <-> srd52:conditions | 15 | 15 | 0 | 0 |
| srd51:spells <-> ui | 5 | 5 | 0 | 0 |
| srd52:spells <-> ui | 5 | 5 | 0 | 0 |
| srd51:items <-> ui | 4 | 4 | 0 | 0 |
| srd52:items <-> ui | 4 | 4 | 0 | 0 |
| srd51:classes <-> srd52:spells | 1 | 2 | 0 | 0 |
| srd51:items <-> srd51:spells | 1 | 1 | 0 | 0 |
| srd51:items <-> srd52:spells | 1 | 1 | 0 | 0 |
| srd51:spells <-> srd52:items | 1 | 1 | 0 | 0 |

Duplicates inside each category (strings that repeat with the same text):

| Category | Strings | Unique | Repeated strings | Words saved by dedup |
|---|---|---|---|---|
| messages/*.json | 1,652 | 1,468 | 184 | 303 |
| srd-5.1 spells | 917 | 900 | 17 | 319 |
| srd-5.1 items | 337 | 334 | 3 | 95 |
| srd-5.1 conditions | 30 | 30 | 0 | 0 |
| srd-5.1 classes | 675 | 452 | 223 | 3,567 |
| srd-5.2 spells | 999 | 957 | 42 | 505 |
| srd-5.2 items | 347 | 329 | 18 | 620 |
| srd-5.2 conditions | 30 | 30 | 0 | 0 |
| srd-5.2 classes | 740 | 461 | 279 | 1,852 |

SRD 5.1 vs 5.2, same entry id (spells/items/conditions/classes), English text:

| Type | Keys 5.1 | Keys 5.2 | Same key in both | Identical | Words identical | Near (Jaccard>=0.8 of word sets) | Words near | Words (5.2 side) of shared keys |
|---|---|---|---|---|---|---|---|---|
| spells | 917 | 999 | 905 | 352 | 862 | 100 | 10,171 | 42,447 |
| items | 337 | 347 | 221 | 170 | 263 | 3 | 72 | 1,832 |
| conditions | 30 | 30 | 30 | 15 | 15 | 0 | 0 | 969 |
| classes | 675 | 740 | 379 | 210 | 524 | 0 | 0 | 12,904 |

Near-duplicates (method: lowercased 4-word shingles of strings with >= 8 words; candidate pairs found through an inverted index (shingles with document frequency <= 200); Jaccard on shingle sets; exact duplicates excluded). Different keys only.

Strings compared (>= 8 words, exact-dedup'd): 2,032 (145,816 words).

| Jaccard >= | Near-duplicate pairs | Strings with >= 1 partner | Words in those strings |
|---|---|---|---|
| 0.9 | 21 | 36 | 2,487 |
| 0.8 | 89 | 97 | 6,884 |
| 0.7 | 169 | 165 | 12,529 |

Of the pairs at >= 0.8, across different categories: 19. Note: spells in 5.1 vs 5.2 are the main source; strings that are near-identical are candidates for translation-memory fuzzy matches, not for removal.

## F. Git history of the English source files

Repository: 402 commits on HEAD, root commit date 2026-02-19T23:00:48-03:00.
First commit touching content/dnd5e/srd-5.1/i18n/en/spells.json: 2026-10-21T19:02:30-03:00 5eadcb0a feat(magias): magias oficiais em arquivo, com a fonte na chave (#81)

Method: for each file, replay `git log --first-parent --reverse -- <file>`; compare the flattened key->string maps of consecutive versions. "added" = key new or previously empty; "changed" = non-empty value that differs; words = words of the NEW value. Date = committer date (squash-merge date, i.e. when it reached main). Commits of the importer/Crowdin/Weblate are counted like any other: see the noise notes in the docs.

### UI: messages/en.json (125 file-commits)

| Month | Commits | Keys added | Words added | Keys changed | Words changed | Keys removed |
|---|---|---|---|---|---|---|
| 2026-02 | 6 | 97 | 272 | 0 | 0 | 0 |
| 2026-03 | 26 | 298 | 1,404 | 9 | 12 | 18 |
| 2026-04 | 13 | 122 | 299 | 4 | 15 | 0 |
| 2026-10 | 28 | 348 | 1,978 | 38 | 969 | 50 |
| 2026-11 | 52 | 907 | 4,889 | 211 | 2,458 | 52 |

Largest single commits (words added+changed): 23bab4f9 2026-11-04 en.json +887/~473; fe29a2d2 2026-10-15 en.json +708/~303; 39634141 2026-11-15 en.json +352/~394; cbce7e70 2026-11-03 en.json +365/~295; 423a3056 2026-03-12 en.json +617/~0

Words added+changed per month over 5 calendar months with activity: total 12,296, mean 2,459.2, median 1,416, max 7,347.

### Content: 8 files srd-{5.1,5.2}/i18n/en/*.json (17 file-commits)

| Month | Commits | Keys added | Words added | Keys changed | Words changed | Keys removed |
|---|---|---|---|---|---|---|
| 2026-10 | 4 | 1,916 | 94,027 | 0 | 0 | 0 |
| 2026-11 | 5 | 2,159 | 55,521 | 471 | 54,207 | 0 |

Every file-commit of the content source files (the content grows in import events, not steadily):

| Date | SHA | File | Keys added | Words added | Keys changed | Words changed |
|---|---|---|---|---|---|---|
| 2026-10-21 | 5eadcb0a | srd-5.1/spells.json | 912 | 50,438 | 0 | 0 |
| 2026-10-22 | 22cc3e91 | srd-5.1/spells.json | 1 | 26 | 0 | 0 |
| 2026-10-22 | 21be6722 | srd-5.2/spells.json | 991 | 43,360 | 0 | 0 |
| 2026-10-23 | d0644b07 | srd-5.1/spells.json | 4 | 67 | 0 | 0 |
| 2026-10-23 | d0644b07 | srd-5.2/spells.json | 8 | 136 | 0 | 0 |
| 2026-11-01 | f3c99541 | srd-5.1/spells.json | 0 | 0 | 83 | 15,109 |
| 2026-11-01 | f3c99541 | srd-5.1/conditions.json | 30 | 821 | 0 | 0 |
| 2026-11-01 | f3c99541 | srd-5.2/spells.json | 0 | 0 | 387 | 39,083 |
| 2026-11-01 | f3c99541 | srd-5.2/conditions.json | 30 | 969 | 0 | 0 |
| 2026-11-03 | db5ba784 | srd-5.1/items.json | 337 | 3,645 | 0 | 0 |
| 2026-11-03 | db5ba784 | srd-5.2/items.json | 347 | 6,034 | 0 | 0 |
| 2026-11-13 | 9be56f6c | srd-5.1/classes.json | 668 | 22,652 | 0 | 0 |
| 2026-11-13 | 9be56f6c | srd-5.2/classes.json | 732 | 21,282 | 0 | 0 |
| 2026-11-23 | 9156c31d | srd-5.1/classes.json | 1 | 11 | 0 | 0 |
| 2026-11-23 | 9156c31d | srd-5.2/classes.json | 2 | 25 | 1 | 15 |
| 2026-11-26 | 91c07a23 | srd-5.1/classes.json | 6 | 41 | 0 | 0 |
| 2026-11-26 | 91c07a23 | srd-5.2/classes.json | 6 | 41 | 0 | 0 |

Largest single commits (words added+changed): 5eadcb0a 2026-10-21 spells.json +50438/~0; 21be6722 2026-10-22 spells.json +43360/~0; f3c99541 2026-11-01 spells.json +0/~39083; 9be56f6c 2026-11-13 classes.json +22652/~0; 9be56f6c 2026-11-13 classes.json +21282/~0

Words added+changed per month over 2 calendar months with activity: total 203,755, mean 101,877.5, median 94,027, max 109,728.

### Possibly outdated translations (git-based proxy)

A translated key is flagged "possibly outdated" when the English value of that key last changed AFTER the translation last changed (per-key replay of both files; same-commit changes are not flagged). Limits: a pure English typo fix flags a still-valid translation; a translation edited for another reason hides staleness; commits are squash dates, so a Weblate PR lagging a source change can flag a key that was in fact translated from the new text.

| Category | Lang | Translated keys | Possibly outdated | % | Words (en side) |
|---|---|---|---|---|---|
| UI | pt | 1,652 | 30 | 1.8% | 251 |
| srd-5.1 spells | pt | 733 | 0 | 0.0% | 0 |
| srd-5.1 spells | es | 917 | 0 | 0.0% | 0 |
| srd-5.1 items | pt | 324 | 0 | 0.0% | 0 |
| srd-5.1 items | es | 147 | 0 | 0.0% | 0 |
| srd-5.1 conditions | pt | 15 | 0 | 0.0% | 0 |
| srd-5.1 conditions | es | 30 | 0 | 0.0% | 0 |
| srd-5.1 classes | pt | 494 | 0 | 0.0% | 0 |
| srd-5.1 classes | es | 146 | 0 | 0.0% | 0 |
| srd-5.2 spells | pt | 313 | 0 | 0.0% | 0 |
| srd-5.2 spells | es | 983 | 0 | 0.0% | 0 |
| srd-5.2 items | pt | 216 | 0 | 0.0% | 0 |
| srd-5.2 items | es | 287 | 0 | 0.0% | 0 |
| srd-5.2 conditions | pt | 15 | 0 | 0.0% | 0 |
| srd-5.2 conditions | es | 15 | 0 | 0.0% | 0 |
| srd-5.2 classes | pt | 227 | 0 | 0.0% | 0 |
| srd-5.2 classes | es | 449 | 0 | 0.0% | 0 |

| Lang | Translated keys | Possibly outdated | % |
|---|---|---|---|
| pt | 3,989 | 30 | 0.8% |
| es | 2,974 | 0 | 0.0% |
| sv | 0 | 0 | n/a |

## G. Projections (ARITHMETIC, not measurements)

Assumptions: output chars per language = source chars x 1.116 (mean of measured pt and es char ratios); output words = source words x 1.074 (measured); output tokens = output chars / 3.5 (heuristic for pt/es); input tokens = source chars / 4 and the source is re-sent once per target language (no batching of languages). Content multiplier scales the SOURCE. N languages = N independent full translations from scratch (existing human translations NOT deducted).

### Base: PRODUCT CORPUS (UI + SRD 5.1 + 5.2), all strings, no dedup (source: 160,246 words, 932,990 chars)

| Content | Target langs | Source words | Output words | Output chars | Input tokens (ESTIMATE) | Output tokens (ESTIMATE) |
|---|---|---|---|---|---|---|
| 1x | 2 | 160,246 | 344,132 | 2,081,985 | 466,495 | 594,853 |
| 1x | 5 | 160,246 | 860,329 | 5,204,963 | 1,166,238 | 1,487,132 |
| 1x | 10 | 160,246 | 1,720,659 | 10,409,926 | 2,332,475 | 2,974,265 |
| 1x | 20 | 160,246 | 3,441,318 | 20,819,852 | 4,664,950 | 5,948,529 |
| 2x | 2 | 320,492 | 688,264 | 4,163,970 | 932,990 | 1,189,706 |
| 2x | 5 | 320,492 | 1,720,659 | 10,409,926 | 2,332,475 | 2,974,265 |
| 2x | 10 | 320,492 | 3,441,318 | 20,819,852 | 4,664,950 | 5,948,529 |
| 2x | 20 | 320,492 | 6,882,636 | 41,639,705 | 9,329,900 | 11,897,059 |
| 5x | 2 | 801,230 | 1,720,659 | 10,409,926 | 2,332,475 | 2,974,265 |
| 5x | 5 | 801,230 | 4,301,647 | 26,024,816 | 5,831,188 | 7,435,662 |
| 5x | 10 | 801,230 | 8,603,295 | 52,049,631 | 11,662,375 | 14,871,323 |
| 5x | 20 | 801,230 | 17,206,589 | 104,099,262 | 23,324,750 | 29,742,646 |
| 10x | 2 | 1,602,460 | 3,441,318 | 20,819,852 | 4,664,950 | 5,948,529 |
| 10x | 5 | 1,602,460 | 8,603,295 | 52,049,631 | 11,662,375 | 14,871,323 |
| 10x | 10 | 1,602,460 | 17,206,589 | 104,099,262 | 23,324,750 | 29,742,646 |
| 10x | 20 | 1,602,460 | 34,413,178 | 208,198,524 | 46,649,500 | 59,485,293 |

### Base: PRODUCT CORPUS, unique strings only (exact dedup across the corpus) (source: 151,547 words, 880,747 chars)

| Content | Target langs | Source words | Output words | Output chars | Input tokens (ESTIMATE) | Output tokens (ESTIMATE) |
|---|---|---|---|---|---|---|
| 1x | 2 | 151,547 | 325,450 | 1,965,404 | 440,374 | 561,544 |
| 1x | 5 | 151,547 | 813,626 | 4,913,510 | 1,100,934 | 1,403,860 |
| 1x | 10 | 151,547 | 1,627,252 | 9,827,020 | 2,201,868 | 2,807,720 |
| 1x | 20 | 151,547 | 3,254,505 | 19,654,040 | 4,403,735 | 5,615,440 |
| 2x | 2 | 303,094 | 650,901 | 3,930,808 | 880,747 | 1,123,088 |
| 2x | 5 | 303,094 | 1,627,252 | 9,827,020 | 2,201,868 | 2,807,720 |
| 2x | 10 | 303,094 | 3,254,505 | 19,654,040 | 4,403,735 | 5,615,440 |
| 2x | 20 | 303,094 | 6,509,010 | 39,308,080 | 8,807,470 | 11,230,880 |
| 5x | 2 | 757,735 | 1,627,252 | 9,827,020 | 2,201,868 | 2,807,720 |
| 5x | 5 | 757,735 | 4,068,131 | 24,567,550 | 5,504,669 | 7,019,300 |
| 5x | 10 | 757,735 | 8,136,262 | 49,135,099 | 11,009,338 | 14,038,600 |
| 5x | 20 | 757,735 | 16,272,524 | 98,270,199 | 22,018,675 | 28,077,200 |
| 10x | 2 | 1,515,470 | 3,254,505 | 19,654,040 | 4,403,735 | 5,615,440 |
| 10x | 5 | 1,515,470 | 8,136,262 | 49,135,099 | 11,009,338 | 14,038,600 |
| 10x | 10 | 1,515,470 | 16,272,524 | 98,270,199 | 22,018,675 | 28,077,200 |
| 10x | 20 | 1,515,470 | 32,545,049 | 196,540,398 | 44,037,350 | 56,154,399 |

### Base: PRODUCT + docs/ + root/.agents/.github md + llms.txt (source: 338,020 words, 2,449,401 chars)

| Content | Target langs | Source words | Output words | Output chars | Input tokens (ESTIMATE) | Output tokens (ESTIMATE) |
|---|---|---|---|---|---|---|
| 1x | 2 | 338,020 | 725,905 | 5,465,886 | 1,224,701 | 1,561,682 |
| 1x | 5 | 338,020 | 1,814,763 | 13,664,714 | 3,061,751 | 3,904,204 |
| 1x | 10 | 338,020 | 3,629,527 | 27,329,429 | 6,123,503 | 7,808,408 |
| 1x | 20 | 338,020 | 7,259,053 | 54,658,857 | 12,247,005 | 15,616,816 |
| 2x | 2 | 676,040 | 1,451,811 | 10,931,771 | 2,449,401 | 3,123,363 |
| 2x | 5 | 676,040 | 3,629,527 | 27,329,429 | 6,123,503 | 7,808,408 |
| 2x | 10 | 676,040 | 7,259,053 | 54,658,857 | 12,247,005 | 15,616,816 |
| 2x | 20 | 676,040 | 14,518,106 | 109,317,715 | 24,494,010 | 31,233,633 |
| 5x | 2 | 1,690,100 | 3,629,527 | 27,329,429 | 6,123,503 | 7,808,408 |
| 5x | 5 | 1,690,100 | 9,073,817 | 68,323,572 | 15,308,756 | 19,521,021 |
| 5x | 10 | 1,690,100 | 18,147,633 | 136,647,144 | 30,617,513 | 39,042,041 |
| 5x | 20 | 1,690,100 | 36,295,266 | 273,294,287 | 61,235,025 | 78,084,082 |
| 10x | 2 | 3,380,200 | 7,259,053 | 54,658,857 | 12,247,005 | 15,616,816 |
| 10x | 5 | 3,380,200 | 18,147,633 | 136,647,144 | 30,617,513 | 39,042,041 |
| 10x | 10 | 3,380,200 | 36,295,266 | 273,294,287 | 61,235,025 | 78,084,082 |
| 10x | 20 | 3,380,200 | 72,590,532 | 546,588,574 | 122,470,050 | 156,168,164 |

