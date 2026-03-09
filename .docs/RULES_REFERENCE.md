# RPG World - Princípios de Desenvolvimento & Regras de Ouro

## 1. Infraestrutura de Banco

* **Ambientes Isolados**:
* **Development**: Porta **54321** (configurado em `supabase/config.toml`).
* **Testing**: Porta **54331** (configurado em `supabase-test/config.toml`).

* **Migrations**: Centralizadas em `database/migrations/` e compartilhadas entre os ambientes.
* **Seeds**: Exclusivos para o ambiente de desenvolvimento (`db-dev`) localizados em `database/db-dev/seeds`.

## 2. Estratégia de Testes (Colocation)

* **Localização**: Testes unitários (`.unit.test.ts`) e de integração (`.integration.test.ts`) devem residir na mesma pasta do arquivo alvo dentro de `src/`.
* **Setup Dinâmico**: Os testes de integração utilizam o script `tests/setup-env.ts` para injetar credenciais dinâmicas capturadas via `supabase status`.

## 3. Autenticação & Ciclo de Vida do Usuário

* **Criação de Conta**: Novos usuários são criados **manualmente** via Dashboard do Supabase (medida temporária).
* **Senha de Primeiro Acesso**: Senha padrão obrigatória: `123MudarASenha@`.
* **Política de Troca**: O sistema deve interceptar usuários com a senha padrão ou onde `last_password_change == null`, forçando o redirecionamento para `/settings/change-password`.
* **Auth Server-Side**: Autenticação 100% via Supabase SSR (Proxy Pattern). O `middleware.ts` gerencia apenas o refresh do token JWT.

## 4. Arquitetura (Clean Architecture & SOLID)

* **Isolamento Total**: O Frontend comunica-se exclusivamente com a API layer e desconhece detalhes de persistência (Supabase).
* **Inversão de Dependência (DIP)**: Casos de uso dependem de interfaces (abstrações), nunca de implementações concretas como repositórios Supabase.
* **Single Source of Truth**: Regras de negócio e cálculos de RPG residem exclusivamente no Domínio/Backend.
* **Request-Scoped Container**: O container de DI é instanciado via `React.cache()` por requisição, proibindo Singletons globais para evitar vazamento de estado.
* **Segurança das APIs**: Rotas autenticadas devem sempre ler a identidade do usuário da sessão do servidor via `authApi.getSessionUser()`.

## 5. Estratégia de Renderização (Server-First)

* **Default**: Todo componente é um Server Component por padrão. O uso de `'use client'` é restrito à interatividade folha.
* **Data Fetching**: Buscas iniciais de dados ocorrem sempre no servidor.
* **Segurança de Código**: Arquivos com lógica sensível ou acesso direto ao banco devem utilizar `import 'server-only'`.

## 6. Nomenclatura de Arquivos

| Camada / Tipo | Formato | Exemplo |
| --- | --- | --- |
| **Domínio (Entidades/Interfaces)** | `PascalCase.ts` | `User.ts`, `AuthRepository.ts` |
| **Application/Infra (Backend)** | `kebab-case.ts` | `supabase-auth-repository.ts` |
| **Componentes React (Frontend)** | `PascalCase.tsx` | `LoginForm.tsx` |
| **UI Components (Shadcn)** | `kebab-case.tsx` | `button.tsx` |
| **Hooks / Utils** | `camelCase.ts` | `useAuth.ts` |

## 7. Internacionalização (i18n) & Frontend

* **Obrigatoriedade**: Nenhum texto em "hardcoded string" é permitido em componentes de UI. Todo conteúdo textual deve passar pela camada de internacionalização.
* **Stack**: Uso mandatório de `next-intl` (ou similar compatível com Server Components) utilizando o hook `useTranslations`.
* **Idiomas Suportados**: Inglês (`en`) e Português (`pt-br`).
* **Localização de Dicionários**: Arquivos JSON organizados por escopo (ex: `messages/pt-br.json`).
* **Convenção de Chaves**: Uso de `camelCase` para chaves de tradução, seguindo a hierarquia do componente (ex: `Common.buttons.save`).

---

### Exemplo Prático de Implementação (Padronizado)

Para manter a consistência que você definiu na **Rebs Tech Studio**, todo componente deve seguir este padrão:

```tsx
'use client';

import { useTranslations } from 'next-intl';

export function LoginButton() {
  const t = useTranslations('Auth');

  return (
    <button type="submit">
      {t('loginLabel')}
    </button>
  );
}

```


---