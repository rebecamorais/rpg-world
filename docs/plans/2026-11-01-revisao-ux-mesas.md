# Revisão de UX: mesas, combate e NPCs

**Data:** 2026-11-01
**Status:** entregue ([#128](https://github.com/rebecamorais/rpg-world/issues/128)); o NPC aliado no combate veio depois, em `feat/melhorias-mapeadas`.
**Origem:** revisão das telas depois das fases 1 e 2 das mesas ([#124](https://github.com/rebecamorais/rpg-world/issues/124)–[#126](https://github.com/rebecamorais/rpg-world/issues/126)), com prints no desktop
(1440px) e no celular (390px), como mestre e como jogador.

## Decisões

- **Configurações da mesa numa página própria** (`/parties/[id]/settings`, só o mestre): convite,
  link, jogadores, nome e apagar saem de baixo do combate. Na barra lateral, a mesa aberta ganha o
  submenu "Mesa" / "Configurações", no mesmo estilo das abas da ficha; no celular, um botão no
  topo da página da mesa leva até lá. Os pedidos para entrar continuam na página da mesa.
- **Personagens e NPCs em abas** (`/characters` e `/characters/npcs`): "Fichas de inimigo" vira
  "Meus NPCs". `/enemies` redireciona para a aba. O card do NPC não mostra a classe padrão
  ("Aventureiro"). O NPC aliado no combate fica para outro PR (mexe no banco).
- **Combate no celular:** campos de iniciativa e PV com 44px em tela de toque; os botões de
  subir/descer/tirar com espaço para a área de toque de 44px não se sobrepor. PV temporário com
  rótulo visível; iniciativa vazia mostra "—". O link para os NPCs vira botão.
  "Adicionar personagens da mesa" some quando todos já estão no combate.
- **A vez do jogador:** um aviso (toast) quando a vez chega, para quem rolou a página.
- **Navegação:** sai o "Voltar" do topo (sempre ia para /characters); o "Sair" da barra lateral
  some no desktop, onde o topo já tem. No celular continua no menu.
- **/parties:** a mesa inteira é clicável, com seta; "Nova mesa" vai para o fim, numa seção
  própria. Sai o botão "Fichas de inimigo" do topo (os NPCs ficam nas abas de personagens).
- **Rodapé compacto nas páginas logadas:** uma linha com os links legais, GitHub, Discord e
  "Apoiar", que leva para `/support` (Ko-fi, GitHub Sponsors e Pix continuam lá e nas páginas
  públicas).
- Tema continua só escuro.
