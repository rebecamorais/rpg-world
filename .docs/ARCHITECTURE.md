# 🗺️ Estrutura de Pastas

src/
├── backend/
│   ├── shared/          # Código compartilhado (erros, utilitários)
│   └── contexts/        # Contextos Delimitados (Bounded Contexts)
│       └── character/
│           ├── domain/         # Entidades, Interfaces, Regras de D&D
│           ├── application/    # Casos de Uso (Services)
│           └── infrastructure/ # Repositórios (Supabase), Mappers
├── frontend/
│   ├── components/      # UI (Shadcn)
│   ├── hooks/           # Lógica de UI e SWR/React Query
│   └── services/        # Clientes que chamam o Backend
└── app/                 # Next.js Routes & Server Actions (The Glue)