# 🗺️ Estrutura de Pastas

```text
src/
├── backend/
│   ├── index.ts              # Agregador central da API (Injetado via Container)
│   ├── shared/               # Infraestrutura compartilhada
│   │   └── infrastructure/   # Singleton Container & Contexts Hub
│   └── contexts/             # Bounded Contexts (Arquitetura Hexagonal/Clean)
│       └── character/
│           ├── domain/         # Entidades, Repo Interfaces, Regras de Negócio
│           ├── application/    # Casos de Uso
│           ├── infrastructure/ # Repositórios (Memória/Supabase), Mappers
│           └── interfaces/     # API Factory (Contratos de entrada/saída)
├── frontend/
│   ├── components/      # UI Components (Shadcn)
│   ├── context/         # Estados globais (UserContext, etc)
│   ├── hooks/           # Data fetching (React Query)
│   └── lib/             # Clientes/Utils exclusivos do frontend
├── shared/              # Código compartilhado entre frontend e backend
│   ├── systems/         # Regras específicas e schemas de cada RPG (ex: dnd5e)
│   └── types/           # Tipagens globais (Character, User)
└── app/                 # Next.js Routes (The Glue)
    └── api/             # HTTP endpoints que chamam o @api (backend)
```

# 🏗️ Camadas da Arquitetura

O projeto utiliza princípios de **Clean Architecture** e **Domain-Driven Design (DDD)**:

1.  **Domain (Domínio)**: O coração do negócio. Contém Entidades e as interfaces dos Repositórios. Independente de tecnologia.
2.  **Application (Aplicação)**: Orquestra Casos de Uso. Depende apenas do Domínio.
3.  **Infrastructure (Infraestrutura)**: Implementações técnicas (Supabase, Container). Aqui vive o **Singleton Container**, garantindo uma única instância de cada serviço.
4.  **Interfaces (API Factory)**: Define como o mundo externo (frontend) fala com o backend. Usamos o pattern de **Factory** para injetar os serviços do container, facilitando testes e desacoplamento.

# 🔄 Fluxo de Dados

A comunicação entre camadas segue um fluxo rígido para evitar acoplamento:

**Frontend** (`fetch`) ➔ **API Route** (`app/api`) ➔ **Backend API** (`@api`) ➔ **Use Case** ➔ **Repository**

# 🛠️ Tecnologias Principais

- **Next.js 14+**: App Router e Server Components.
- **Supabase**: Autenticação e Persistência.
- **TypeScript**: Tipagem estrita ponta a ponta (via `ContainerRegistry`).
- **Tailwind CSS + Shadcn**: Design system.
- **React Query**: Sincronização de estado servidor/cliente.

