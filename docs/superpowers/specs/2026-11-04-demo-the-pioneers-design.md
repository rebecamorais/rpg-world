# Demo pública `/demo`: campanha The Pioneers

## Intenção

Quem ainda não tem conta precisa ver o RPG World funcionando antes de se cadastrar. `/demo` abre sem login, dentro de uma campanha de exemplo, com as telas reais do app. O objetivo é que a pessoa **crie uma conta e comece a usar**.

O elenco é a coleção **Women Who Changed History**: 13 personagens de fantasia inspiradas em mulheres reais. Além de mostrar o produto, a demo é uma homenagem e uma pequena descoberta histórica.

## Objetivos

- `/demo` abre sem login e cai na campanha The Pioneers, na tela real da mesa, visão de mestre, aba Role Play.
- A pessoa navega pela mesa, fichas completas, NPCs e baú.
- Nada do que ela faz é salvo. Tentar salvar leva ao convite para criar conta.
- O aviso de demo e o botão "Criar conta" ficam sempre visíveis.
- Colocar uma feature nova na demo deve ser, em geral, acrescentar dados ao catálogo.

## Fora da primeira versão

- Diário (usa Google Doc real) e combate (usa tempo real do Supabase).
- Tela de abertura ou galeria própria da demo (opção B, descartada).
- Trocar os poucos textos de exemplo do app logado (`aria_the_bold`, "Thursday night table").

## O que seria um fracasso

- Um visitante conseguir escrever qualquer coisa no banco ou agir sobre uma conta.
- Abrir a demo derrubar ou substituir a sessão de quem já tem conta.
- O visitante não conseguir chegar à tela de cadastro a partir da demo.
- A demo virar uma cópia das telas que precisa ser mantida à parte.
- Ficção apresentada como fato histórico, ou sugestão de endosso por pessoas reais ou famílias.

## Como funciona

Decidido com a Rebeca: a experiência parece um autologin e abre na opção A, igual ao app, sem usuário real e sem sessão. A demo é **somente leitura**, sem persistir alterações.

- **Edição:** os campos ficam desligados, reaproveitando o modo só leitura. Botões de ação que continuarem visíveis, como salvar e ações de mestre, abrem o convite para criar conta; nenhum dispara uma chamada real.
- **Entrada:** botão "Ver demo" na página inicial e em `/features`, sem exigir login. `/demo` fica com `noindex` e fora do sitemap até as revisões terminarem (decisão de Claude).

- **Por que sem usuário real:** uma sessão no navegador falaria direto com o Supabase, exigindo bloqueio em cada tabela. Também teria que bloquear troca de senha e exclusão de conta, e o `proxy.ts` manda logados de `/login` e `/register` para `/characters`, o que impediria o cadastro. Além disso, a sessão poderia substituir a de quem já tem conta.
- **Dados:** catálogo tipado no código, sem migration e sem nada no banco de produção. Os tipos são os mesmos das telas reais, para o TypeScript acusar quando o formato mudar.
- **Telas:** reaproveitar os componentes reais. Pontos de partida: `ApiClient` (`src/frontend/lib/api-client/apiClient.ts`), TanStack Query, `SeededQuery` e o modo só leitura da ficha (`useSheetSource`, `SheetFieldset`).
- **Rotas:** as telas têm links fixos como `/characters` e `/parties/:id`. O sidebar, as fichas e a navegação precisam continuar dentro de `/demo`. Cabe ao plano medir e escolher a forma mais simples.
- **Layout:** `/demo` não pode passar pelo redirect para login do layout do dashboard. Não deve exibir perfil de usuário nem "Sair".
- **Sem efeitos externos:** sem chamadas às APIs autenticadas nem canal Realtime a partir da demo.
- **Quem já está logado:** vê a mesma demo, sem que a sessão seja alterada. No lugar de "Criar conta", o botão leva de volta ao app (decisão de Claude).

## Elenco

**Na mesa (6 personagens):** Ada, Grace, Katherine, Hedy, Mirela e Maren.
**NPCs com ficha e história (7):** Joan, Ching Shih, Nzinga, Hypatia, Florence, Boudica e Mary. (Divisão proposta por Claude, sem objeção da Rebeca.)

Cada personagem tem dois conjuntos de dados **separados também no código**, pedido da Rebeca para que o lore nunca seja apresentado como biografia real:

- **Inspiração histórica:** nome real, período, contribuição documentada e fontes.
- **Personagem de fantasia:** nome, título, classe, lore, personalidade, item característico, imagem e cor.

Níveis, atributos, magias e inventário são criados na implementação, coerentes com a classe e usando só conteúdo que o app já tem.

| Personagem                                   | Título                     | Classe          | Cor · cenário                           | Personalidade                          | Item                        | Imagem                        |
| -------------------------------------------- | -------------------------- | --------------- | --------------------------------------- | -------------------------------------- | --------------------------- | ----------------------------- |
| Ada Lovelace                                 | The Arcane Architect       | Artífice        | Violeta · oficina arcana                | curiosa, metódica, visionária          | The Analytical Engine       | `arcane-architect.webp`       |
| Katherine Johnson                            | The Celestial Navigator    | Maga            | Azul celestial · observatório           | determinada, precisa, compassiva       | Celestial Astrolabe         | `celestial-navigator.webp`    |
| Grace Hopper                                 | The Code Admiral           | Guerreira       | Verde-petróleo · biblioteca naval       | pragmática, espirituosa, corajosa      | The Admiral's Blade         | `code-admiral.webp`           |
| Hedy Lamarr                                  | The Whispering Frequency   | Barda           | Rubi · salão encantado                  | engenhosa, carismática, independente   | The Resonant Lyre           | `whispering-frequency.webp`   |
| **Maren Hamilton** (insp. Margaret Hamilton) | The Horizon Pathfinder     | Patrulheira     | Âmbar · torre de navegação              | estratégica, disciplinada, resiliente  | The Horizon Compass         | `horizon-pathfinder.webp`     |
| Joan of Arc                                  | The Golden Oath            | Paladina        | Ouro sagrado · catedral medieval        | idealista, destemida, leal             | The Banner of Dawn          | `golden-oath.webp`            |
| **Mirela Pardan** (insp. Radia Perlman)      | The Rootweaver             | Druida          | Verde-floresta · floresta ancestral     | paciente, inventiva, observadora       | Staff of the Living Network | `rootweaver.webp`             |
| Ching Shih                                   | The Steel Tide             | Ladina          | Azul aço · porto pirata                 | calculista, autoritária, astuta        | The Tidecutter              | `steel-tide.webp`             |
| Queen Nzinga                                 | The Copper Sovereign       | Monja           | Cobre · templo de treinamento           | diplomática, determinada, estrategista | The Sovereign's Staff       | `copper-sovereign.webp`       |
| Hypatia                                      | The Lunar Scholar          | Feiticeira      | Lilás lunar · Biblioteca de Alexandria  | racional, independente, contemplativa  | The Lunar Sphere            | `lunar-scholar.webp`          |
| Florence Nightingale                         | The Keeper of Light        | Clériga         | Marfim e dourado · santuário de cura    | empática, rigorosa, persistente        | The Everlasting Lantern     | `keeper-of-light.webp`        |
| Boudica                                      | The Ember Queen            | Bárbara         | Terracota · campo de batalha celta      | feroz, orgulhosa, protetora            | The Rebel's Spear           | `ember-queen.webp`            |
| Mary Shelley                                 | The Spark of the Forbidden | Bruxa (Warlock) | Turquesa espectral · laboratório gótico | introspectiva, criativa, questionadora | The Galvanic Grimoire       | `spark-of-the-forbidden.webp` |

As imagens estão em `C:\Users\rebec\Pictures\RPGWorld\NPC-The-Pioneers` (no WSL, `/mnt/c/Users/rebec/Pictures/RPGWorld/NPC-The-Pioneers`). Os arquivos já foram renomeados com o título de fantasia de cada personagem, sem nomes reais e sem acento, e vão para `public/` com esses nomes. A subpasta `png` manteve os nomes originais e não entra no repositório.

### Lore (EN, fonte; a versão pt é traduzida na implementação)

- **Ada:** Ada sees patterns where others see chaos. In her secluded workshop, she crafts intricate arcane mechanisms capable of performing calculations, predicting movements, and bringing impossible inventions to life. She believes every mystery in the universe hides a language waiting to be understood.
- **Katherine:** Katherine has devoted her life to understanding the movements of the heavens. From her observatory above the clouds, she charts celestial pathways that even the greatest explorers fear to follow. When the stars fall silent, she trusts her calculations to guide lost travelers safely home.
- **Grace:** Admiral Grace commands with discipline, wit, and an unshakable belief that every problem has a solution. A veteran of countless naval expeditions, she studies ancient battle formations and transforms complicated strategies into orders her entire fleet can understand. Her greatest weapon is not her sword, but her ability to turn confusion into action.
- **Hedy:** Behind Hedy's captivating performances lies a brilliant inventor. She has mastered the art of sending secret messages through shifting melodies, allowing allies to communicate without being discovered. Her enchanted instrument can turn a whispered song into a message carried across an entire kingdom.
- **Maren:** Maren is the guardian of journeys beyond the known world. She maps dangerous passages between distant realms and prepares for disasters long before they occur. Her meticulous planning has saved countless expeditions, proving that the greatest explorers are those who know how to bring everyone home.
- **Joan:** Joan was once an ordinary young woman who answered a call no one else could hear. Guided by an unwavering sense of purpose, she took up a sword to defend her people against overwhelming odds. Her courage inspires even the most frightened soldiers to stand together when hope seems lost.
- **Mirela:** Deep within the ancient forest, the Rootweaver tends a vast network of living roots connecting distant groves. She has learned to guide their growth so that messages and vital energy can travel without becoming trapped in endless loops. To her, harmony is not silence, but the art of keeping every living connection in balance.
- **Ching Shih:** Ching Shih rules the coastal waters through intelligence, discipline, and a network of loyal captains. Once underestimated by powerful naval commanders, she united rival crews beneath a single code. Her enemies fear her cunning more than her blades, for she always seems to know their plans before they set sail.
- **Nzinga:** Queen Nzinga is a master of discipline, diplomacy, and resistance. Within her fortified sanctuary, she trains guardians to defend their homeland through patience, agility, and unwavering resolve. She knows that victory is not always won through force; sometimes the most powerful strike is the one an enemy never sees coming.
- **Hypatia:** Hypatia was born with an unusual sensitivity to the rhythms of the cosmos. Through years of study, she learned to channel this natural gift into celestial magic. Within the great library, she protects forgotten knowledge and teaches that wisdom grows through curiosity, reason, and the courage to question.
- **Florence:** When war and disease devastated the surrounding kingdoms, Florence transformed an abandoned sanctuary into a refuge for the wounded. Carrying her lantern through the darkest nights, she combines healing magic with careful observation and compassionate care. Her work has taught generations that saving lives requires both knowledge and kindness.
- **Boudica:** Boudica rose against an empire that sought to crush her people. With fire in her heart and a fierce determination to defend her homeland, she united scattered tribes into a formidable rebellion. On the battlefield, her presence is like a storm: wild, relentless, and impossible to ignore.
- **Mary:** Mary has always been fascinated by the boundary between life and death. After discovering an ancient source of spectral energy, she entered a mysterious pact to uncover its secrets. Now, within her storm-lit laboratory, she studies the consequences of creation, asking whether those who bring life into the world are prepared to care for it.

## Meet the Inspiration e aviso

Seção na ficha com fatos documentados, sem copiar textos biográficos, e links para as fontes. Junto, o aviso da coleção:

**EN:** Meet the women who inspired a world of adventure. This collection celebrates remarkable women from history, science, technology, literature, and leadership through original fantasy reinterpretations. Each character is inspired by a historical figure, but her abilities, equipment, adventures, and fictional biography belong to the RPG World fantasy setting. These characters are fictional tributes, not historically accurate portrayals or official endorsements.

**PT:** Conheça as mulheres que inspiraram um mundo de aventuras. Esta coleção celebra mulheres extraordinárias da história, ciência, tecnologia, literatura e liderança por meio de interpretações originais de fantasia. Cada personagem é inspirada em uma figura histórica, mas suas habilidades, equipamentos, aventuras e biografia fictícia pertencem ao universo de fantasia do RPG World. Essas personagens são homenagens fictícias, não representações historicamente precisas ou endossos oficiais.

## Licença e pessoas reais

- **Artífice:** não está nas opções do app. Ada usa "Artífice" como classe em texto livre, com habilidades originais e nada copiado de livros (decisão de Claude).
- **Regras:** magias, itens e condições vêm do conteúdo já licenciado em `content/`, seguindo os créditos do `NOTICE.md`.
- **Margaret Hamilton** faleceu em setembro de 2026 (as fontes divergem sobre o dia). Vira **Maren Hamilton**, escolha da Rebeca.
- **Radia Perlman** está viva, segundo a Rebeca. Vira **Mirela Pardan**, anagrama exato. O retrato foi refeito para ser visualmente distinto. O nome real aparece só em Meet the Inspiration.
- **Hedy Lamarr, Katherine Johnson e Margaret Hamilton:** falecidas há relativamente pouco tempo; possíveis direitos de personalidade pós-morte e de herdeiros.
- **Imagens:** geradas com ChatGPT (OpenAI Image Generation), com prompts personalizados e referências históricas. Uso apenas como elementos visuais da demo. A Rebeca entende que os termos da OpenAI permitem, em geral, uso público e comercial, e que a proteção autoral pode ser limitada conforme o país.

**Obrigatório antes do merge:** a Rebeca revisa o conteúdo e cada retrato, em especial os de Radia e Margaret, e confirma as políticas da OpenAI sobre pessoas reais. Um retrato reprovado não entra no repositório, e a personagem usa o retrato padrão do app. Revisão jurídica é opcional, a critério dela.

## Idiomas

Textos da demo em en e pt, os dois idiomas ativos em `src/i18n/routing.ts`. Outros idiomas seguem pelo Crowdin quando forem ativados.

## O que fica para quem constrói

Estrutura do catálogo, forma de manter as rotas em `/demo`, atributos e inventário das fichas, conteúdo do baú, textos históricos com fontes, tradução pt do lore e o texto do convite para criar conta.
