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
- **Cache sob Demanda (Lazy Loading) de API Externa:** Sincronizar dados da dnd5eapi.co com o nosso banco. Quando um usuário buscar uma magia, procurar primeiro no DB local; se não existir, fazer fetch na API, salvar no DB enriquecendo (ex: traduções?) e retornar, aumentando a resiliência e diminuindo a latência.

## UX/UI
- Otimizar acessibilidade (A11y): navegação via teclado sólida e compatibilidade com leitores de tela em elementos interativos (`Dialogs`).
- Adicionar sons de interface sutis (SFX) para interações críticas (como uma rolagem de acerto crítico).
- Switch de Tema (Modo Escuro / Claro / Sistema) acoplado diretamente as variáveis criadas.

## Segurança Legal e Conteúdo (SRD 5.1 & Safe Harbor)
- **Revisão de Conteúdo SRD vs Próprio:** Garantir que o sistema forneça apenas ferramentas e regras mecânicas SRD (CC-BY-4.0), evitando colisão com PI da Wizards (Distribuir subclasses pagas, Drizzt, Mind Flayers, Beholders, etc).
- **Categorização de Source (Fonte):** O banco de dados deve sinalizar a origem do dado (Ex: `source: 'SRD'` ou `source: 'Custom/User'`). Essencial para diferenciar o conteúdo fornecido pela plataforma vs conteúdo do usuário.
- **Abstração "Homebrew":** Rotular conteúdos criados e compartilhados pelos usuários como "Homebrew", reforçando que são produções privadas não-oficiais, mantendo nosso status de ferramenta/utilitário.
- **BYOD (Bring Your Own Data) & Isolamento:** Permitir e incentivar que os usuários insiram seus próprios textos de habilidades. Manter esse conteúdo dos usuários isolado do motor em `src/systems/dnd5e/`, focando na plataforma e não na distribuição de material.
- **Termos de Uso (Checkbox):** Na Fase 10 (Auth), implementar checkbox de Termos de Uso explícito onde o usuário concorda em não inserir conteúdo protegido por direitos autorais para fins de distribuição pública, nos garantindo Safe Harbor e isenção de provedor.
- **Disclaimer Legal:** Adicionar no rodapé/aba "About" explícito de que a aplicação utiliza SRD 5.1 sob licença Creative Commons.
