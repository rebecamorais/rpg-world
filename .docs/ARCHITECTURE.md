# 🗺️ Estrutura de Pastas

```text
src/
├── backend/
│   ├── index.ts              # Agregador central da API — exporta getApi()
│   ├── shared/               # Infraestrutura compartilhada
│   │   ├── http/             # Wrappers HTTP para Route Handlers
│   │   │   └── route-handler.ts  # withHandler (público) + withAuth (autenticado)
│   │   └── infrastructure/       # Container de DI & Clients
│   │       ├── container.ts      # Classe Container (DI)
│   │       ├── contexts.ts       # Context Hub (injeta dependências)
│   │       └── get-container.ts  # Request-Scoped factory via React cache()
│   └── contexts/             # Bounded Contexts (Clean Architecture)
│       ├── characters/
│       │   ├── domain/         # Entidades, Repo Interfaces, Regras de Negócio
│       │   ├── application/    # Casos de Uso
│       │   ├── infrastructure/ # Repositórios (Memória/Supabase)
│       │   └── interfaces/     # API Factory
│       └── users/
│           ├── domain/         # User entity, AuthRepository interface
│           ├── application/    # SignIn, Callback, GetSession, SignOut use cases
│           ├── infrastructure/ # SupabaseAuthRepository
│           └── interfaces/     # auth.api.ts (AuthApi factory)
├── frontend/
│   ├── components/      # UI Components (Shadcn)
│   ├── context/         # UserContext — distribui currentUser via Server Component
│   ├── hooks/           # useCharacter, useCharacters, useAuth
│   └── lib/             # ApiClient, rpgWorldApi
├── shared/              # Código compartilhado entre frontend e backend
│   ├── systems/         # Schemas e regras por sistema RPG (ex: dnd5e)
│   └── types/           # Tipagens globais (Character, User)
└── app/                 # Next.js Routes
    ├── (dashboard)/     # Rotas protegidas — layout faz guard via getApi()
    │   ├── layout.tsx   # Busca session no servidor, injeta UserProvider
    │   ├── characters/
    │   └── system/
    ├── api/             # Route Handlers (usam withHandler ou withAuth)
    │   ├── auth/        # magic-link, callback, google, session, signout
    │   └── characters/
    ├── login/
    └── middleware.ts    # Token refresh only (Supabase SSR)
```

# 🏗️ Camadas da Arquitetura

O projeto utiliza princípios de **Clean Architecture** e **Domain-Driven Design (DDD)**:

1. **Domain**: Entidades e interfaces de Repositório. Zero dependências externas.
2. **Application**: Casos de Uso. Depende apenas do Domínio.
3. **Infrastructure**: Implementações técnicas (`SupabaseAuthRepository`, `Container`, Clients Supabase). O container é **Request-Scoped** via `React.cache()` — sem Singleton global, sem vazamento de estado entre requests em ambiente Serverless.
4. **Interfaces (API Factory)**: Define como as Route Handlers acessam os casos de uso via `getApi()`.
5. **HTTP (shared/http)**: Wrappers de Route Handler — `withHandler` (público) e `withAuth` (autenticado). Cuidam de `req.json()`, `NextResponse`, try/catch e validação de sessão.

# 🔐 Autenticação

Autenticação 100% server-side via **Supabase SSR** (proxy pattern):

- **AuthClient** (`@supabase/ssr` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`): gerencia sessão e cookies HttpOnly por request.
- **DBClient** (`@supabase/supabase-js` + `SUPABASE_SERVICE_ROLE_KEY`): operações privilegiadas (bypass de RLS).
- **Magic Link** (PKCE): `POST /api/auth/magic-link` → email → `GET /api/auth/callback`.
- **Google OAuth**: `GET /api/auth/google` → redirect → mesmo callback.
- **Guard de Rota**: `app/(dashboard)/layout.tsx` chama `authApi.getSessionUser()` no servidor e redireciona para `/login` se não autenticado. O `middleware.ts` cuida apenas do refresh de token JWT.
- **Identidade nas APIs**: Route Handlers autenticados leem `user.id` da sessão — nunca do body ou querystring.

# 🔄 Fluxo de Dados

```
Frontend (fetch) → API Route (withAuth/withHandler) → getApi() → Use Case → Repository
                                                          ↑
                                          getContainer() via React.cache() [por request]
```

**UserContext no Frontend:**

```
layout.tsx (Server) → authApi.getSessionUser() → UserProvider(user={user}) → useCurrentUser()
```

O `currentUser` é buscado **uma vez** no servidor e distribuído via Context. Zero chamadas HTTP adicionais nos componentes filhos.

# 🛠️ Tecnologias Principais

- **Next.js 14+**: App Router, Server Components, Route Handlers, Middleware.
- **Supabase**: Auth (SSR) e Persistência.
- **TypeScript**: Tipagem estrita ponta a ponta.
- **Tailwind CSS + Shadcn**: Design system.
- **React Query**: Sincronização de estado servidor/cliente.
- **Vitest**: Testes unitários de domínio e aplicação.
