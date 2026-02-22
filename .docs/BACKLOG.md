# Backlog RPG World

Ideias e melhorias futuras para não perdermos o foco na Sprint atual. Um repositório de pensamentos e funcionalidades para evoluir o sistema organicamente.

## Features
- Rolar dados 3D na tela (Integração com Three.js ou DDF).
- Chat em tempo real para as mesas de RPG com Socket.io ou canais Supabase.
- Rolagem de ataques e dano integrada diretamente das armas no inventário.

## Sistemas
- Implementar ficha de **Call of Cthulhu** - Vou ter que jogar uma campanha pra entender as regras kakak
- Implementar ficha de **Pathfinder 2e**
- Implementar ficha de **Tormenta20**
- Implementar ficha de **Ordem Paranormal** - Daniel vai ficar loko

## Infra
- [Fase 10] Migrar do repositório `MemoryStore` atual para um banco de dados real via **Supabase** (PostgreSQL).
- Implementar Autenticação completa e segura (OAuth/Github/Google via Supabase Auth ou NextAuth).
- Configuração de CI/CD para automação de deploy (Vercel ou Github Actions).

## UX/UI
- Otimizar acessibilidade (A11y): navegação via teclado sólida e compatibilidade com leitores de tela em elementos interativos (`Dialogs`).
- Adicionar sons de interface sutis (SFX) para interações críticas (como uma rolagem de acerto crítico).
- Switch de Tema (Modo Escuro / Claro / Sistema) acoplado diretamente as variáveis criadas.

## Segurança Legal e Conteúdo (SRD 5.1)
- **Revisão de Conteúdo SRD vs Próprio:** Garantir que o sistema forneça apenas ferramentas e regras mecânicas SRD (CC-BY-4.0), evitando PI da Wizards (Drizzt, Mind Flayers, Beholders, etc).
- **BYOD (Bring Your Own Data):** Permitir e incentivar que os usuários insiram seus próprios textos de habilidades e magias, configurando o projeto estritamente como um utilitário (VTT light).
- **Isolamento de Dados:** Manter os dados sensíveis separados do motor em `src/systems/dnd5e/`, para higienização rápida se necessário.
- **Disclaimer Legal:** Adicionar no rodapé/aba "About" de que a aplicação utiliza SRD 5.1 sob licença Creative Commons.
