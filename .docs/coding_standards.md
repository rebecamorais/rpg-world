# Padrões de Código e Arquitetura - RPG World

Este documento estabelece as regras de nomenclatura e as bases arquiteturais obrigatórias para o projeto RPG World. Todos os PRs devem aderir estritamente a estas convenções.

---

## Nomenclatura de Arquivos e Componentes

A nomeação dos arquivos reflete sua camada de atuação e tipologia:

1. **Backend (Casos de Uso, Entidades, Infraestrutura)**
   - Formato obrigatório: `kebab-case.ts`
   - Exemplos: `auth-controller.ts`, `supabase-auth-repository.ts`, `get-session-use-case.ts`.

2. **Frontend (Componentes React / Next.js Pages)**
   - Formato obrigatório: `PascalCase.tsx`
   - Exemplos: `LoginForm.tsx`, `CharacterSheet.tsx`.

3. **Frontend (Hooks, Utilitários, Serviços)**
   - Formato obrigatório: `camelCase.ts`
   - Exemplos: `useAuth.ts`, `apiClient.ts`, `formatCurrency.ts`.

## Padrões de Variáveis e Classes

- **Nome de Classes e Interfaces**: `PascalCase`.
  - Exemplos: `interface AuthRepository`, `class SignInWithMagicLinkUseCase`.
- **Nome de Instâncias, Objetos e Funções**: `camelCase`.
  - Exemplos: `const authClient`, `function createUserContext()`, `let characterId`.

---

## Princípios de Arquitetura

O backend do RPG World segue os dogmas da **Clean Architecture** em conjunção com os princípios **SOLID**.

### Regras de Ouro:

1. **Inversão de Dependências (DIP)**: As regras de negócio (Domínio e Casos de Uso) **nunca** importam bibliotecas externas (como `@supabase/supabase-js`, Bancos de Dados, Mailers). Elas dependem exclusivamente de **Interfaces**.
2. **Injeção de Dependências**: Todo repositório ou caso de uso deve receber suas instâncias (clientes, instâncias de banco) injetadas via construtor (`constructor(private readonly repo: Interface) {}`). O `Container` central é o único local focado em instanciar bibliotecas reais.
3. **Escopo Server-Only**: Arquivos de infraestrutura de backend (conexão a bancos de dados, chaves sensíveis) devem sempre começar com pragma `import 'server-only'` para garantir que não vazem no build do frontend.
