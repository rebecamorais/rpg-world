# 🤖 RPG World - Agentes & Princípios de Desenvolvimento

Este documento define as diretrizes de engenharia que DEVEM ser seguidas em todas as interações.

## 🏛️ Arquitetura (Clean Architecture & SOLID)
- **Isolamento Total:** O Frontend (Next.js) nunca deve conhecer detalhes da persistência (Supabase). Ele se comunica apenas com a camada de Application/API.
- **Inversão de Dependência (DIP):** Depender de abstrações (Interfaces/Contratos), nunca de implementações concretas ou containers globais dentro dos casos de uso.
- **Single Source of Truth:** Cálculos de RPG (Spell Slots, Modificadores) residem exclusivamente no Domínio/Backend. O Frontend apenas deriva a UI desses dados.

## 🛠️ Stack & Padrões
- **Linguagem:** TypeScript (Strict Mode).
- **Estilo:** Aspas simples, sem ponto e vírgula (conforme configurado no Prettier/Husky).
- **Frontend:** Next.js (App Router), Tailwind CSS, Shadcn UI.
- **Validação:** Zod (em ambas as camadas).

## 🛡️ Regras de Commits (Husky)
- Todo código deve passar pelo `lint-staged` e `prettier --write` antes do commit.
- Não aceitar códigos que ignorem erros de tipagem (`any` é proibido) e `unknown` só deve

## 🚀 Estratégia de Renderização (Server-First)
- **Default para Server Components:** Todo componente é um Server Component por padrão. O uso de `'use client'` deve ser a exceção, não a regra.
- **Isolamento de Interatividade:** O `'use client'` deve ser empurrado para as "folhas" da árvore de componentes (ex: apenas o botão ou o input, não o formulário inteiro se não for necessário).
- **Data Fetching:** Toda busca de dados inicial deve ocorrer em Server Components. O Cliente apenas recebe os dados prontos (via props) ou interage via Server Actions.
- **Segurança:** Lógicas que utilizam chaves privadas ou acessam o banco diretamente (via Repository) NUNCA devem estar em arquivos com `'use client'`.