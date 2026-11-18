# 🗺️ RPG World - Mapa e Estrutura do Projeto

Este documento serve como um guia de navegação para desenvolvedores e agentes de IA, descrevendo a finalidade de cada diretório principal e a organização do código.

## 📂 Diretórios Raiz

- **`docs/`**: Planos (`docs/plans/`), specs com decisões (`docs/superpowers/specs/`), revisão de telas (`docs/revisao-telas/`) e Grimório. O processo de contribuição está no `CONTRIBUTING.md`.
- **`content/`**: Conteúdo SRD em JSON: `content/dnd5e/srd-5.1/` (2014) e `content/dnd5e/srd-5.2/` (2024), importados pelos scripts de `scripts/content/`.
- **`app/`**: Rotas do Next.js (App Router), layouts e Route Handlers da API.
- **`database/`**: Migrations do banco de dados, seeds e configurações locais (Dev/Test) do Supabase.
- **`public/`**: Assets estáticos (imagens, ícones, fontes).
- **`shared/`**: Código compartilhado entre Frontend e Backend (veja abaixo).
- **`scripts/`**: Utilitários de automação e manutenção.
- **`src/`**: Código-fonte principal da aplicação.
- **`test/`**: Testes E2E e configurações globais de teste.

## 🏗️ Estrutura em `src/`

A `src/` está dividida em dois pilares principais, mais o `shared/` na raiz, seguindo a Clean Architecture:

### 1. `src/backend/`

Coração da lógica de negócio e integração com serviços.

- **`src/backend/contexts/`**: Divisão por contextos delimitados (Bounded Contexts).
  - Cada contexto tem Domínio, Casos de Uso e Repositórios: `characters`, `classes`, `combat`, `conditions`, `feedback`, `items`, `lore`, `parties`, `spells` e `users` (usuários e autenticação).
- **`src/backend/shared/`**: Infraestrutura compartilhada do backend (HTTP wrappers, DI Container).
- **`src/backend/index.ts`**: Exporta `getApi()`, ponto de entrada único para o Frontend. Use `import { getApi } from '@api';`

### 2. `src/frontend/`

Camada de apresentação e estado do cliente.

- **`src/frontend/components/`**: Componentes React (incluindo a pasta `ui/` do Shadcn).
- **`src/frontend/context/`**: Provedores de contexto React (ex: `UserContext`).
- **`src/frontend/hooks/`**: Custom hooks para lógica de UI e data fetching (React Query).
- **`src/frontend/lib/`**: Clientes de API e utilitários exclusivos do frontend.

### 3. `shared/` (Raiz do repositório, fora de `src/`)

Código compartilhado entre Frontend e Backend.

- **`shared/systems/dnd5e/`**: Regras de D&D 5e: cálculos, `constants/` e `content/` (schemas Zod do conteúdo e as edições em `content/editions.ts`).
- **`shared/types/`**: Definições de tipos TypeScript globais.

## 🔄 Fluxo de Comunicação

1. **Frontend** chama uma função via `rpgWorldApi` (em `src/frontend/lib/`).
2. A requisição atinge um **Route Handler** em `app/api/`.
3. O handler usa `getApi()` para acessar um **Caso de Uso** no Backend.
4. O Backend utiliza o **Container de DI** para injetar o **Repositório** (Supabase) necessário.
