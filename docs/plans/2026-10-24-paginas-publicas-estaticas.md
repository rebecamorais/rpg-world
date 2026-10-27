# Páginas públicas estáticas, com o idioma escolhido pelo proxy

**Data:** 2026-10-24
**Status:** design para revisão. O plano de implementação vem depois, neste mesmo arquivo.

## Por quê

Quem chega nas páginas públicas são, na maior parte, amigos brasileiros e americanos da Rebeca,
vindos de um link compartilhado (WhatsApp, Discord). O volume é baixo, e isso tem dois efeitos:

- **Cold start frequente.** Com pouco tráfego, a função costuma estar fria quando alguém abre o
  link. Hoje toda página é renderizada por pedido (`.next/prerender-manifest.json` só lista ícones,
  robots e sitemap), então a primeira impressão paga esse tempo.
- **Idioma errado na primeira visita.** Sem cookie, `src/i18n.ts` cai em `locales[0]` (`en`). Ele
  não olha o idioma do navegador, então um brasileiro vê o site em inglês até achar o seletor.

As páginas são dinâmicas por dois motivos: o idioma vem do cookie `NEXT_LOCALE` (lido em
`getRequestConfig`), e o header, o rodapé e algumas páginas consultam a sessão (`getSessionUser`).

## O que a Rebeca decidiu

Melhor experiência para quem visita:

- a URL **não** mostra `/pt`;
- na primeira visita, o idioma vem do navegador (`Accept-Language`): o brasileiro já cai em
  português;
- quem trocar no seletor fica com a escolha salva no cookie, como hoje;
- a página chega pronta no idioma certo, **sem troca visível de idioma** depois de carregar.

O caminho escolhido: o proxy decide o idioma antes da página sair e reescreve o pedido
internamente para a versão estática daquele idioma. Trocar o idioma no navegador depois de
carregar foi descartado, porque o texto piscaria em inglês em toda visita.

## Objetivos

1. As páginas públicas saem prontas do CDN, uma versão por idioma (en, pt), sem renderização por
   pedido. **O proxy continua sendo uma função** (no Next 16 ele roda sempre em Node.js) e roda em
   todo pedido, como já roda hoje. Então o cold start do proxy não some; some o da renderização da
   página. O ganho real é medido antes e depois (ver "Medição"). O idioma certo na primeira visita
   vale por si, mesmo que o ganho de tempo seja menor que o esperado.
2. O idioma da primeira visita segue o `Accept-Language`; depois disso vale o cookie `NEXT_LOCALE`.
3. Nada muda nas URLs públicas nem nas logadas (`/`, `/features`, `/characters`,
   `/system/DnD_5e/character/<id>`, `/api/...`).
4. As páginas logadas (dashboard, ficha) continuam como estão: dinâmicas, com os dados vindo do
   servidor (PRs #110 e #115).

## Não-objetivos

- Idioma na URL (`/pt/...`), `hreflang` e sitemap por idioma.
- Guardar o idioma no perfil do usuário.
- Ligar o `cacheComponents` / PPR. O caminho aqui é o estático clássico com `[locale]` e
  `generateStaticParams`. Se o estático clássico se mostrar inviável em alguma página, essa página
  fica dinâmica; não migramos o app para Cache Components neste projeto.
- Mudar o conteúdo ou o visual das páginas.

## Anti-objetivos (falhou, mesmo que funcione)

- Uma pessoa logada vendo "Entrar/Cadastrar" no header e depois o menu dela (estado errado
  piscando). Enquanto não se sabe, o espaço da sessão fica neutro (ver "Header e rodapé").
- Texto em um idioma trocando para o outro depois de carregar.
- Uma URL existente passando a dar 404 ou redirecionando para outra.
- Quebrar o fluxo de login: quem já está logado e abre `/login` continua indo para `/characters`.

## Restrições

- Next.js 16 (`proxy.ts`, não `middleware.ts`), next-intl 4.14, deploy na Vercel (gru1).
- O `proxy.ts` hoje só renova a sessão do Supabase (`getClaims`). A detecção de idioma precisa
  conviver com isso no mesmo proxy, e os cookies de sessão renovados têm que continuar chegando
  ao navegador.
- O cookie `NEXT_LOCALE` continua sendo a fonte da escolha do usuário: o `LanguageSwitcher` grava
  esse cookie e chama `router.refresh()`.
- Rotas que nunca levam idioma: `/api/*`, `/_next/*`, `/_vercel/*`, arquivos estáticos, `robots.txt`,
  `sitemap.xml`, `llms.txt`, ícones. O rewrite do host `images.rpgworldapp.com` → `/api/images`
  (`next.config.ts`) tem que continuar funcionando.
- Testes: unitários, integração, e2e e visual existentes precisam passar. O e2e de idioma
  (`e2e/language.spec.ts`) cobre a troca pelo seletor.

## Como, nas partes decididas

### Roteamento de idioma

- Usar o roteamento do next-intl com `localePrefix: 'never'`, `locales: ['en', 'pt']`,
  `defaultLocale: 'en'` e detecção ligada. O cookie continua sendo `NEXT_LOCALE`.
- O proxy compõe as duas coisas: primeiro o middleware do next-intl (que decide o idioma e reescreve
  para `/[locale]/...`), depois a renovação da sessão do Supabase sobre a resposta dele, preservando
  os cookies dos dois.
- As rotas do app passam a ficar sob `app/[locale]/`. O layout raiz recebe o `locale` pelos params
  e chama `setRequestLocale`; `getRequestConfig` passa a usar o locale da requisição (o do
  segmento), não o cookie.

### Quais páginas ficam estáticas (decisão do Claude)

`/`, `/features`, `/terms`, `/privacy`, `/login`, `/register`, `/forgot-password`, `/support`.
Cada uma com `generateStaticParams` para `en` e `pt` e sem leitura de cookie, header ou sessão no
servidor.

Ficam dinâmicas: `/reset-password`, `/change-password`, `/auth/*`, todo o `(dashboard)`, e as
rotas de API.

### Header e rodapé (decisão do Claude)

- **O header e o rodapé saem do layout raiz e passam para os layouts de grupo.** O header fica
  acima do layout do dashboard, então um seed feito ali chegaria tarde demais para ele.
  - `(public)`: header e rodapé sem chamar `getSessionUser` no servidor. A parte que muda com a
    sessão (Entrar/Cadastrar ou menu do usuário, `MobileMenu`, e-mail no link de suporte,
    `signedIn` do seletor de idioma, links do rodapé) vira um componente de cliente.
  - `(dashboard)` e as outras rotas dinâmicas: o header continua sabendo o usuário pelo servidor,
    como hoje. Nenhuma piora nas páginas logadas.
- **Sessão no cliente, nas páginas públicas:**
  - Sem cookie `sb-*` no navegador, a pessoa está deslogada, porque a sessão mora nesse cookie.
    Entrar/Cadastrar aparecem na hora, sem pedido nenhum. É o caso da maioria dos visitantes.
  - Com cookie `sb-*`, o componente pergunta a `GET /api/auth/session` (React Query) e mostra um
    placeholder neutro, do mesmo tamanho, até a resposta chegar. Nunca mostra o estado de deslogado
    enquanto não sabe.
  - Os cookies do `@supabase/ssr` podem ser lidos pelo JS (não há `httpOnly` configurado). Se isso
    mudar, a regra passa a ser sempre perguntar.

### Páginas que hoje leem a sessão (decisão do Claude)

- **Home** (`HeroCTA isAuthenticated`): o CTA vira um link fixo para `/characters`. O layout do
  dashboard já manda quem não está logado para `/login`.
- **Features**: o trecho que muda com `user` lê a sessão no cliente, como o header.
- **Support**: `ContactCard initialEmail` passa a preencher o e-mail no cliente, a partir da sessão.
- **Login**: o redirect de quem já está logado deixa de ser feito na página e passa para o proxy.
  O proxy já confere a sessão; se houver sessão válida e o caminho for `/login`, ele redireciona
  para `/characters`. `/register` também passa a redirecionar quem está logado. Hoje não
  redireciona, mas é o mesmo caso.

### Troca de idioma

`router.refresh()` não basta: no Next 16 ele só limpa o cache do cliente da rota atual, e páginas
estáticas já pré-carregadas no idioma antigo continuariam no cache do roteador. O `LanguageSwitcher`
grava o cookie e faz uma navegação completa (reload). O e2e de idioma cobre clicar num link depois
da troca.

O middleware do next-intl também grava o `NEXT_LOCALE`: alinhar o `maxAge` dele com o de um ano que
o seletor usa. Com `localePrefix: 'never'`, `/pt/...` e `/en/...` redirecionam para a URL sem prefixo.

### Fuso horário

O `getRequestConfig` lê o cookie `NEXT_TIMEZONE`, e isso impede a geração estática. Nenhum
componente formata datas com o next-intl hoje (sem `useFormatter`, `getFormatter` nem `dateTime`),
então o fuso passa a ser fixo, `UTC`. O `Providers` para de gravar esse cookie. Se um dia uma data
precisar do fuso do usuário, ela é formatada no navegador.

### Metadata

`generateMetadata` das páginas estáticas usa o `locale` dos params (`getTranslations({ locale })`),
de modo que título, descrição e `og:locale` saiam no idioma da versão estática. A prévia do link no
WhatsApp/Discord recebe a versão do idioma que o `Accept-Language` do robô pedir.

## Medição

Antes de mexer: medir a primeira resposta (TTFB) de `/` e `/features` em produção, com a função fria
e quente, com e sem cookie de sessão. Depois do merge, medir de novo. O PR informa os dois números.
Se o proxy frio dominar o tempo, um próximo passo possível é deixar o proxy mais leve para quem não
tem cookie (hoje ele importa o `@supabase/ssr` em todo pedido). Isso fica fora deste projeto.

## Fica a cargo de quem implementa

- A ordem e o formato exato da composição do middleware do next-intl com o código de sessão no
  `proxy.ts`, e o matcher final.
- Como reorganizar `app/` sob `[locale]` (mover tudo de uma vez ou por grupos), mantendo os route
  groups atuais e as URLs.
- Onde fica a config de roteamento (`src/i18n/routing.ts` ou equivalente) e como o
  `LanguageSwitcher` interage com ela. Gravar o cookie e dar `refresh` pode bastar.
- Como verificar que as páginas ficaram estáticas (por exemplo, `prerender-manifest.json` listando
  as 8 páginas × 2 idiomas) e um e2e de primeira visita com `Accept-Language: pt-BR` caindo em
  português sem cookie.
- O formato do placeholder do header.

---

# Plano de implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: superpowers:subagent-driven-development (recomendado) ou
> superpowers:executing-plans, tarefa por tarefa. Os passos usam checkbox (`- [ ]`).

**Objetivo:** servir as 8 páginas públicas prontas do CDN, em en e pt, com o idioma escolhido pelo
proxy (cookie `NEXT_LOCALE`, senão `Accept-Language`), sem `/pt` na URL.

**Arquitetura:** roteamento do next-intl com `localePrefix: 'never'`. O proxy reescreve todo pedido
de página para `/[locale]/...`, e as rotas passam a viver em `app/[locale]/`, divididas em
`(public)` (estáticas, sessão só no navegador) e `(app)` (dinâmicas, header com a sessão do
servidor, como hoje). `app/api/*` não muda de lugar.

**Stack:** Next.js 16.4 (`proxy.ts`), next-intl 4.14, @supabase/ssr, TanStack Query, Playwright.

**Spec:** a primeira parte deste arquivo.

## Restrições globais

- URLs não mudam. `/pt/...` e `/en/...` redirecionam para a URL sem prefixo.
- `locales: ['en', 'pt']`, `defaultLocale: 'en'`, cookie `NEXT_LOCALE` com `maxAge` de 31536000 (1 ano).
- Fuso fixo: `timeZone: 'UTC'`.
- Páginas estáticas: `/`, `/features`, `/terms`, `/privacy`, `/login`, `/register`, `/forgot-password`,
  `/support`. Nenhuma delas lê cookie, header ou sessão no servidor.
- Nunca mostrar Entrar/Cadastrar a quem tem cookie `sb-*` antes de a sessão ser conhecida.
- `/api/*`, `/_next/*`, `/_vercel/*`, arquivos com extensão e o host `images.rpgworldapp.com` não
  passam pelo roteamento de idioma.
- Copy nova vai em `messages/en.json` e `messages/pt.json` (a guarda `hardcoded-text.unit.test.ts`
  barra texto solto).

## Review Focus

1. `Accept-Language: pt-BR,pt;q=0.9,en;q=0.8` sem cookie → português. `fr-FR` → inglês. (Tarefa 1)
2. Cookie `NEXT_LOCALE=de` (valor inválido) → ignora o cookie e usa a detecção, sem erro. (Tarefa 1)
3. Cookie `sb-*` vencido ou inválido → `/api/auth/session` dá 401 → o header sai do placeholder para
   Entrar/Cadastrar, e não fica preso. (Tarefa 2)
4. Abrir `/pt/features` direto → redireciona para `/features`, não dá 404. (Tarefa 1)
5. Trocar para pt e clicar num link pré-carregado (`/features`) → a página abre em pt. (Tarefa 4)

---

### Tarefa 0: medição de antes

**Arquivos:** este documento (seção "Resultados da medição", criada no fim dele).

- [ ] **Passo 1:** medir o TTFB de produção, 5 vezes cada, sem cookie:
      `curl -s -o /dev/null -w '%{time_starttransfer}\n' https://rpgworldapp.com/` e o mesmo para
      `/features`. A primeira chamada depois de pelo menos 15 min sem tráfego conta como "fria".
- [ ] **Passo 2:** anotar mediana fria e quente das duas URLs no documento. Commit:
      `docs(plano): medição de TTFB antes das páginas estáticas`.

### Tarefa 1: roteamento de idioma no proxy e rotas sob `app/[locale]`

Ao fim desta tarefa o app funciona igual a hoje (páginas ainda dinâmicas), mas o idioma já vem do
proxy.

**Arquivos:**

- Criar: `src/i18n/routing.ts`, `app/[locale]/layout.tsx`, `app/[locale]/(public)/layout.tsx`,
  `app/[locale]/(app)/layout.tsx`
- Mover (`git mv`): `app/page.tsx`, `features`, `terms`, `privacy`, `login`, `register`,
  `forgot-password`, `support` → `app/[locale]/(public)/`; `(dashboard)`, `auth`, `change-password`,
  `reset-password` → `app/[locale]/(app)/`. Testes colocados ao lado vão junto.
- Remover: `app/layout.tsx` (o conteúdo vai para `app/[locale]/layout.tsx`)
- Modificar: `src/i18n.ts` → `src/i18n/request.ts` (e o caminho em `next.config.ts`,
  `createNextIntlPlugin`), `proxy.ts`, `proxy.unit.test.ts`, `src/frontend/components/providers/Providers.tsx`
- Ficam na raiz: `app/api`, `app/globals.css`, `app/robots.ts`, `app/sitemap.ts`, `app/favicon.ico`,
  `app/apple-icon.png`.

**Interfaces:**

- Produz: `routing` (de `defineRouting`), exportado de `src/i18n/routing.ts`; `Locale = 'en' | 'pt'`.
- Produz: `app/[locale]/layout.tsx` com `generateStaticParams() → [{ locale: 'en' }, { locale: 'pt' }]`,
  `setRequestLocale(locale)`, `notFound()` para locale fora da lista. Header e rodapé **não** ficam
  aqui: `(public)/layout.tsx` e `(app)/layout.tsx` renderizam `GlobalHeader` e `Footer` (nesta
  tarefa, os dois usam os componentes de hoje).
- Produz: `request.ts` com `getRequestConfig(async ({ requestLocale }) => ...)`, usando o locale
  da requisição (validado contra `routing.locales`, senão `defaultLocale`) e `timeZone: 'UTC'`.
- `Providers` para de gravar o cookie `NEXT_TIMEZONE`.

- [ ] **Passo 1: testes do proxy** (em `proxy.unit.test.ts`, com o mock de `@supabase/ssr` que já existe):
  - `reescreve / para /pt com Accept-Language pt-BR e sem cookie`: espera o header
    `x-middleware-rewrite` terminando em `/pt`.
  - `fr-FR cai em /en`; `NEXT_LOCALE=en vence Accept-Language pt-BR`; `NEXT_LOCALE=de é ignorado`.
  - `redireciona /pt/features para /features` (status 307/308, `location` termina em `/features`).
  - `não toca em /api/characters` (sem rewrite).
  - `com sessão válida, /login redireciona para /characters` e o mesmo para `/register`
    (`getClaims` mockado retornando claims).
  - Os 3 testes atuais de sessão continuam (cookies renovados chegam na resposta).
- [ ] **Passo 2:** rodar `npx vitest run --config ./test/vitest.config.unit.ts proxy.unit.test.ts`.
      Esperado: os testes novos falham.
- [ ] **Passo 3:** implementar. No `proxy.ts`: `const handleI18n = createMiddleware(routing)`. Para
      pedidos que não são `/api` nem arquivo, a resposta base passa a ser a de `handleI18n(request)`, e
      o Supabase grava os cookies renovados nela. Depois do `getClaims`, se houver claims e o caminho for
      `/login` ou `/register`, responder com redirect para `/characters` (levando os cookies). O matcher
      continua excluindo `api`, `_next`, `_vercel` e extensões. Remover o redirect de quem está logado
      de `app/[locale]/(public)/login/page.tsx`.
- [ ] **Passo 4:** mover as rotas e criar os layouts. Cada `generateMetadata` e cada página passam a
      ler `locale` dos params onde hoje chamam `getLocale()`.
- [ ] **Passo 5:** rodar `npx tsc --noEmit -p .`, a suíte unitária e `npx playwright test`.
      Esperado: tudo passa; `e2e/language.spec.ts` continua passando.
- [ ] **Passo 6:** commit `refactor(i18n): idioma escolhido no proxy, rotas sob app/[locale]`.

### Tarefa 2: sessão no navegador para o header e o rodapé públicos

**Arquivos:**

- Criar: `src/frontend/hooks/useSession.ts`, `src/frontend/components/layout/HeaderSessionActions.tsx`
- Modificar: `src/frontend/lib/query-keys.ts`, `src/frontend/components/layout/GlobalHeader.tsx`,
  `src/frontend/components/layout/Footer.tsx`, `app/[locale]/(public)/layout.tsx`
- Testes: `src/frontend/hooks/useSession.unit.test.tsx`,
  `src/frontend/components/layout/HeaderSessionActions.unit.test.tsx`

**Interfaces:**

- Produz: `SESSION_QUERY_KEY = ['session'] as const` em `query-keys.ts`.
- Produz: `useSession(): { user: User | null; status: 'loading' | 'signed-in' | 'signed-out' }`.
  Sem cookie `sb-` em `document.cookie` → `signed-out` na hora, sem pedido. Com cookie → busca
  `GET /api/auth/session` (401 vira `signed-out`).
- Produz: `HeaderSessionActions` ('use client'), que renderiza, conforme `status`: placeholder do
  mesmo tamanho (`loading`), Entrar/Cadastrar (`signed-out`) ou Voltar + `UserMenu` (`signed-in`). Também
  `MobileMenu`, `HeaderSupportLink email` e `LanguageSwitcher signedIn`, pelo mesmo hook.
- `GlobalHeader` ganha a prop `session: 'server' | 'client'`. Com `'server'` funciona como hoje; com
  `'client'` não chama `getSessionUser` e usa `HeaderSessionActions`. O mesmo vale para `Footer`
  (`FooterContent isAuthenticated` vem de `useSession` no modo cliente). `(public)/layout` usa
  `'client'`; `(app)/layout` usa `'server'`.

- [ ] **Passo 1: testes**
  - `useSession`: `sem cookie sb- não chama a API e responde signed-out`; `com cookie sb- e 200
responde signed-in com o user`; `com cookie sb- e 401 responde signed-out`.
  - `HeaderSessionActions`: `com status loading não mostra Entrar` (nem `Sign In` nem `Register`);
    `signed-out mostra Entrar e Cadastrar`; `signed-in mostra o menu do usuário`.
- [ ] **Passo 2:** rodar os dois arquivos. Esperado: falham.
- [ ] **Passo 3:** implementar as interfaces acima.
- [ ] **Passo 4:** rodar unitários e `npx playwright test e2e/auth.spec.ts e2e/navigation.mobile.spec.ts`.
      Esperado: passam.
- [ ] **Passo 5:** commit `feat(layout): sessão do header público lida no navegador`.

### Tarefa 3: as 8 páginas públicas viram estáticas

**Arquivos:**

- Modificar: `app/[locale]/(public)/page.tsx`, `features/page.tsx`, `support/page.tsx` e as
  `generateMetadata` das 8 páginas; `src/frontend/components/layout/HeroCTA.tsx`;
  `src/frontend/components/feedback/ContactCard.tsx`
- Teste: `e2e/static-pages.spec.ts` (novo)

**Interfaces:**

- Consome: `useSession` (Tarefa 2), `setRequestLocale` e `getTranslations({ locale, namespace })`.
- `HeroCTA` perde a prop `isAuthenticated` e linka sempre para `/characters`.
- `ContactCard` deixa de receber `initialEmail` do servidor e preenche o e-mail com
  `useSession().user?.email` quando estiver vazio.
- O trecho de `features/page.tsx` que depende de `user` vira um componente de cliente com `useSession`.

- [ ] **Passo 1: e2e** em `e2e/static-pages.spec.ts`:
  - `primeira visita com Accept-Language pt-BR abre a home em português` (contexto com
    `extraHTTPHeaders: { 'Accept-Language': 'pt-BR,pt;q=0.9' }`, sem cookie).
  - `cookie NEXT_LOCALE=en vence o navegador em português`.
  - `/pt/features redireciona para /features`.
- [ ] **Passo 2:** no mesmo arquivo, `as 8 páginas públicas são pré-renderizadas nos 2 idiomas`: lê
      `.next-e2e/prerender-manifest.json` (o build do e2e) e espera, em `routes`, as 16 chaves `/en`,
      `/pt`, `/en/features`, `/pt/features`, ... até `/pt/support`.
- [ ] **Passo 3:** rodar. Esperado: falha (páginas ainda dinâmicas).
- [ ] **Passo 4:** implementar. Tirar `getSessionUser` de home, features e support; `setRequestLocale`
      em cada página e layout de `(public)`; metadata com o locale dos params.
- [ ] **Passo 5:** rodar `npx playwright test` e `npm run test:visual`. Esperado: passam. Se o
      visual mudar só pelo placeholder do header, atualizar as referências com
      `npm run test:visual -- --update-snapshots=all` e conferir as imagens.
- [ ] **Passo 6:** commit `perf(páginas): home, features, termos e auth saem prontas do CDN`.

### Tarefa 4: trocar o idioma recarrega, e o convite sobrevive

**Arquivos:**

- Modificar: `src/frontend/components/LanguageSwitcher.tsx`, `src/frontend/hooks/useTranslationInvite.ts`
- Testes: `src/frontend/hooks/useTranslationInvite.unit.test.tsx`, `e2e/language.spec.ts`

**Interfaces:**

- `LanguageSwitcher`: grava `NEXT_LOCALE` (1 ano, `path=/`) e chama `window.location.reload()`.
- `useTranslationInvite(enabled)`: a função devolvida grava `sessionStorage['rpg-world:translation-invite'] = '1'`
  quando `enabled`; ao montar, se a chave existe, apaga e mostra o toast. Leitura e escrita em
  `try/catch` (storage pode estar bloqueado).

- [ ] **Passo 1: testes**
  - Unitário: `mostra o convite ao montar quando a troca foi pedida antes do reload` e `não mostra
sem o aviso guardado`.
  - e2e, em `language.spec.ts`: depois de trocar para pt na home, clicar no link Features abre em
    português. Os dois testes atuais continuam.
- [ ] **Passo 2:** rodar. Esperado: falham.
- [ ] **Passo 3:** implementar.
- [ ] **Passo 4:** rodar unitários e `npx playwright test e2e/language.spec.ts`. Esperado: passam.
- [ ] **Passo 5:** commit `fix(i18n): trocar o idioma recarrega e mantém o convite para traduzir`.

### Tarefa 5: medição de depois e PR

- [ ] **Passo 1:** abrir o PR com a medição de antes. Depois do deploy, repetir a Tarefa 0 e
      completar a tabela "Resultados da medição" com antes e depois.
- [ ] **Passo 2:** no PR, citar a decisão de fuso fixo e o redirect novo de `/register`.

## Resultados da medição

Medido com `curl -w '%{time_starttransfer}'` em `https://www.rpgworldapp.com`, de São Paulo, sem
cookie, 5 vezes. "Fria" é a primeira chamada da série.

| URL         | antes (fria) | antes (quente, mediana) | depois (fria) | depois (quente, mediana) |
| ----------- | ------------ | ----------------------- | ------------- | ------------------------ |
| `/`         | 1,81 s       | 0,15 s                  |               |                          |
| `/features` | 0,26 s       | 0,13 s                  |               |                          |

Achado à parte: `https://rpgworldapp.com` (sem `www`) responde 308 para o `www` antes de qualquer
coisa, mais uma ida e volta (~40–100 ms) para quem compartilha o link sem `www`. Fica fora deste
projeto.
