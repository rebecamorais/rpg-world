# Tema claro e contraste WCAG AA

Primeira parte da issue #151. O texto vem da conversa de 10/11.

Legenda: **(dona)** foi decidido por ela. **(decisão do builder)** é escolha técnica ou de detalhe que não muda o que ela pediu.

## Por quê

O app só tem o tema escuro. Algumas pessoas leem melhor em fundo claro, ou usam o app de dia, sob luz forte. Além disso, a meta do projeto é WCAG 2.1 AA (`ACCESSIBILITY.md`), mas o contraste ainda tem uma exceção conhecida: na ordem de combate, a regra `color-contrast` do axe está desligada porque as linhas dos outros turnos ficam apagadas de propósito.

Sucesso é qualquer pessoa trocar para o fundo claro com um clique e tudo continuar legível, inclusive a ficha com a cor livre e a arte que o jogador escolheu. E uma mudança de cor que quebre o contraste falhar no CI, em vez de chegar ao usuário.

## Objetivos

1. **(dona)** Tema claro para o app inteiro, inclusive a ficha. O escuro continua sendo o padrão.
2. **(dona)** Um botão sempre visível no topo para trocar entre escuro e claro.
3. **(dona)** Contraste WCAG AA nos dois temas, em todas as telas.
4. **(dona)** As linhas dos outros turnos no combate ficam menos apagadas, o suficiente para passar no contraste, e `color-contrast` volta a valer em `e2e/conditions.spec.ts`.
5. **(dona)** Três camadas de verificação automática (seção 5).

## Fora do escopo

- **Foco, teclado e leitor de tela:** fase seguinte da #151 **(dona)**. Inclui ligar as regras completas do `eslint-plugin-jsx-a11y`.
- **Temas de ficha** (pergaminho, tech, neon…), escolhidos pelo dono do personagem e vistos por todos: projeto próprio, depois deste **(dona)**. Este projeto só deixa a estrutura pronta para eles (seção 1).
- **Mais temas do app além de claro e escuro:** depois **(dona)**.
- **Seguir o tema do sistema operacional:** não entra. Quem tem o sistema em modo claro abre o app no escuro até escolher **(dona: o escuro é o padrão)**.
- **Salvar a escolha na conta:** não entra. Fica no navegador (seção 2) **(decisão do builder)**.
- **Modo de alto contraste:** não entra.
- **Mudar a arte de fundo da ficha conforme o tema:** não entra. A arte enviada continua igual nos dois temas **(dona)**.

## O que seria um fracasso mesmo funcionando

- A página abrir escura e piscar para clara (ou o contrário) ao carregar.
- Uma cor de personagem escolhida no seletor deixar texto ou ícone ilegível em um dos temas.
- O tema claro parecer outro app: tem que ser o mesmo app com a luz acesa **(dona)**.
- Algum trecho continuar escuro no tema claro por usar cor fixa em vez de token.
- O tema escuro mudar de cara. Fora o combate e as correções de contraste da seção 3 (texto sobre a cor cheia), ele deve ficar como está.

## Estado atual (para quem vai construir)

- Todas as cores são tokens em `app/globals.css`, no `:root`, com o comentário "dark only". Os componentes usam os tokens, nunca a paleta crua do Tailwind (não há `zinc-800`, `text-white` etc. nos componentes).
- Cores derivadas, no mesmo arquivo, declaradas em `:root, .character-context, .spell-context`:
  - `-flare` (texto e ícone na cor) **clareia** a cor até passar AA sobre fundo escuro: `oklch(from X max(l, 0.74) min(c, 0.2) h)`, com um `color-mix(..., white 45%)` de reserva.
  - `-on` (texto sobre a cor cheia) escolhe branco ou preto: `clamp(0, (0.68 - l) * 1000, 1)`, branco até L 0,68 em OKLCH. **Esse limite já reprova AA hoje, no escuro:** branco só passa 4.5:1 abaixo de L ≈ 0,57. As cores prontas vermelho `#ef4444` (3,76:1), azul `#3b82f6` (3,68:1), rosa `#ec4899` (3,53:1) e roxo `#a855f7` (3,96:1) falham (`src/frontend/constants/accent-colors.ts`). Sem `@supports`, a reserva é sempre `#ffffff`.
  - `-surface`, `-muted`, `-glow` são a cor com transparência.
  - As cores de status (`danger`, `success`, `info`, `warning`) têm `-flare` com `color-mix(in srgb, X, white 20%)`, sem versão OKLCH.
  - Não existe `--spell-on`: a cor da magia não aparece como fundo cheio com texto por cima.
- A cor do personagem chega por `characterTheme()` (`src/frontend/lib/color-utils.ts`), que põe `--character-color` e a classe `.character-context`. A cor das magias, por `--spell-color` com `.spell-context`.
- A arte da ficha é `SheetBackdrop`: um `<img>` com um véu `bg-background/85`. No claro, o véu clareia sozinho.
- Os toasts (`src/frontend/components/ui/sonner.tsx`) fixam `theme="dark"`, com um comentário "Dark only".
- Os templates de e-mail (`src/backend/shared/infrastructure/email/templates/*.tsx`) usam hex escuros fixos. E-mail não lê tokens CSS.
- Nada define `color-scheme` hoje.
- O layout raiz é `app/[locale]/layout.tsx`. As páginas públicas são **pré-renderizadas**: o servidor não lê cookie nelas. Já existe um script inline no `<head>` que lê `document.cookie` antes da hidratação (o `data-session`). O `<html>` já tem `suppressHydrationWarning`.
- O topo é `src/frontend/components/layout/GlobalHeader.tsx`, com `HeaderSessionActions` e `HeaderSessionMobileMenu`.
- As linhas apagadas do combate: `CombatRow.tsx` linha 96, `opacity-75 grayscale-[.7]` (volta ao normal com hover e foco). Caído usa `opacity-60 grayscale` no avatar (imagem, não texto).
- Axe: `e2e/a11y.spec.ts` (6 páginas públicas e outras telas) e trechos em `profile`, `parties`, `conditions` e `delete-account`. A exceção é `conditions.spec.ts:134`.
- Testes visuais: `e2e/visual/screens.visual.spec.ts`, com screenshots guardados.
- Textos de interface ficam em `messages/` (en e pt nos PRs; o resto vem do Crowdin).

## 1. Estrutura do tema

- **(decisão do builder)** O tema é um atributo no `<html>`: `data-theme="dark"` ou `data-theme="light"`. Não é uma classe `.dark`. Assim, outros temas do app ou de ficha viram mais um conjunto de tokens depois.
- Os tokens de hoje continuam no `:root` (o escuro, padrão). O claro vem em `:root[data-theme="light"]` e redefine só o que muda.
- Ajustar o comentário "dark only" do topo do `globals.css` e a seção "Limitações conhecidas" do `ACCESSIBILITY.md`.
- Pôr `color-scheme: dark` / `light` conforme o tema, para barra de rolagem, campos nativos e o seletor de cor seguirem o tema. Isso muda um pouco esses controles nativos também no escuro, e os screenshots afetados são regenerados **(decisão do builder: é correção, não mudança de cara)**.
- Os toasts seguem o tema: `sonner.tsx` lê o tema atual em vez de fixar `dark`.

## 2. Escolha e persistência

- **(dona)** Botão sempre visível no topo, no desktop e no celular, ao lado das ações da sessão. Funciona com e sem login.
- O botão alterna entre os dois temas. Ícone de sol e lua, com nome acessível que diga o que ele faz ("Usar tema claro" / "Usar tema escuro"), em en e pt. Se um dia houver mais temas, vira menu **(decisão do builder)**.
- **(decisão do builder)** A escolha fica num cookie (`theme`, um ano, `SameSite=Lax`, válido no site todo). Não precisa de servidor nem de banco.
- **Sem piscar:** como as páginas são pré-renderizadas, o tema entra por um script inline no `<head>`, junto do de `data-session`, que lê o cookie e põe `data-theme` antes da primeira pintura. Sem cookie, fica o escuro.
- Trocar o tema muda na hora, sem recarregar.

## 3. Paleta clara

- **(dona)** Zinco claro neutro: fundo quase branco, painéis um pouco mais escuros que o fundo, bordas cinza suaves. É o mesmo app com a luz acesa, não um pergaminho.
- O roxo da marca (`--brand: #663399`) continua o mesmo. Ele já passa AA sobre branco.
- **Valores (decisão do builder),** desde que passem nos testes da seção 5. Ponto de partida: fundo `#fafafa`, painel `#f4f4f5`, popover `#ffffff`, texto `#09090b`, texto secundário `#52525b`, placeholder `#71717a`, bordas `#e4e4e7`. `--accent` é um lilás claro com texto escuro. O véu (`--overlay`) fica mais leve.
- **Derivadas no claro:** `-flare` passa a **escurecer** a cor até passar AA sobre fundo claro (`min(l, ~0.5)`, com o limite exato calibrado pelo teste), e a reserva usa `black` em vez de `white`. Vale para primary, character, spell e as quatro cores de status. As cores de status cheias também podem escurecer, se o teste pedir.
- `-surface`, `-muted` e `-glow` continuam como transparência, talvez com mais opacidade para aparecerem no claro **(decisão do builder)**.
- O brilho das moedas e o `turn-glow` ficam mais discretos no claro **(decisão do builder)**.
- As cores de marcas de terceiros (Ko-fi, Discord, Google) não mudam.
- **Cor fixa:** qualquer cor fora de token que apareça na varredura vira token. O que já é imagem ou marca de terceiro fica. Os templates de e-mail ficam fora: continuam com as cores atuais **(decisão do builder)**.
- **`-on` corrigido nos dois temas (decisão do builder, porque o objetivo é AA):** o limite entre branco e preto passa a garantir 4.5:1 para qualquer cor, decidido pela luminância relativa do WCAG (branco quando ele contrasta mais que preto) ou por um limite em OKLCH calibrado pelo teste 3. Consequência visível **no escuro também**: botões, selos e o link "pular para o conteúdo" em vermelho, azul, rosa e roxo claro passam a ter texto preto. O PR mostra isso no antes e depois.
- As cores de status ganham `-flare` em OKLCH no claro, como as outras, em vez de só trocar `white` por `black` no `color-mix`.
- **Reserva sem `oklch(from …)`:** é o melhor esforço. Navegadores atuais (Chrome 119+, Safari 18+, Firefox 128+) usam a fórmula exata, e é ela que os testes garantem. A reserva fica mais conservadora que hoje (mais branco no escuro, mais preto no claro) e entra em "Limitações conhecidas" do `ACCESSIBILITY.md` **(decisão do builder)**.
- **Arte de fundo da ficha:** o contraste vale também sobre o pior caso de arte. O fundo efetivo é o véu de 85% sobre preto ou sobre branco. O véu continua em 85% nos dois temas, e o `-flare` do claro escurece o suficiente para passar sobre esse pior caso **(decisão do builder: preserva a arte do jogador)**.

## 4. Ordem de combate

- **(dona)** As linhas dos outros turnos ficam menos apagadas. Continua dando para ver a linha atual de relance (destaque, `aria-current`, a faixa na cor), mas o texto das outras linhas passa AA.
- **(decisão do builder)** Em vez de `opacity` no conteúdo todo, que derruba o contraste do texto, as outras linhas apagam só o que não é texto (avatar, faixa de cor) e usam a cor de texto secundário, que já passa. A linha atual mantém o texto principal e o brilho.
- Tirar `['color-contrast']` de `conditions.spec.ts:134` e o comentário que justifica a exceção.

## 5. Verificação

1. **Axe nos dois temas:** os testes de axe que já existem (`a11y`, `profile`, `parties`, `conditions`, `delete-account`) rodam uma vez com o tema escuro e outra com o claro. O tema entra pelo cookie antes de abrir a página. Nenhuma tela nova de teste é obrigatória **(decisão do builder: o ganho vem de dobrar o que já existe)**.
2. **Teste unitário dos tokens (Vitest):** lê os valores do `globals.css` nos dois temas e confere os pares que importam. Texto e texto secundário sobre fundo, painel, popover e muted precisam de 4.5:1, e sobre o pior caso do véu da ficha (85% do fundo sobre preto e sobre branco). Borda de campo sobre fundo e painel precisa de 3:1 (contraste de componente). `-on` sobre a cor cheia precisa de 4.5:1. Quando falhar, o teste diz qual par quebrou e o valor encontrado. As cores derivadas por fórmula CSS são cobertas pelo teste 3.
3. **Teste das cores livres do personagem:** uma função em TypeScript reproduz as fórmulas de `-flare` e `-on` (escuro e claro). O teste percorre o círculo de cores (tons de 0 a 360, várias luminosidades e saturações, inclusive preto, branco e cinzas) e confere que `-flare` dá 4.5:1 sobre fundo, painel e o pior caso do véu da ficha, e que `-on` dá 4.5:1 sobre a cor, nos dois temas. O `-flare` vale também para spell e para as cores de status. O `-on` vale para primary e character (spell não tem `-on`). A função de TypeScript e o CSS precisam usar os mesmos números: um comentário em cada lado aponta para o outro **(decisão do builder: navegador nenhum calcula `oklch(from ...)` no Vitest)**.
- **Testes visuais:** os screenshots do escuro devem continuar iguais, exceto o combate. Acrescentar pelo menos o screenshot de uma página pública, da ficha e do combate no claro **(decisão do builder)**.
- Teste do botão: troca o tema, o cookie fica gravado, e ao recarregar a página já abre no tema escolhido.

## Entrega

- Um PR com commits por tema (estrutura, paleta, botão, combate, testes), com antes e depois dos dois temas em screenshots. Textos novos em en e pt.
- Atualizar `ACCESSIBILITY.md`: o tema claro existe e o contraste é verificado nos dois temas.
