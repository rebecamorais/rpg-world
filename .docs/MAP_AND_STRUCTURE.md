# 🗺️ RPG World - Mapa e Estrutura do Projeto

Este documento serve como um guia de navegação para desenvolvedores e agentes de IA, descrevendo a finalidade de cada diretório principal e a organização do código.

## 📂 Diretórios Raiz

- **`.docs/`**: Documentação técnica e regras de ouro (Single Source of Truth).
- **`app/`**: Rotas do Next.js (App Router), layouts e Route Handlers da API.
- **`database/`**: Migrations do banco de dados e scripts de seed.
- **`public/`**: Assets estáticos (imagens, ícones, fontes).
- **`scripts/`**: Utilitários de automação e manutenção.
- **`src/`**: Código-fonte principal da aplicação.
- **`supabase/`**: Configurações locais do Supabase (local dev).
- **`test/`**: Testes E2E e configurações globais de teste.

## 🏗️ Estrutura em `src/`

A `src/` está dividida em três pilares principais seguindo a Clean Architecture:

### 1. `src/backend/`
Coração da lógica de negócio e integração com serviços.
- **`contexts/`**: Divisão por contextos delimitados (Bounded Contexts).
    - `characters/`: Domínio, Casos de Uso e Repositórios de personagens.
    - `users/`: Gerenciamento de usuários e autenticação.
- **`shared/`**: Infraestrutura compartilhada do backend (HTTP wrappers, DI Container).
- **`index.ts`**: Exporta `getApi()`, ponto de entrada único para o Frontend.

### 2. `src/frontend/`
Camada de apresentação e estado do cliente.
- **`components/`**: Componentes React (incluindo a pasta `ui/` do Shadcn).
- **`context/`**: Provedores de contexto React (ex: `UserContext`).
- **`hooks/`**: Custom hooks para lógica de UI e data fetching (React Query).
- **`lib/`**: Clientes de API e utilitários exclusivos do frontend.

### 3. `src/shared/` (Raiz de `src/`)
Código compartilhado entre Frontend e Backend.
- **`systems/`**: Regras específicas de sistemas de RPG (ex: `dnd5e/` com schemas Zod e cálculos).
- **`types/`**: Definições de tipos TypeScript globais.

## 🔄 Fluxo de Comunicação

1. **Frontend** chama uma função via `rpgWorldApi` (em `src/frontend/lib/`).
2. A requisição atinge um **Route Handler** em `app/api/`.
3. O handler usa `getApi()` para acessar um **Caso de Uso** no Backend.
4. O Backend utiliza o **Container de DI** para injetar o **Repositório** (Supabase) necessário.
