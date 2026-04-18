# Guia de Contribuição - RPG World

Bem-vindo ao projeto **RPG World**! Este documento detalha os padrões, processos e regras de ouro necessários para contribuir com excelência para a nossa base de código.

---

## 🛠️ 1. Configuração do Ambiente

Para garantir a consistência entre os desenvolvedores, seguimos um ambiente rigoroso:

### Pré-requisitos

- **Sistema Operacional**: WSL2 (Ubuntu).
- **Node.js**: `v24.14.0` (Use o [NVM](https://github.com/nvm-sh/nvm) para gerenciar).
- **Docker**: Necessário para rodar o Supabase localmente.

### Setup Inicial

1.  **Clone o repositório** e entre na pasta.
2.  **Versão do Node**:
    ```bash
    nvm use
    ```
3.  **Instalação**:
    ```bash
    npm install
    ```
4.  **Infraestrutura**:
    ```bash
    npm run infra up
    ```
    _Este comando orquestra o Docker, gera tipos do banco e aplica migrations._

---

## 🚀 2. Fluxo de Desenvolvimento

### Comandos de Operação

| Comando            | Função                                              |
| :----------------- | :-------------------------------------------------- |
| `npm run dev`      | Inicia o servidor Next.js.                          |
| `npm run infra up` | Sobe Docker, Sync de pastas e gera tipos.           |
| `npm run test`     | Pipeline completo (Unit + Integração).              |
| `npm run clean`    | **Botão de Pânico**: Hard reset do banco e volumes. |

### Padronização de Commits

Utilizamos **Conventional Commits** para manter um histórico legível:

- `feat: ...` (Nova funcionalidade)
- `fix: ...` (Correção de bug)
- `chore(deps): ...` (Atualização de dependências)
- `docs: ...` (Melhorias na documentação)

---

## 🏗️ 3. Regras da Arquitetura

### Clean Architecture & SOLID

- **Isolamento Total**: O Frontend comunica-se exclusivamente com a API layer e desconhece detalhes do Supabase.
- **Inversão de Dependência**: Casos de uso dependem de interfaces (abstrações), nunca de implementações concretas.
- **Request-Scoped Container**: O container de DI é instanciado via `React.cache()` por requisição.

### Server-First Mindset

- **Default**: Todo componente é um Server Component por padrão.
- **'use client'**: Empurre a interatividade o máximo possível para as extremidades da árvore (leaf components).
- **Data Fetching**: Sempre no servidor via `async/await` no componente. Proibido `useEffect` para dados iniciais.

### Internacionalização (i18n)

- **Obrigatoriedade**: Nenhuma string "hardcoded" é permitida. Use `next-intl` e o hook `useTranslations`.
- **Dicionários**: Arquivos JSON em `messages/`. Chaves em `camelCase`.

---

## 🎨 4. Design System (Tailwind v4)

- **Cores Dinâmicas**: Use variáveis proxy do personagem (ex: `text-character-flare`, `bg-character-surface`).
- **Escala de Fonte**: Siga estritamente a escala do Tailwind (`text-sm`, `text-xs`). Evite valores arbitrários.
- **Aesthetic Premium**: Utilize glassmorphism, sombras suaves e micro-animações.

---

## 🧪 5. Estratégia de Testes

- **Colocation**: Testes unitários (`.unit.test.ts`) e de integração (`.integration.test.ts`) devem residir na mesma pasta do arquivo alvo dentro de `src/`.
- **Pipeline**: Antes de submeter um PR, garanta que `npm run test` passe localmente.

---

## 🤝 6. Processo de Pull Request

1. Crie uma branch a partir da `main` (ex: `feat-nome-da-feature`).
2. Implemente sua mudança seguindo as **Regras de Ouro**.
3. Adicione testes para sua lógica.
4. Certifique-se de que o lint e testes passam.
5. Abra o PR com uma descrição clara do que foi feito.

---

_Este guia é mantido pela Rebs Tech Studio. Em caso de dúvida, consulte o `RULES_REFERENCE.md`._
