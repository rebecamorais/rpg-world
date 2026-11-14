# Recursos de classe e descanso — desenho (#177)

Issue: rebecamorais/rpg-world#177 (mãe: #175). Brainstorm com a Rebeca em 2026-11-13/14; mockups em `.superpowers/brainstorm/` (fora do git).
Este documento junta o que ela decidiu (marcado **decidido**) e as escolhas técnicas minhas (marcadas **minha escolha**, para ela conferir).

## Por que

A ficha não conhece as regras da classe. Quem joga de Monge, Bárbaro, Bardo… controla Ki, Fúria, Inspiração e o que volta no descanso fora do app (pedido de jogador no Discord, ver #175). Desde a #176 os dados das 12 classes do SRD 5.1 e 5.2 estão em `content/dnd5e/srd-5.x/classes.json`. Este passo põe esses dados na ficha.

Sucesso: na mesa, a jogadora vê as caixinhas da classe dela já com o máximo certo, gasta com um toque, e no descanso tem uma lista do que atualizar, sem precisar abrir o livro.

## Objetivos

1. **Edição no personagem** (2014 ou 2024), escolhida pela jogadora.
2. **Caixa "Recursos"** na aba Status com as caixinhas padrão da classe oficial + subclasse do SRD, no nível e edição do personagem.
3. **Gastar e devolver** com um toque, salvo na ficha.
4. **Descanso curto e longo** como **checklist** do que atualizar.
5. **Dados de vida restantes** na ficha: hoje não há onde marcar quantos sobram (`hitDice.current` existe no tipo, mas nenhuma tela mostra; `setHitDice` só preserva o valor antigo, que começa em 0).
6. **Modelo de dados que já aguenta a #180** (editar, esconder, criar caixinha própria) sem migração depois.

## Fora de escopo (com issue)

- Tela de editar/esconder/cor/criar caixinha: **#180**.
- Conjuração Flexível e Metamagia do Feiticeiro: **#204**.
- Descanso que aplica sozinho (modal que rola e aplica): **#205**.
- Escolher a edição na criação do personagem: **#178**.
- Revisão dos recursos do SRD 5.2 por quem joga: **#179** (não bloqueia o código; bloqueia confiar nos números).
- Multiclasse, talentos e itens como origem: #180/#182.
- Mostrar caixinhas na visão de combate (#190): não.

## Anti-objetivos (falhou mesmo que funcione)

- **O descanso mudar a ficha sozinho.** Neste passo, nada no descanso escreve na ficha (**decidido**).
- **Subir de nível apagar o que a jogadora mudou** numa caixinha (**decidido**, #180).
- **Ficha sem caixinhas ficar mais pesada**: sem caixinhas e com edição escolhida, a Status fica igual a hoje (**decidido**).
- **Fichas antigas quebrarem** ou mudarem sem a jogadora escolher a edição.
- **Diálogo interrompendo** a abertura da ficha (ela escolheu o cartão, não o diálogo).
- No celular, a checklist **tampar a ficha** a ponto de atrapalhar a edição (**decidido**).

## Restrições do projeto

- Next.js 16 do repositório (ler `node_modules/next/dist/docs/` antes de API nova), Supabase, TanStack Query, next-intl.
- Textos de interface só por next-intl, chaves em `messages/en.json` e `messages/pt.json` (es/sv pelo Crowdin). Guardas de teste: texto fixo, tokens de design (nada de paleta crua do Tailwind), nomes de ícones do game-icons.
- Estilo: fantasia sóbria, tema escuro padrão, tokens; mobile primeiro, alvos de toque ≥ 44px no celular (`pointer-coarse`).
- Comentários em inglês, descrições de teste em português.
- Sem migration esperada: tudo cabe em `characters.system_data` (JSON). Se aparecer necessidade de migration, parar e perguntar (merge no `main` aplica migration em produção).
- A ficha só de leitura (mestre lendo pela mesa, visualizador da #189) já obedece `readOnly` de `useSheetSource`.

## Decidido com ela

### Edição

- Campo **do personagem**: `2014` (SRD 5.1) ou `2024` (SRD 5.2). A edição da mesa continua só para o mestre. Use o tipo `Edition` de `shared/systems/dnd5e/content/editions.ts`.
- **Ficha sem edição**: na aba Status, **no lugar da caixa Recursos**, um cartão **"Novo: recursos de classe"** com dois botões, 2014 e 2024. Fica até ela escolher. Não é diálogo.
- Depois de escolhida, a edição se troca na **configuração da ficha** (a engrenagem, hoje a página Aparência em `…/appearance`), numa seção nova **"Recursos de classe"**. Neste passo a seção só tem a edição.
- **Destaque temporário na engrenagem**: na primeira vez que a jogadora abre uma ficha depois da novidade, a engrenagem ganha um destaque (brilho ou pontinho) e uma dica curta ("Novo: edição e recursos aqui"). Clicar ou dispensar some com ele e grava no `localStorage`. Marcar no código como temporário, para remover depois.

### Caixinhas

- **Uma caixa "Recursos"** na aba **Status**, **logo abaixo do cabeçalho**, **na linha de Testes contra a morte**. Sempre visível (não é drawer).
- **Quadradinhos como os espaços de magia** (`SpellSlots`): tocar num disponível gasta, tocar num gasto devolve. Cor padrão: a cor da ficha (`character-flare`/tokens do tema do personagem).
- Cada caixinha: nome, etiqueta da recuperação ("curto"/"longo"), descrição da regra ao passar o mouse ou tocar no nome. A descrição é **o texto da característica que dá o recurso** (`resource.feature` → `features[id].description`) mais a `note` quando houver (**minha escolha**: quase nenhum recurso tem `note`).
- Vêm da classe **oficial** (uma das 12) + **subclasse do SRD** + nível + edição. Classe fora das 12 (ou que não case) ou subclasse que não seja a do SRD: sem caixinhas padrão.
- Um link **"editar"** na caixa leva para a seção da configuração (que só ganha edição de caixinhas na #180).
- Sem nenhuma caixinha: a caixa some.

### Dados de vida restantes

- **Decidido** (2026-11-14): este passo ganha um controle **"dados de vida restantes"** perto de PV e dados de vida (`CombatStatsSection.tsx`), com o mesmo toque para gastar e devolver das caixinhas (quadradinhos; total = nível do personagem; salva na hora). O "ir" da checklist leva até ele.
- **Minha escolha:** ficha sem `hitDice.current` salvo começa com todos disponíveis (= nível), não com 0. O máximo acompanha o nível; ao subir, o novo dado já vem disponível; ao descer, limita ao novo máximo.

### Descanso

- Botões **Descanso curto** e **Descanso longo** ficam **na barra de ações da aba Status, ao lado da engrenagem** (as `actions` de `SheetPage`), sempre visíveis para quem pode editar, com ou sem caixinhas. Abrem uma **checklist**; marcar não muda a ficha; **"Terminei"** fecha.
- Ideia para depois (não neste passo): a barra de ações da ficha pode crescer para um menu de "três pontinhos" ou um drawer lateral de ações dentro da ficha.
- **Curto**: gastar dados de vida com o dado e o bônus de CON escritos ("role d8 +2 cada, sobram 3"); as caixinhas que voltam no curto (e quanto); lembrete do que não volta (espaços de magia, PV cheio).
- **Longo**: PV cheio, metade dos dados de vida (mínimo 1), espaços de magia, caixinhas do longo.
- A lista lê **as mesmas caixinhas** da ficha (inclusive regras "a partir do nível N").
- **Computador**: lista **presa num canto**, ao lado da ficha, sem bloquear a edição.
- **Celular**: **faixa fina embaixo**, da altura de um botão ("Descanso curto · 1 de 2"); aberta, cada item tem **"ir"** que rola a ficha até o campo e recolhe a faixa.

## Como fica por dentro (minhas escolhas)

### Dados salvos na ficha (`system_data`)

```ts
// shared/systems/dnd5e/types.ts (DnD5eCharacterData)
edition?: Edition;                // '2014' | '2024'; ausente = ficha antiga, ainda sem escolha
resources?: Record<string, ResourceState>;

interface ResourceState {
  used: number;                   // quantos gastos (como spellSlots.used)
  // Reservado para a #180 (não há tela para isso agora, mas o schema já aceita):
  hidden?: boolean;
  overrides?: { max?: number; recovery?: Recovery[]; color?: string; name?: string; description?: string };
  custom?: CustomResource;        // caixinha própria (#180): nome, max, recovery, cor, origem
}
```

- **Chave** de uma caixinha padrão: `class:<classId>:<resourceId>` ou `subclass:<classId>/<subclassId>:<resourceId>` (ids do `classes.json`). Caixinha própria (#180): `custom:<uuid>`.
- **As padrão não são copiadas para a ficha.** O que se salva é só o estado por chave (`used` e, na #180, `overrides`/`hidden`). O máximo, a recuperação e o nome vêm sempre do `classes.json` para o nível atual. Assim **subir de nível atualiza sozinho e não apaga nada**: o que a jogadora mudou mora em `overrides` e vence o padrão.
- Ao exibir, `used` é limitado ao máximo atual (caiu o máximo, não fica negativo).
- Trocar a edição: as chaves são as mesmas nas duas edições quando o id é o mesmo; o estado de chaves que não existem mais fica guardado e ignorado (não apagar).

### Montar as caixinhas (função pura, compartilhada)

`shared/systems/dnd5e/class-resources.ts` (nome livre): `buildResourceBoxes({ classData, subclassData?, level, attributes, state })` → lista com `{ key, name, note?, max, used, unit, recovery, die?, source }`.

- `max`: `steps` → valor do degrau do nível (`null` = ilimitado); `classLevel` → nível × multiplicador; `ability` → modificador + bônus, nunca abaixo do mínimo. Recursos com `level` acima do nível do personagem não aparecem.
- `recoveryAt(level, rest)`: o que volta naquele descanso, respeitando `fromLevel`.
- Testes unitários cobrindo os três tipos de máximo, ilimitado, `fromLevel` (Inspiração no curto a partir do 5), regra 2024 de "1 uso no curto" (Fúria 5.2) e `used` acima do máximo.

### Qual classe e subclasse

- `character.class` é texto livre. Usar `matchCharacterClass` (`src/frontend/lib/character-choices.ts`) para chegar no enum `CharacterClass`, cujos valores já são os ids do conteúdo (`barbarian`, …). Sem casamento → sem caixinhas padrão.
- `character.subclass` (texto livre) casa com o nome da subclasse do SRD daquela classe, em inglês ou no idioma atual, sem diferenciar maiúsculas/acentos. Sem casamento → só as da classe.

### Levar o conteúdo à tela

- O `classes.json` com textos completos é grande (~160 KB de textos por edição). A ficha precisa só dos **recursos** da classe e da subclasse, com nome, nota e **a descrição apenas das características que dão recurso** (poucas por classe).
- Seguir o padrão dos catálogos (`src/backend/contexts/spells/infrastructure/srd-spells.ts`): um catálogo de classes `server-only` carregado e validado uma vez, e uma rota de leitura (ex.: `GET /api/content/classes/:edition/:classId?locale=`) que devolve só isso (com fallback para inglês, como as magias; o `pt` começa vazio).
- No cliente, um hook com TanStack Query (cache longo; conteúdo estático) e o cálculo do máximo no cliente, porque nível e atributos mudam no rascunho da ficha antes de salvar.

### Salvar

- `characterUpdatesSchema` (`src/backend/contexts/characters/interfaces/characters.schemas.ts`): aceitar `edition` (enum) e `resources` (record com chave validada por regex, `used` 0–1000; `hidden`/`overrides`/`custom` já validados com limites para a #180).
- Entidade de domínio `DnD5eCharacter` e `mapToDomain`/save em `supabase-character.repository.ts`: incluir os dois campos (hoje cada campo é mapeado à mão).
- **Gastar/devolver salva na hora** (**minha escolha**), como o PV: usar `saveNow` de `src/frontend/context/CharacterContext.tsx` (existe porque "o que muda durante o jogo não espera o botão de salvar"), com um patch em `src/frontend/lib/character-sheet-updates.ts` (ex. `setResourceUsed(key, used)`). Nada de barra de salvar nem aviso ao sair por um toque. `resources` entra em `MERGED_BY_KEY` (`src/frontend/lib/character-changes.ts`) e o servidor mescla por chave, para um toque não sobrescrever o estado de outra caixinha.
- **Escolher a edição no cartão também salva na hora** (**minha escolha**). Na página de configuração, segue o jeito de salvar que a página já usa.

### Tela

- **Caixa Recursos** (`ResourcesCard`): reaproveitar o visual de `SpellSlots` (botão de 24px com a marca, rótulo de estado no nome acessível: "Ki, 3 de 5 disponíveis"). Cor pelos tokens do tema do personagem em vez de `info`.
  - `unit: 'hit-points'` (Cura pelas Mãos, até 100): **não** quadradinhos; um número com −/+ e o máximo ("35 / 50").
  - Máximo grande (> 20) com `uses`/`points`: mesmo número com −/+.
  - Ilimitado: mostra "ilimitado", sem quadradinhos.
  - Dados de vida restantes usam o mesmo componente de quadradinhos (até 20).
  - `unit: 'spell-slots'` (só `pact-slots`, os espaços de pacto do Bruxo): **fora da caixa Recursos** nesta etapa, porque o espaço de pacto já é controlado em Espaços de magia e contaria duas vezes. A checklist do curto lembra "espaços de pacto voltam".
  - Arcano Místico (`mystic-arcanum-6` a `-9`, `unit: 'uses'`, 1 por descanso longo) **aparece** como caixinha normal, como diz o dado.
  - Dado que escala (Inspiração d6→d12) aparece ao lado do nome.
- **Posição**: uma linha logo abaixo do `CharacterHeader` com Recursos (ou o cartão da edição) e Testes contra a morte lado a lado (em telas pequenas, empilhados). O `DeathSavesCard` só vai para essa linha **quando há algo para mostrar nela**; com edição escolhida e sem caixinhas, a Status fica exatamente como hoje (**minha escolha**, para cumprir o anti-objetivo).
- **Cartão da edição**: no lugar de Recursos quando `edition` está ausente; só para quem pode editar.
- **Só leitura** (mestre, visualizador da #189): caixa Recursos aparece com os quadradinhos desabilitados; sem cartão da edição, sem botões de descanso, sem destaque na engrenagem.
- **Configuração da ficha**: a página `AppearanceTab` ganha a seção "Recursos de classe" com a edição (radio 2014/2024). O título da página/engrenagem passa de "Aparência" para algo como "Configurar ficha" (a rota pode continuar `/appearance`).
- **Destaque da engrenagem**: chave de `localStorage` própria, leitura/escrita em try/catch (navegação privada); se falhar, não mostrar. Comentário `// TEMPORARY (#177): remove after …`.
- **Checklist do descanso**: região não modal (`role="region"`/`complementary` com título), sem prender o foco; Esc e "Terminei" fecham; foco volta para o botão que abriu.
  - Computador: fixa no canto inferior direito, largura ~320px.
  - Celular: faixa fixa embaixo, **acima da `SheetTabBar`** (barra de abas do rodapé) e sem cobrir a `VitalsBar` (topo); fechada tem a altura de um botão; "ir" rola até o campo (`scrollIntoView` + foco no campo) e recolhe.
  - Os itens marcados vivem só na memória da tela (fechar zera). **Minha escolha**: não salvar.
  - "Ir" leva a: PV, dados de vida, espaços de magia, caixa Recursos (âncoras/ids nesses blocos).

### Testes esperados

- Unitários: `buildResourceBoxes`/recuperação; schema de atualização (aceita `edition`/`resources`, rejeita chave inválida e `used` negativo); `ResourcesCard` (gasta/devolve, ilimitado, PV de Cura pelas Mãos, sem caixinhas some, só leitura); cartão da edição; checklist (itens certos para Monge 5 no curto e no longo, "Terminei", Esc); destaque da engrenagem com e sem `localStorage`.
- Integração: salvar e reler `edition` e `resources` pelo repositório.
- e2e: ficha antiga → escolhe 2014 no cartão → aparecem as caixinhas → gasta um Ki → recarrega e continua gasto → abre Descanso curto, vê "Ki volta", "Terminei". Uma versão a 375px para a faixa de baixo.
- Visuais: a Status muda (linha nova); regravar com `npm run test:visual -- --update-snapshots=all`.

## Deixado para quem for construir

- Nomes de arquivos, componentes e chaves de tradução.
- Forma exata do destaque da engrenagem (pontinho vs. brilho), dentro dos tokens.
- Formato exato da rota de conteúdo, desde que só devolva o necessário e use o padrão dos catálogos.
- Ordem dos itens da checklist e frases, dentro do que está decidido acima.
