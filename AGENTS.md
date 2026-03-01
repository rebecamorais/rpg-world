# 🤖 RPG World - Agentes & Princípios de Desenvolvimento

Este documento define as diretrizes de engenharia que DEVEM ser seguidas em todas as interações.

## 🏛️ Arquitetura (Clean Architecture & SOLID)

- **Isolamento Total:** O Frontend nunca conhece detalhes de persistência (Supabase). Comunica-se apenas com a API layer.
- **Inversão de Dependência (DIP):** Depender de abstrações (Interfaces), nunca de implementações concretas dentro dos casos de uso.
- **Single Source of Truth:** Cálculos de RPG residem exclusivamente no Domínio/Backend.
- **Request-Scoped Container:** O container de DI é instanciado via `React.cache()` por requisição — sem Singleton global. Nunca usar estado global nas dependências.
- **Segurança das APIs:** Rotas autenticadas SEMPRE leem a identidade do usuário da sessão do servidor (`authApi.getSessionUser()`) — nunca do `body`, `querystring` ou headers manipulados pelo cliente.
- **Route Handlers:** Usar `withAuth<Body>(handler, status?)` para rotas autenticadas e `withHandler<Body>(handler, status?)` para rotas públicas. Ambos cuidam de `req.json()`, `NextResponse`, try/catch e serialização. O handler retorna dados puros — sem `NextResponse`.

## 🛠️ Stack & Padrões

- **Linguagem:** TypeScript (Strict Mode).
- **Estilo:** Conforme configurado no Prettier/Husky.
- **Frontend:** Next.js (App Router), Tailwind CSS, Shadcn UI.
- **Validação:** Zod (em ambas as camadas).

## 🛡️ Regras de Commits (Husky)

- Todo código deve passar pelo `lint-staged` e `prettier --write` antes do commit.
- Não aceitar códigos que ignorem erros de tipagem (`any` é proibido) e `unknown` só deve usar em ultimo caso

## 🚀 Estratégia de Renderização (Server-First)

- **Default para Server Components:** Todo componente é um Server Component por padrão. O uso de `'use client'` deve ser a exceção, não a regra. Só adicione `'use client'` se precisar de `useState`, `useEffect` ou Event Listeners.
- **Isolamento de Interatividade:** O `'use client'` deve ser empurrado para as "folhas" da árvore de componentes (ex: apenas o botão ou o input, não o formulário inteiro se não for necessário).
- **Data Fetching:** Toda busca de dados inicial deve ocorrer em Server Components. O Cliente apenas recebe os dados prontos (via props) ou interage via Server Actions.
- **Complexidade:** Se um componente Client está ficando muito grande, quebre-o em sub-componentes Server onde a lógica for apenas visual.
- **Segurança:** Lógicas que utilizam chaves privadas ou acessam o banco diretamente (via Repository) NUNCA devem estar em arquivos com `'use client'`.
