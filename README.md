# RPG World 🎲

Copyright (c) 2026 Rebeca Morais Cruz (Rebs Tech Studio). Licenciado sob a GNU GPLv3.

Um aplicativo web para criação e gestão de fichas de personagens de RPG de mesa, focado inicialmente no sistema **Dungeons & Dragons 5ª Edição**. Projetado para ser rápido, acessível e expansível.

🔗 **Acesse o projeto online:** [rpgworldapp.com](https://rpgworldapp.com/)

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

- [Node.js](https://nodejs.org/) 24+
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

### 3. Suba a infraestrutura local (Supabase & Docker)

> O Docker precisa estar rodando antes deste passo.

```bash
npm run infra up
```

Este comando irá subir os containers do Supabase (Dev e Test), configurar os symlinks necessários e gerar as tipagens do banco de dados automaticamente.

Ao finalizar, o terminal exibirá as chaves geradas para o ambiente de **Dev**. Copie os valores para o `.env.local`:

```
API URL        →  SUPABASE_URL            (já configurado como localhost:54321)
Anon key       →  NEXT_PUBLIC_SUPABASE_ANON_KEY
Service role   →  SUPABASE_SERVICE_ROLE_KEY
```

> **Dica:** O ambiente de testes roda na porta **54421** de forma isolada.

### 4. Rode o servidor de desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no navegador.

### URLs do ambiente local

| Serviço              | URL                    |
| -------------------- | ---------------------- |
| Aplicação            | http://localhost:3000  |
| Supabase Studio (UI) | http://localhost:54323 |
| Inbucket (emails)    | http://localhost:54324 |
| Supabase API (Dev)   | http://localhost:54321 |
| Supabase API (Test)  | http://localhost:54421 |

> O **Inbucket** intercepta os emails enviados pelo auth (Magic Link, OTP) localmente — não é necessário um email real para testar.

## 📜 Documentação Interna

Para detalhes técnicos mais profundos, consulte nossos guias:

- [🗺️ Mapa e Estrutura do Projeto](.docs/MAP_AND_STRUCTURE.md) - Guia de navegação por diretórios e arquitetura.
- [🏆 Regras de Ouro & Princípios](.docs/RULES_REFERENCE.md) - Padrões de código, banco de dados e testes.

## 🛠️ Scripts Disponíveis

| Comando              | Descrição                                                    |
| -------------------- | ------------------------------------------------------------ |
| `npm run dev`        | Inicia o servidor de desenvolvimento                         |
| `npm run infra up`   | Sobe Docker, sincroniza pastas e gera tipos                  |
| `npm run infra down` | Para todos os containers da infraestrutura                   |
| `npm run clean`      | Reset total: apaga volumes, recria o banco e limpa o docker  |
| `npm run db:ui`      | Abre o Supabase Studio e o Inbucket no navegador             |
| `npm run test`       | Executa a pipeline completa (Unitários + Infra + Integração) |
| `npm run test:unit`  | Executa apenas os testes unitários                           |
| `npm run test:ui`    | Abre a interface visual do Vitest                            |
| `npm run lint`       | Verifica erros de linting                                    |
| `npm run format`     | Formata o código usando Prettier                             |

---

Desenvolvido com 💜 por Rebeca.

## 📄 Licença

Este projeto está licenciado sob a **GNU GPLv3**. Consulte o arquivo [LICENSE](LICENSE) para obter mais detalhes.

Copyright (c) 2026 Rebeca Morais Cruz (Rebs Tech Studio).
