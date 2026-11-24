---
trigger: always_on
---

# RPG World - Princípios de Desenvolvimento & Regras de Ouro

## 1. Infraestrutura de Banco

- **Ambientes Isolados**:
- **Development**: Porta **54321** (configurado em `database/db-dev/supabase/config.toml`).
- **Testing**: Porta **54421** (configurado em `database/db-test/supabase/config.toml`).

- **Migrations**: Centralizadas em `database/migrations/` e compartilhadas entre os ambientes.
- **Seeds**: Exclusivos para o ambiente de desenvolvimento (`db-dev`) localizados em `database/db-dev/seeds`.

## 2. Estratégia de Testes (Colocation)

- **Localização**: Testes unitários (`.unit.test.ts`) e de integração (`.integration.test.ts`) devem residir na mesma pasta do arquivo alvo dentro de `src/`.
- **Setup Dinâmico**: Os testes de integração utilizam o script `test/setup-env.ts` (configs em `test/vitest.config.{unit,integration}.ts`) para injetar credenciais dinâmicas capturadas via `supabase status`.

## 3. Autenticação & Ciclo de Vida do Usuário

- **Criação de Conta**: Novos usuários se cadastram pela página de cadastro (`app/[locale]/(public)/register/`).
- **Troca de Senha**: A troca fica em `/change-password`; a recuperação, em `/forgot-password` e `/reset-password`.
- **Auth Server-Side**: Autenticação 100% via Supabase SSR (Proxy Pattern). O `proxy.ts` (antigo `middleware.ts`) faz o refresh do token JWT e escolhe o idioma; a proteção das rotas fica nos layouts.

## 4. Arquitetura (Clean Architecture & SOLID)

- **Isolamento Total**: O Frontend comunica-se exclusivamente com a API layer e desconhece detalhes de persistência (Supabase).
- **Inversão de Dependência (DIP)**: Casos de uso dependem de interfaces (abstrações), nunca de implementações concretas como repositórios Supabase.
- **Single Source of Truth**: Regras de negócio e cálculos de RPG residem exclusivamente no Domínio/Backend.
- **Request-Scoped Container**: O container de DI é instanciado via `React.cache()` por requisição, proibindo Singletons globais para evitar vazamento de estado.
- **Segurança das APIs**: Rotas autenticadas devem sempre ler a identidade do usuário da sessão do servidor via `authApi.getSessionUser()`.

## 5. Estratégia de Renderização (Server-First)

- **Default**: Todo componente é um Server Component por padrão. O uso de `'use client'` é restrito à interatividade folha.
- **Data Fetching**: Buscas iniciais de dados ocorrem sempre no servidor.
- **Segurança de Código**: Arquivos com lógica sensível ou acesso direto ao banco devem utilizar `import 'server-only'`.

## 6. Nomenclatura de Arquivos

Só dois casos usam letra maiúscula: o que é **um componente React** (inclusive um `Provider` de contexto) e o que é **um tipo do domínio**. Todo o resto é `kebab-case`.

| O que o arquivo exporta                                         | Formato                     | Exemplo                                                 |
| --------------------------------------------------------------- | --------------------------- | ------------------------------------------------------- |
| **Componente React** (inclusive templates de e-mail)            | `PascalCase.tsx`            | `SpellCard.tsx`, `MagicLink.tsx`                        |
| **Hook** (no `hooks/` ou junto do componente)                   | `useAlgo.ts(x)`             | `useCharacter.ts`, `useSheetTabs.ts`                    |
| **Domínio: entidade, value object, erro**                       | `PascalCase.ts`             | `User.ts`, `HealthPoints.ts`, `CharacterError.ts`       |
| **Domínio: interface de repositório**                           | `kebab-case.repo.ts`        | `auth.repo.ts`, `character-spell.repo.ts`               |
| **Domínio: serviço externo** (e-mail)                           | `kebab-case.service.ts`     | `email.service.ts`                                      |
| **Casos de uso** (um, ou vários do mesmo assunto)               | `kebab-case.use-case(s).ts` | `add-participant.use-case.ts`, `inventory.use-cases.ts` |
| **Todo o resto** (utils, constantes, contextos, infra, scripts) | `kebab-case.ts(x)`          | `api-client.ts`, `party-live.ts`, `spell-grimoire.tsx`  |
| **UI do Shadcn**                                                | `kebab-case.tsx`            | `button.tsx`                                            |

- **`.tsx` não quer dizer componente**: um arquivo de helpers que devolve JSX (`rich-links.tsx`, `spell-grimoire.tsx`) segue em `kebab-case`. O nome em PascalCase é para quando a exportação principal é um componente.
- **Contexto React**: com um componente `Provider` próprio é componente, em PascalCase (`UserContext.tsx`, `DemoContext.tsx`); só o `createContext` e hooks, sem componente, é `kebab-case` (`party-live.ts`, `removed-items.tsx`).
- **Testes** levam o nome do arquivo testado mais `.unit.test` ou `.integration.test`: `SpellCard.unit.test.tsx`.
- **E2E** (`e2e/`): `kebab-case.spec.ts`, com `.mobile.spec.ts` para o celular e `.visual.spec.ts` para as baselines.
- **Next.js**: os arquivos de `app/` seguem os nomes reservados (`page.tsx`, `layout.tsx`, `route.ts`).

## 7. Internacionalização (i18n) & Frontend

- **Obrigatoriedade**: Nenhum texto em "hardcoded string" é permitido em componentes de UI. Todo conteúdo textual deve passar pela camada de internacionalização (conferido por `src/frontend/hardcoded-text.unit.test.ts`). A exceção são as ferramentas internas de `src/frontend/dev/` (ex.: o laboratório do Grimório), que dão 404 em produção.
- **Stack**: Uso mandatório de `next-intl` (ou similar compatível com Server Components) utilizando o hook `useTranslations`.
- **Idiomas Suportados**: Inglês (`en`) e Português (`pt`), definidos em `src/i18n/routing.ts`. `en` é a fonte e `pt` está completo.
- **Localização de Dicionários**: `messages/{en,pt,es,sv}.json`. `es` e `sv` vêm do Weblate e ainda não estão ativos; o que falta em uma língua é completado com o inglês (`src/i18n/messages.ts`). Não edite `es`/`sv` à mão.
- **Convenção de Chaves**: Uso de `camelCase` para chaves de tradução, seguindo a hierarquia do componente (ex: `Common.buttons.save`).

### Exemplo Prático de Implementação (Padronizado)

Para manter a consistência, todo componente deve seguir este padrão:

```tsx
'use client';

import { useTranslations } from 'next-intl';

export function LoginButton() {
  const t = useTranslations('Auth');

  return <button type="submit">{t('loginLabel')}</button>;
}
```

## 8. Path Aliases & Estrutura de Importação

Para manter a modularidade e facilitar a manutenção, utilizamos aliases configurados no `tsconfig.json`. É proibido o uso de caminhos relativos longos (ex: `../../../`).

### Mapeamento de Aliases

| Alias             | Destino                       | Uso Principal                                         |
| ----------------- | ----------------------------- | ----------------------------------------------------- |
| `@/*`             | `src/*`                       | Acesso genérico à pasta source.                       |
| `@tests/*`        | `test/*`                      | Suítes de teste e mocks globais.                      |
| `@api`            | `src/backend/index`           | Entrypoint principal da camada de API. { getApi }     |
| `@client`         | `src/frontend/lib/api-client` | Instância configurada do Supabase/Fetch client.       |
| `@lib/*`          | `lib/*`                       | Utilitários agnósticos, tipos de banco e helpers.     |
| `@shared/*`       | `shared/*`                    | Constantes e tipos compartilhados entre Front e Back. |
| `@backend/*`      | `src/backend/*`               | Lógica de domínio, repositórios e serviços.           |
| `@frontend/*`     | `src/frontend/*`              | Componentes, hooks e stores de UI.                    |
| `@database-types` | `lib/types/database.ts`       | Tipagens geradas automaticamente pelo Supabase CLI.   |

### Regras para Imports

- **Circular Dependencies**: Evite importar de `@frontend` dentro de `@backend`. O fluxo de dependência deve ser sempre **Frontend -> Backend -> Shared/Lib**.
- **Database Types**: Utilize sempre `@database-types` para garantir que as queries estejam sincronizadas com o schema local.
- **Organização**: Imports devem ser agrupados: (1) Externos/Node, (2) Aliases de infra (`@api`, `@client`), (3) Componentes/Lógica (`@frontend`, `@backend`).

## 9. Gestão de Banco de Dados & Migrations

O ciclo de vida do banco de dados no **RPG World** é estritamente controlado via Supabase CLI e orquestrado pelo script `infra.ts`.

### Comandos de Operação (npm)

| Comando            | Função                                             | Quando usar?                                           |
| ------------------ | -------------------------------------------------- | ------------------------------------------------------ |
| `npm run infra up` | Sobe Docker, Sync de pastas e gera tipos.          | Início do dia ou após trocar de branch.                |
| `npm run clean`    | Hard Reset: apaga volumes e recria o banco.        | **Botão de pânico:** Erros de schema ou Auth corrupto. |
| `npm run db:ui`    | Abre o Studio (DB) e o Inbucket (E-mails).         | Debugar dados ou fluxos de confirmação de conta.       |
| `npm run test`     | Pipeline de teste completo (Unit + Infra + Integ). | Antes de abrir um Pull Request.                        |

### Fluxo de Criação de Migrations

Como as migrations são compartilhadas entre **Dev** e **Test**, utilize sempre o `--workdir` de desenvolvimento para criá-las:

1. **Criar Migration Vazia**:
   `npx supabase migrations new nome_da_minha_migration --workdir database/db-dev`
2. **Aplicar Mudanças Locais**:
   As migrations são aplicadas automaticamente ao rodar `npm run infra up` ou:

- `npx supabase db reset --workdir database/db-dev`
- `npx supabase db reset --workdir database/db-test`

3. **Gerar Tipos TypeScript**:
   Sempre rode `npm run types:update` (ou `npm run infra up`) após qualquer alteração no schema para manter o `@database-types` sincronizado.

## 10. Arquitetura Server-First & Uso de Client Components

O projeto adota uma mentalidade **Server-First**. O objetivo é manter o processamento e a lógica de dados no servidor, minimizando o _client-side bundle_ para garantir performance, segurança e uma hidratação mais eficiente.

### Regras de Ouro:

- **Padrão de Renderização:** Todo componente é um **Server Component** por padrão. O uso de `'use client'` deve ser a exceção, aplicada apenas onde a interatividade do navegador é estritamente necessária.
- **Isolamento de Interatividade:** A diretiva `'use client'` deve ser "empurrada" o máximo possível para as extremidades da árvore de componentes (_leaf components_). Nunca transforme uma página ou um layout inteiro em Client Component.
- **Data Fetching:** Toda busca de dados deve ser realizada em Server Components (utilizando `async/await` diretamente no componente). É proibido o uso de `useEffect` ou `SWR/TanStack Query` para o carregamento de dados iniciais que o servidor pode resolver.
- **Segurança e Integridade:** Lógicas que manipulam segredos, chaves privadas ou acesso direto ao banco de dados (via Supabase Admin, por exemplo) devem ser protegidas com `import 'server-only'`.

### Critérios para uso de `'use client'`:

| Cenário                  | Acção Correcta                                                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Interatividade React** | Uso de hooks de estado ou ciclo de vida (`useState`, `useReducer`, `useEffect`).                                                     |
| **Event Listeners**      | Uso de eventos de DOM como `onClick`, `onChange`, `onSubmit`.                                                                        |
| **Browser APIs**         | Acesso a `window`, `document`, `localStorage`, `sessionStorage` ou Geolocalização.                                                   |
| **Context Providers**    | Envolver o `children` num Client Component dedicado, mantendo o restante da árvore como Server Components.                           |
| **Formulários**          | Manter a página como Server Component e isolar apenas o formulário (ex: usando `react-hook-form`) num componente cliente específico. |

## 11. Dado novo depois de um `await` (foco, fechar, navegar)

O React Query avisa os componentes **um tick depois** que a query termina (o `notifyManager` agenda com `setTimeout`). Então, logo depois de `await mutation.mutateAsync(...)`, de um `refetch` ou de um `invalidateQueries`, as props e os dados de `useQuery` da closure ainda são os da renderização **anterior**. Sob carga (CI, celular lento), isso vira bug: foco perdido, decisão tomada com a lista vazia, botão que some logo depois de receber o foco.

- **Depois de um `await`, decida pelo dado novo**: `queryClient.getQueryData(chave)`, ou o próprio valor que acabou de ser salvo. Nunca pela prop ou pelo `data` da closure. Exemplo: o `onCloseAutoFocus` do diálogo "Meus personagens" em `PartyPage.tsx`.
- **Foco num elemento que só existe depois dos dados**: mova o foco num efeito que reage à mudança (o elemento montou, a lista cresceu), não num callback que roda uma vez antes da tela atualizar.
- **`setTimeout`/`requestAnimationFrame` não são "esperar a tela"**: sob carga, o dado pode chegar depois. Use o dado do cache ou um efeito.
- **Teste e2e de foco**: se passa local e falha no CI, reproduza com `npm run test:e2e:ci-like` (veja o `CONTRIBUTING.md`) antes de mexer no teste. Quase sempre é uma corrida real no app.
