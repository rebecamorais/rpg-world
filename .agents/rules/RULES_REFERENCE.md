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
- **Setup Dinâmico**: Os testes de integração utilizam o script `tests/setup-env.ts` para injetar credenciais dinâmicas capturadas via `supabase status`.

## 3. Autenticação & Ciclo de Vida do Usuário

- **Criação de Conta**: Novos usuários são criados **manualmente** via Dashboard do Supabase (medida temporária).
- **Senha de Primeiro Acesso**: Senha padrão obrigatória: `123MudarASenha@`.
- **Política de Troca**: O sistema deve interceptar usuários com a senha padrão ou onde `last_password_change == null`, forçando o redirecionamento para `/settings/change-password`.
- **Auth Server-Side**: Autenticação 100% via Supabase SSR (Proxy Pattern). O `middleware.ts` gerencia apenas o refresh do token JWT.

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

| Camada / Tipo                      | Formato          | Exemplo                        |
| ---------------------------------- | ---------------- | ------------------------------ |
| **Domínio (Entidades/Interfaces)** | `PascalCase.ts`  | `User.ts`, `AuthRepository.ts` |
| **Application/Infra (Backend)**    | `kebab-case.ts`  | `supabase-auth-repository.ts`  |
| **Componentes React (Frontend)**   | `PascalCase.tsx` | `LoginForm.tsx`                |
| **UI Components (Shadcn)**         | `kebab-case.tsx` | `button.tsx`                   |
| **Hooks / Utils**                  | `camelCase.ts`   | `useAuth.ts`                   |

## 7. Internacionalização (i18n) & Frontend

- **Obrigatoriedade**: Nenhum texto em "hardcoded string" é permitido em componentes de UI. Todo conteúdo textual deve passar pela camada de internacionalização.
- **Stack**: Uso mandatório de `next-intl` (ou similar compatível com Server Components) utilizando o hook `useTranslations`.
- **Idiomas Suportados**: Inglês (`en`) e Português (`pt-br`).
- **Localização de Dicionários**: Arquivos JSON organizados por escopo (ex: `messages/pt-br.json`).
- **Convenção de Chaves**: Uso de `camelCase` para chaves de tradução, seguindo a hierarquia do componente (ex: `Common.buttons.save`).

### Exemplo Prático de Implementação (Padronizado)

Para manter a consistência que você definiu na **Rebs Tech Studio**, todo componente deve seguir este padrão:

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
| `@tests/*`        | `tests/*`                     | Suítes de teste e mocks globais.                      |
| `@api`            | `src/backend/index`           | Entrypoint principal da camada de API.                |
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

## 11. Tipografia & Design System (Tailwind Standard)

Para garantir consistência visual e manutenibilidade, o projeto segue estritamente a escala tipográfica padrão do Tailwind CSS. Evite o uso de valores arbitrários (ex: `text-[10px]`) exceto em casos de extrema necessidade técnica.

### Escala Padrão Recomendada:

| Classe          | Tamanho (px) | Line Height | Uso Comum                                                       |
| :-------------- | :----------- | :---------- | :-------------------------------------------------------------- |
| **`text-xs`**   | 12px         | 16px        | Labels secundários, mini-badges, notas de rodapé.               |
| **`text-sm`**   | 14px         | 20px        | **Padrão do Projeto.** Textos de interface, botões, descrições. |
| **`text-base`** | 16px         | 24px        | Corpo de texto longo, parágrafos de lore.                       |
| **`text-lg`**   | 18px         | 28px        | Subtítulos ou destaques de UI.                                  |

- **Estilo Premium**: Para labels pequenos, prefira combinar `text-sm` ou `text-xs` with `font-bold`, `tracking-wider` e `uppercase` em vez de reduzir ainda mais a fonte.
- **Acessibilidade**: O tamanho `text-xs` (12px) é o limite mínimo sugerido para garantir a legibilidade.

## 12. Sistema de Cores Dinâmicas (Proxy de Cores do Personagem)

Para suportar interfaces personalizadas baseadas no `accentColor` do personagem de forma sustentável, utilizamos um sistema de variáveis proxy e tokens do Tailwind v4.

### Princípios:

- **Proxy Centralizado**: Todas as cores dependentes do personagem devem ser definidas no `:root` do `globals.css` utilizando a variável base `--character-color`.
- **Tokens de Tema**: Estas variáveis devem ser mapeadas no `@theme inline` do Tailwind para permitir o uso de classes utilitárias semânticas.
- **Transparência e Efeitos**: Utilize `color-mix` diretamente na definição das variáveis CSS para criar camadas de superfície (`surface`), estados desabilitados (`muted`) ou brilhos (`glow`).

### Tokens Disponíveis:

| Token               | Variável CSS          | Descrição                                                     |
| ------------------- | --------------------- | ------------------------------------------------------------- |
| `character`         | `--character-primary` | Cor base do personagem (passa por fallback para `--primary`). |
| `character-flare`   | `--character-flare`   | Cor vibrante para ícones e destaques.                         |
| `character-surface` | `--character-surface` | Fundo sutil (10% opacidade) para cards e inputs.              |
| `character-muted`   | `--character-muted`   | Cor atenuada (30% opacidade) para bordas e estados inativos.  |
| `character-glow`    | `--character-glow`    | Brilho suave (50% opacidade) para sombras e efeitos de hover. |

### Regras de Implementação:

- **Proibido Estilo Inline**: Evite `style={{ color: 'var(--character-color)' }}`. Use classes como `text-character-flare`.
- **Proibido color-mix Ad-hoc**: Não utilize `color-mix` diretamente nos arquivos `.tsx`. Se precisar de uma nova variante, adicione-a ao `globals.css`.
- **Preferência Semântica**: Use `text-character-flare` em vez de `text-character` para elementos informativos (ícones, títulos pequenos) para aumentar o contraste.
- **Shadows e Borders**: Utilize as classes utilitárias de borda (`border-character-muted`) e sombra customizada aproveitando o mapeamento do tema.

## 13. Padronização de Cores do Sistema (Paleta Global)

Para evitar a proliferação de tons arbitrários, utilizamos uma paleta fixa para estados e categorias de dados, mapeada com variantes de transparência no `globals.css`.

### Tokens Principais:

| Cor          | Token Base | Variantes Disponíveis                      | Uso Comum                    |
| ------------ | ---------- | ------------------------------------------ | ---------------------------- |
| **Vermelho** | `red`      | `red`, `red-surface`, `red-muted`          | Perigo, Erro, HP Crítico.    |
| **Azul**     | `blue`     | `blue`, `blue-surface`, `blue-muted`       | Info, Magia, Mana.           |
| **Verde**    | `green`    | `green`, `green-surface`, `green-muted`    | Sucesso, HP, Natureza.       |
| **Amarelo**  | `yellow`   | `yellow`, `yellow-surface`, `yellow-muted` | Alerta, Inspiração, Sagrado. |

### Critérios de Uso:

- **Consistência**: Sempre prefira `bg-red-surface` ou `text-green-flare` em vez de valores hexadecimais arbitrários ou classes de cores do Tailwind com opacidades inline (ex: `bg-red-500/10`).
- **Acessibilidade**: Utilize a variante `flare` (base) para textos e ícones sobre fundos escuros para garantir visibilidade.
- **Semântica**: Embora os tokens tenham nomes de cores, tente associá-los à semântica do componente (ex: vermelho para erros, verde para confirmações).
