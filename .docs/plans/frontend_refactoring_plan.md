# Plano de Ação: Refatoração e Melhorias de Frontend (RPG World)

Este documento estabelece as diretrizes e as etapas para refatorar e elevar a maturidade do código frontend da aplicação, focando em performance, manutenibilidade e experiência do usuário (UX).

## Objetivos Principais
1. Eliminar recargas de página desnecessárias e reduzir "waterfalls" de carregamento.
2. Isolar lógicas complexas de Estado e Interface (separação de responsabilidades).
3. Garantir consistência visual através de uso intensivo de Design System padronizado.
4. Adotar padrões modernos do Next.js (App Router, Server Components e Server Actions).

### Por que suportar Múltiplos Sistemas (Polimorfismo de UI)?
- **Polimorfismo de UI:** Uma ficha de D&D 5e é radicalmente diferente de uma ficha de Vampiro: A Máscara ou Ordem Paranormal. Ter o sistema na URL permite que o Next.js escolha o "layout engine" correto para aquele personagem.
- **Isolamento de Erros:** Um bug na renderização de "Spells" de D&D não afetará os jogadores de sistemas que não usam magias.
- **SEO e Organização:** Fica claro na URL (ex: `/system/[system_name]/character/[id]`) e na estrutura de pastas qual lógica de negócio está sendo aplicada, facilitando a renderização de componentes específicos de cada sistema.

---

## Fases de Execução

### Fase 1: Padronização de Componentes UI (Design System)
Refinar os componentes base para não precisarmos reescrever classes do Tailwind. Os componentes base (shadcn/ui, como `<Card>` ou `<Tooltip>`) serão agnósticos e compartilhados entre sistemas, mas a composição e os dados exibidos neles mudarão conforme a lógica do sistema selecionado.

#### Fase 1.1: Estruturação Base e Cards
- [x] Aplicar estruturação completa usando componentes isolados do shadcn/ui.
- [x] Refatorar os "God Cards" (Painéis gigantes) em componentes reutilizáveis (`<Card>`, `<CardHeader>`, `<CardContent>`).

#### Fase 1.2: Feedback Visual (Toasters)
- [x] Instalar o componente auxiliar de `Toast`/`Toaster` do shadcn.
- [x] Substituir os alertas nativos do navegador (`alert()`) por Notificações (`Toast`) em ações como "Personagem Salvo", "Falha de Login", "Exclusão".

#### Fase 1.3: Sobreposição e Interatividade (Dialogs)
- [x] Implementar `Dialog` (Modais) para interações intrusivas, que exigem que o usuário feche a tela antes de continuar. (Ex: Editar Atributos, Confirmar Exclusão).
- [x] Adequar o `SpellsDrawer` ou componentes similares para uma experiência modal consistente.

#### Fase 1.4: Contexto e Informativos (Tooltips)
- [x] Implementar `Tooltip` não intrusivos para informações auxiliares de UI. (Ex: Mostrar o cálculo matemático exato que compôs a CA ou Limiar de Sanidade ao passar o mouse).

#### Fase 1.5: Character Sheet Polish e Status Avançados
- [x] Adicionar suporte a Vida Temporária (`hpTemp`) e Mana (`manaCurrent`/`manaMax`).
- [x] Abstrair o Header Fixo do Personagem para melhor reutilização (`CharacterHeader.tsx`).

### Fase 2: Gestão de Formulários e Validações
Remover os estados manuais excessivos e delegar a estabilidade para bibliotecas prontas (`react-hook-form` e `zod`).

#### Fase 2.1: Instalação e Componentes Base
- [x] Instalar `react-hook-form`, `zod` e `@hookform/resolvers/zod`.
- [x] Incorporar componentes do Shadcn UI (`Form`, `FormControl`, `FormField`, `FormItem`, `FormLabel`, `FormMessage`).

#### Fase 2.2: Refatoração do Componente Genérico de Login
- [x] Converter o estado flexível (`useState` livre) do `LoginForm.tsx` num ecossistema tipado Zod.
- [x] Validar formato do email e min/max de senha direto no form.

#### Fase 2.3: Schemas Zod de Domínio (Opcional antecipado)
- [x] Criar arquivo `src/systems/dnd5e/schemas.ts`.
- [x] Abstrair a tipagem `DnD5eCharacterData` para um Schema Zod de validação de Formulário rigorosa.

#### Fase 2.4: Criação de Personagem Tipada (New Character Page)
- [x] Refatorar a página `app/characters/new/page.tsx` para usar o React Hook Form.
- [x] Desdobrar o objeto Character e conectar todo `Input` ao sistema do react-hook-form (substituindo onChange manuais).

### Fase 3: Data Fetching e Arquitetura Next.js (App Router)
Eliminar a dependência de `useEffect` para carregar dados vitais nas páginas principais e abraçar o polimorfismo de UI.
- [ ] Reestruturar as URLs para suportar múltiplos sistemas com Pastas Dinâmicas (`app/system/[system_name]/character/[id]`). 
  - **Estrutura Proposta:**
    ```text
    app/
    ├── characters/
    │   └── new/
    │       └── page.tsx      <-- Criação unificada
    └── system/               <-- Raiz para todos os diferentes RPGs
        └── [system_name]/    <-- dnd5e, coc, etc.
            └── character/    <-- Visualização da ficha
                └── [id]/
                    ├── page.tsx  <-- Agregador (Server Component)
                    └── loading.tsx
    ```
- [ ] Atualizar todos os `Links` e roteamentos (`router.push`) espalhados pelo frontend e componentes para respeitar a injecao de `[system_name]`. Exemplo: `/characters/${c.id}` vira `/system/${c.system || 'dnd5e'}/character/${c.id}`.
- [ ] Atualizar o retorno do Endpoint `/api/characters` (e demais) se necessário para sempre incluir o `system`.
- [ ] Utilizar a página `page.tsx` agregadora como Server Component puro para realizar os `awaits` de banco de dados e passar para a View.
- [ ] Implementar estados de Loading com o arquivo nativo `loading.tsx` do Next.js, substituindo os retornos manuais de `<p>Carregando...</p>` por "Skeletons" focados daquela aba de ficha.
- [ ] Refatorar as chamadas para a API de manipulação (criação e deleção) em **Server Actions** (`actions.ts`).

### Fase 4: Decomposição de Componentes Gigantes ("God Components")
Dividir para conquistar. Ao mover para `[system_name]`, precisaremos dos componentes isolados daquele sistema.
- [ ] Criar pastas `_components/` dentro de cada sistema suportado (`app/system/[system_name]/_components/`).
- [ ] Implementar um componente de "Fábrica" no `page.tsx` principal de layout da ficha daquele sistema para fazer switch seguro (ou apenas assumir um client component de root daquele sistema).
- [ ] Recortar os sub-layouts do sistema D&D 5e (atualmente na raiz de detalhes em +500 linhas) em "Feature Components" nas suas repectivas pastas `_components/`:
  - `CharacterHeader.tsx` (Apresentação geral, Nível)
  - `CombatStats.tsx` (CA, Vida, etc)
  - `AttributesSection.tsx`
- [ ] Abstrair o estado global complexo do Personagem, como reações na UI, em um Contexto ou Contextos menores (`useReducer`).

---

## Boas Práticas Acordadas
- **Server-First:** Toda página que depende de dados do banco tentará primeiro ser um Server Component e buscar a informação de maneira "awaited".
- **Sem Cores Diretas:** Qualquer necessidade de cor deve referenciar uma cor temática do arquivo Tailwind (`primary`, `muted`, `background`).
- **Formulários Protegidos:** Nenhum "submit" será enviado à API sem antes passar pelo crivo do cliente via `Zod`.
