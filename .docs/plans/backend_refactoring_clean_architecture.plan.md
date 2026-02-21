---
name: Plano de Refatoração Backend (Clean Architecture, DDD e SOLID)
overview: "Diretrizes e planejamento para estruturar a camada de backend do RPG World utilizando Clean Architecture, Domain-Driven Design (DDD) e princípios SOLID, preparando para múltiplos sistemas de RPG e persistência."
todos:
  - id: br1-core-domain
    content: BR1 – Core Domain (Entidades abstratas Character, Value Objects base como Attributes e HP)
    status: unstarted
  - id: br2-dnd5e-domain
    content: BR2 – D&D 5e Domain (DnD5eCharacter, lógicas de modificadores e proficiências)
    status: unstarted
  - id: br3-application-ports
    content: BR3 – Application & Ports (Casos de Uso, interfaces para Repositórios e Serviços Externos)
    status: unstarted
  - id: br4-infrastructure
    content: BR4 – Infrastructure & Adapters (Repositórios em Memória, Clientes de API Externa isolados)
    status: unstarted
  - id: br5-interfaces-nextjs
    content: BR5 – Interfaces (Controllers API do Next.js e Injeção de Dependência)
    status: unstarted
isProject: false
---

# Plano de Refatoração: Backend com Clean Architecture & DDD

Este documento define a arquitetura para o **backend** do projeto RPG World. Com o objetivo de suportar dezenas de sistemas de RPG diferentes (D&D 5e, Pathfinder, Tormenta, etc.) e regras complexas de negócio, adotaremos **Clean Architecture**, **Domain-Driven Design (DDD)** e princípios **SOLID**.

## 1. Princípios Arquiteturais

- **Independência de Framework:** A lógica de negócio (Calculo de Modificadores, Bônus de Proficiência, etc) não deve saber que o Next.js existe.
- **Isolamento de Banco de Dados:** A aplicação não deve depender de como os dados são salvos. Usaremos a abstração de Repositórios.
- **SOLID:** 
  - *Single Responsibility*: Cada classe/função tem apenas uma responsabilidade (ex: `GetCharacterUseCase` apenas busca).
  - *Open/Closed*: Fácil adicionar novos sistemas de RPG sem alterar a entidade base do `Character`.
  - *Dependency Inversion*: Controllers dependem de abstrações (Interfaces de Use Case/Repositórios), não de implementações concretas de Banco de Dados.

## 2. Estrutura de Diretórios (Contextos Delimitados - Bounded Contexts)

A separação ocorrerá por **Domain Contexts**, como `characters`, `users`, `campaigns`. Dentro de cada contexto, seguiremos as 4 camadas da Clean Architecture:

```text
src/backend/
└── contexts/
    └── characters/
        ├── domain/           # Camada mais interna (Não conhece NADA de fora)
        │   ├── entity/       # CharacterBase abstrato
        │   ├── value-object/ # Atributos (STR, DEX), HP, XP
        │   └── repository/   # Interfaces (CharacterRepo)
        ├── application/      # Regras de fluxo de negócio
        │   ├── use-cases/    # CreateCharacter, LevelUpCharacter, TakeDamage
        │   ├── ports/        # Interfaces para o mundo externo (ex: ISpellProvider)
        │   └── services/     # Serviços de domínio orquestrados
        ├── infrastructure/   # Integrações externas (Banco, APIs)
        │   ├── repositories/ # InMemoryCharacterRepo, SupabaseCharacterRepo
        │   └── external/     # Implementações dos Ports (ex: DnD5eSpellProvider)
        └── interfaces/       # Ponto de entrada (Adaptadores)
            ├── controllers/  # CharacterController (Interpreta Request/Response)
            └── dtos/         # Validadores (Zod) e formatadores
```

> **Nota sobre `external/`:** Como apontado, sistemas de RPG diferentes terão dependências externas diferentes. A camada de *Application* deve definir `Ports` (interfaces TypeScript puras como `ISpellProvider`), e a camada de *Infrastructure* implementa o adaptador `DnD5eSpellProvider` que chama a `dnd5eapi`. O caso de uso nunca sabe qual API REST está sendo chamada.

## 3. Padrões de Domínio (DDD)

### A Entidade Base de Personagem

Como teremos múltiplos sistemas, usaremos herança ou composição. Devido a limitações de conflitos de palavras reservadas, usaremos `characterClass` em vez de `class`.

```typescript
export abstract class Character {
    id: string;
    name: string;
    system: string; // ex: 'DnD_5e'
    ownerUsername: string;
    
    constructor(id: string, name: string, system: string, ownerUsername: string) {
        this.id = id;
        this.name = name;
        this.system = system;
        this.ownerUsername = ownerUsername;
    }

    // Métodos de domínio encapsulados
    abstract levelUp(): void;
    abstract takeDamage(amount: number): void;
}
```

### O Personagem de D&D 5e

As regras específicas do sistema de D&D 5e (Atributos, Perícias, Salvaguardas, Classe) vivem apenas nos agregados específicos desse sistema.

```typescript
export class DnD5eCharacter extends Character {
    characterClass: string; // Usando characterClass no lugar de class
    race: string;
    level: number;
    hp: HealthPoints;       // Value Object
    attributes: Map<AttributeKey, number>;

    // ... regras encapsuladas (ex: calcular modificadores ao ser construído)
}
```

## 4. O Fluxo de Execução (Use Cases)

A Controller (`app/api/characters/[id]/route.ts`) recebe a requisição Next.js, mas logo repassa para a controller isolada no backend, que chama um **Caso de Uso**.

1. **Route Handler (Next.js):** Pega os `params.id`.
2. **Controller (`CharacterController`):** Constrói as dependências (Injeta o Repositório no Use Case) e dispara a ação.
3. **Use Case (`GetCharacterUseCase`):** Pede ao repositório pelo ID. Se não achar, lança um erro de domínio (`CharacterNotFoundError`). Retorna a entidade.
4. **Controller:** Converte a Entidade para JSON (`NextResponse.json()`).

## 5. Etapas de Migração na Prática

- **BR1 – Core Domain:**
  Construir as raízes independentes do RPG. Criar `Value Objects` como `Attributes` (baseado em Map/Dicionário genérico) e `HealthPoints`. Criar a classe `Character` base abstrata.
  
- **BR2 – D&D 5e Domain:**
  Criar a entidade estendida `DnD5eCharacter`. Movimentar toda a lógica de `calculations.ts` para dentro do seu domínio coeso. A interface visual React passará a não entender as contas.
  
- **BR3 – Application & Ports:**
  Criar os `UseCases` para as 4 operações de CRUD. Criar os `Ports` (`CharacterRepo` e `ISystemProvider` ou algo abstrato onde componentes de magia podem habitar perante requisição).

- **BR4 – Infrastructure & Adapters:**
  Mover logicamente nosso store local atual para fechar a interface em `InMemoryCharacterRepository`. Aqui nasce o client da D&D API (`DnD5eAPIClient`) implementando o port criado no BR3.
  
- **BR5 – Interfaces Next.js:**
  Apagar chamadas client-side de estado mutável. Criar `app/api/...` consumindo os `Controllers` puros que disparam `Use Cases`. Confinar segurança (ownership check) também na controller.
