# RPG World 🎲

Um aplicativo web para criação e gestão de fichas de personagens de RPG de mesa, focado inicialmente no sistema **Dungeons & Dragons 5ª Edição**. Projetado para ser rápido, acessível e expansível.

🔗 **Acesse o projeto online:** [rpg-world-nu.vercel.app](https://rpg-world-nu.vercel.app/)

## 🚀 Tecnologias

- **Framework:** Next.js 16 (React 19)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS
- **APIs Externas:** [D&D 5e API](https://www.dnd5eapi.co/) (Magias e recursos adicionais)
- **Banco de Dados/Auth:** Supabase (Planejado / Em andamento), versão inicial com persistência em JSON estrito.

## ✨ Funcionalidades Principais (Fase 1 Em Desenvolvimento)

O projeto está atualmente focado em fechar sua base funcional com as seguintes metas:

1. **Gestão e Escopo de Contas:** Controle de personagens amarrado à usuários cadastrados (via banco de dados).
2. **Limite de 10 Personagens:** Restrição inicial por usuário para manter o escopo seguro e focado.
3. **Múltiplos Sistemas (Arquitetura):** Código modular para permitir adicionar mais sistemas além do D&D 5e facilmente no futuro.
4. **Ficha Completa em uma Single Page:** Todos os atributos, perícias, salvaguardas, PV, CA e Iniciativa numa tela compacta com suporte para foto de perfil do personagem.
5. **Automação das Regras (D&D 5e):** Cálculo automático e estrito de Modificadores, Bônus de Proficiência e Percepção Passiva a partir de Atributos Base.
6. **Grimório / Magias Integradas:** Um Drawer para consultar, aprender e gerenciar listas de Magias utilizando a API `dnd5eapi.co`, construído de forma que traduza perfeitamente via Google Tradutor (Inglês -> PT-BR).

## 🛠️ Como rodar o projeto localmente

### Pré-requisitos

- [Node.js](https://nodejs.org/) 20+
- [Docker](https://www.docker.com/) (necessário para o banco de dados local)

### 1. Instale as dependências

```bash
npm install
```

### 2. Configure as variáveis de ambiente

Copie o arquivo de exemplo:

```bash
cp .example.env.local .env.local
```

### 3. Suba o banco de dados local (Supabase)

> O Docker precisa estar rodando antes deste passo.

```bash
npm run db:start
```

Ao finalizar, o terminal exibirá as chaves geradas. Copie os valores para o `.env.local`:

```
API URL        →  SUPABASE_URL            (já configurado como localhost:54321)
Anon key       →  NEXT_PUBLIC_SUPABASE_ANON_KEY
Service role   →  SUPABASE_SERVICE_ROLE_KEY
```

> **Dica:** este passo só precisa ser feito **uma vez por sessão**. Enquanto o Docker continuar rodando, o banco permanece ativo.

### 4. Rode o servidor de desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no navegador.

### URLs do ambiente local

| Serviço              | URL                    |
| -------------------- | ---------------------- |
| Aplicação            | http://localhost:3000  |
| Supabase API / Auth  | http://localhost:54321 |
| Supabase Studio (UI) | http://localhost:54323 |
| Inbucket (emails)    | http://localhost:54324 |

> O **Inbucket** intercepta os emails enviados pelo auth (Magic Link, OTP) localmente — não é necessário um email real para testar.

### Scripts disponíveis

| Comando             | Descrição                            |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Inicia o servidor de desenvolvimento |
| `npm run db:start`  | Sobe o Supabase local (Docker)       |
| `npm run db:stop`   | Para os containers do Supabase       |
| `npm run db:status` | Exibe as URLs e chaves do ambiente   |
| `npm run db:reset`  | Reseta o banco e roda as migrations  |
| `npm run db:studio` | Abre o Supabase Studio no browser    |

## 🤝 Próximos Passos

O planejamento completo detalhado, contendo todas as Fases e os prompts de IA geradores da estrutura fundamental pode ser encontrado no nosso plano mestre em `.docs/plans/prompts_por_etapa_rpg_world_b5082e57.plan.md`.

---

Desenvolvido com 💜 por Rebeca.
