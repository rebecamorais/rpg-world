# Plano de Integração: Autenticação Google OAuth (Auth.js)

Este documento detalha os passos arquiteturais para substituir o login arbitrário atual por um sistema seguro via Google OAuth2, garantindo unicidade de e-mail e username, expiração de sessão e proteção de rotas privadas.

## 1. Configuração e Dependências
Esta etapa prepara o terreno para gerenciar a sessão de forma segura com Cookies HTTP-Only.

- **1.1. Instalação do NextAuth:** Instalar o pacote oficial `next-auth` (versão compatível com o App Router).
- **1.2. Variáveis de Ambiente:** Adicionar suporte às chaves `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` e `NEXTAUTH_SECRET` (gerado aleatoriamente para criptografar as sessões) em um arquivo `.env.local`.

## 2. Refatoração do Domínio (Tipos e Repositório)
Preparar nossa base local para entender que os usuários agora são atrelados a um e-mail.

- **2.1. Expansão da Interface `User`:** Atualizar `src/types/user.ts` para exigir o atributo `email`, mantendo `username` como identificador único na aplicação.
- **2.2. Atualização do `memory-store.ts`:**
  - Adicionar a função `getUserByEmail(email: string)`.
  - Atualizar os métodos de criação/atualização para garantirem que não existem dois e-mails ou relacionarem propriedades do login social.

## 3. Configuração do Provedor de Autenticação
Estabelecer a ponte do Next.js com o Google.

- **3.1. Arquivo Coração do Auth (`auth.ts` / API Route):** Configurar o `GoogleProvider` dentro da sub-rota oculta `/api/auth/[...nextauth]/route.ts`.
- **3.2. Configuração de Callbacks:** 
  - Interceptar o Callback `signIn`: Verificar se o e-mail retornado pelo Google já está registrado no nosso `memory-store`.
  - Interceptar o Callback `session`: Injetar informações úteis do usuário na sessão ativa do cliente (como o ID e o `username` do RPG World).

## 4. Interfaces e Fluxos de Usuário (Frontend)
Criar as interfaces visuais para gerir as pontas soltas da conta do Google.

- **4.1. Refatoração do `LoginForm.tsx`:** Remover campos arbitrários de Username e Senha. Transformar em um painel limpo com um botão "Entrar com Google" (conectado via `signIn('google')`).
- **4.2. Rota de Onboarding (`app/register/page.tsx`):**
  - **Problema:** O Google fornece Nome e E-mail, mas nossa aplicação exige um `username` único (ex: `rebeca123`) para ser dono de fichas.
  - **Solução:** Se o usuário fizer login pelo Google e for a primeira vez (não constar na base), ele é redirecionado para esta tela intermediária.
  - **Ação:** Ele escolhe um `username` disponível, confirmando o cadastro final.

## 5. Proteção de Rotas (Middleware)
Blindar as áreas privadas contra acessos anônimos.

- **5.1. Implementação do `middleware.ts`:**
  - Direcionar usuários não autenticados que tentarem acessar `/characters`, `/characters/new` ou `/characters/[id]` de volta para a rota base `/login`.
  - Garantir que a camada de rotas ocultas (`/api/characters`) valide se há token de sessão válido antes de modificar fichas.
- **5.2. Substituição do Context API:** Como o Auth.js já tem o provedor de sessão seguro dele (`useSession`), poderemos desativar o provedor local simulado (`UserContext.tsx`).
