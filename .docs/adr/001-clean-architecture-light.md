# ADR-001: Clean Architecture Light no Frontend e Repositórios Abstratos

## Contexto
O Next.js (com App Router) permite e muitas vezes encoraja misturar a busca/persistência de dados diretamente nas lógicas de renderização (Server Components) e actions, o que pode causar forte acoplamento do sistema de DB à interface.

## Decisão
Optamos por usar uma variante simplificada de Clean Architecture utilizando *Use Cases*, *Services* e *Repositories* baseados em interfaces (TypeScript) no backend do projeto (mesmo rodando em SSR/Actions).

## Consequências
- **Positivas**: 
    - A migração futura para Supabase não afetará os Use Cases nem o Frontend. Só exigirá escrever uma classe nova que imite a interface do Repository.
    - Isola firmemente as regras de negócio.
- **Negativas**:
    - Leve aumento na quantidade de arquivos iniciais.
    - Curva de aprendizado para quem não está acostumado com padrões de inversão de dependência.
