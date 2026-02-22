# RPG World 🎲

Um aplicativo web para criação e gestão de fichas de personagens de RPG de mesa, focado inicialmente no sistema **Dungeons & Dragons 5ª Edição**. Projetado para ser rápido, acessível e expansível.

🔗 **Acesse o projeto online:** [rpg-world-nu.vercel.app](https://rpg-world-nu.vercel.app/)

## 🚀 Tecnologias

- **Framework:** Next.js 16 (React 19)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS
- **APIs Externas:** [D&D 5e API](https://www.dnd5eapi.co/) (Magias e recursos adicionais)
- **Banco de Dados/Auth:** Supabase (Planejado / Em andamento), versão inicial com persistência em JSON estrito.

## ✨ Funcionalidades Principais (Fase 1)

O projeto está atualmente focado em fechar sua base funcional com as seguintes metas:

1. **Gestão e Escopo de Contas:** Controle de personagens amarrado à usuários cadastrados (via banco de dados).
2. **Limite de 2 Personagens:** Restrição inicial por usuário para manter o escopo seguro e focado.
3. **Múltiplos Sistemas (Arquitetura):** Código modular para permitir adicionar mais sistemas além do D&D 5e facilmente no futuro.
4. **Ficha Completa em uma Single Page:** Todos os atributos, perícias, salvaguardas, PV, CA e Iniciativa numa tela compacta com suporte para foto de perfil do personagem.
5. **Automação das Regras (D&D 5e):** Cálculo automático e estrito de Modificadores, Bônus de Proficiência e Percepção Passiva a partir de Atributos Base.
6. **Grimório / Magias Integradas:** Um Drawer para consultar, aprender e gerenciar listas de Magias utilizando a API `dnd5eapi.co`, construído de forma que traduza perfeitamente via Google Tradutor (Inglês -> PT-BR).

## 🛠️ Como rodar o projeto localmente

Primeiro, instale as dependências:

```bash
npm install
# ou
yarn install
# ou
pnpm install
```

Depois, rode o servidor de desenvolvimento:

```bash
npm run dev
# ou
yarn dev
# ou
pnpm dev
```

Abra [http://localhost:3000](http://localhost:3000) no seu navegador para ver o resultado.

## 🤝 Próximos Passos

O planejamento completo detalhado, contendo todas as Fases e os prompts de IA geradores da estrutura fundamental pode ser encontrado no nosso plano mestre em `.docs/plans/prompts_por_etapa_rpg_world_b5082e57.plan.md`.

---

Desenvolvido com 💜 por Rebeca.
