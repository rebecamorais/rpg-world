/*
 * The fantasy characters of The Pioneers. Fiction only: nothing here is a biography, and no real
 * name appears in this file (the documented facts live in inspirations.ts).
 */

export interface Bilingual {
  en: string;
  pt: string;
}

export interface Hero {
  slug: string;
  name: string;
  title: string;
  /** Free text class shown on the sheet. */
  className: Bilingual;
  accentColor: string;
  personality: Bilingual;
  /** The signature item. */
  item: Bilingual;
  image: string;
  lore: Bilingual;
  ideals: Bilingual;
  bonds: Bilingual;
  flaws: Bilingual;
  /** At the table (a player character) or an NPC with a sheet. */
  atTable: boolean;
}

export const HEROES: Hero[] = [
  {
    slug: 'ada',
    name: 'Ada Lovelace',
    title: 'The Arcane Architect',
    className: { en: 'Artificer', pt: 'Artífice' },
    accentColor: '#8b5cf6',
    personality: { en: 'Curious, methodical, visionary', pt: 'Curiosa, metódica, visionária' },
    item: { en: 'The Analytical Engine', pt: 'O Motor Analítico' },
    image: 'arcane-architect.webp',
    atTable: true,
    lore: {
      en: 'Ada sees patterns where others see chaos. In her secluded workshop, she crafts intricate arcane mechanisms capable of performing calculations, predicting movements, and bringing impossible inventions to life. She believes every mystery in the universe hides a language waiting to be understood.',
      pt: 'Ada enxerga padrões onde os outros veem caos. Em sua oficina isolada, ela constrói intrincados mecanismos arcanos capazes de fazer cálculos, prever movimentos e dar vida a invenções impossíveis. Ela acredita que todo mistério do universo esconde uma linguagem à espera de ser compreendida.',
    },
    ideals: {
      en: 'Knowledge: every mystery hides a language waiting to be understood.',
      pt: 'Conhecimento: todo mistério esconde uma linguagem à espera de ser compreendida.',
    },
    bonds: {
      en: 'Her workshop and the engine she has not finished dreaming up.',
      pt: 'Sua oficina e o motor que ela ainda não terminou de imaginar.',
    },
    flaws: {
      en: 'Loses track of the hours, and of dinner, when a pattern calls.',
      pt: 'Perde a noção das horas, e do jantar, quando um padrão a chama.',
    },
  },
  {
    slug: 'katherine',
    name: 'Katherine Johnson',
    title: 'The Celestial Navigator',
    className: { en: 'Wizard', pt: 'Maga' },
    accentColor: '#4f8ef7',
    personality: {
      en: 'Determined, precise, compassionate',
      pt: 'Determinada, precisa, compassiva',
    },
    item: { en: 'Celestial Astrolabe', pt: 'Astrolábio Celestial' },
    image: 'celestial-navigator.webp',
    atTable: true,
    lore: {
      en: 'Katherine has devoted her life to understanding the movements of the heavens. From her observatory above the clouds, she charts celestial pathways that even the greatest explorers fear to follow. When the stars fall silent, she trusts her calculations to guide lost travelers safely home.',
      pt: 'Katherine dedicou a vida a entender o movimento dos céus. De seu observatório acima das nuvens, ela traça rotas celestes que nem os maiores exploradores ousam seguir. Quando as estrelas se calam, ela confia nos próprios cálculos para guiar viajantes perdidos de volta para casa.',
    },
    ideals: {
      en: 'Precision: a careful number can bring everyone home.',
      pt: 'Precisão: um número bem conferido pode trazer todos de volta para casa.',
    },
    bonds: {
      en: 'The travelers who trusted her charts with their lives.',
      pt: 'Os viajantes que confiaram suas vidas aos mapas dela.',
    },
    flaws: {
      en: 'Rechecks everything twice, even when there is no time.',
      pt: 'Confere tudo duas vezes, mesmo quando não há tempo.',
    },
  },
  {
    slug: 'grace',
    name: 'Grace Hopper',
    title: 'The Code Admiral',
    className: { en: 'Fighter', pt: 'Guerreira' },
    accentColor: '#0f8a85',
    personality: { en: 'Pragmatic, witty, brave', pt: 'Pragmática, espirituosa, corajosa' },
    item: { en: "The Admiral's Blade", pt: 'A Lâmina do Almirante' },
    image: 'code-admiral.webp',
    atTable: true,
    lore: {
      en: 'Admiral Grace commands with discipline, wit, and an unshakable belief that every problem has a solution. A veteran of countless naval expeditions, she studies ancient battle formations and transforms complicated strategies into orders her entire fleet can understand. Her greatest weapon is not her sword, but her ability to turn confusion into action.',
      pt: 'A almirante Grace comanda com disciplina, humor e a crença inabalável de que todo problema tem solução. Veterana de incontáveis expedições navais, ela estuda formações de batalha antigas e transforma estratégias complicadas em ordens que toda a sua frota entende. Sua maior arma não é a espada, e sim a capacidade de transformar confusão em ação.',
    },
    ideals: {
      en: 'Clarity: a plan nobody understands is not a plan.',
      pt: 'Clareza: um plano que ninguém entende não é um plano.',
    },
    bonds: {
      en: 'Her fleet, every sailor of it.',
      pt: 'Sua frota, cada marinheiro dela.',
    },
    flaws: {
      en: 'Cannot resist asking "why do we do it this way?" at the worst moment.',
      pt: 'Não resiste a perguntar "por que fazemos assim?" na pior hora.',
    },
  },
  {
    slug: 'hedy',
    name: 'Hedy Lamarr',
    title: 'The Whispering Frequency',
    className: { en: 'Bard', pt: 'Barda' },
    accentColor: '#c0183f',
    personality: {
      en: 'Ingenious, charismatic, independent',
      pt: 'Engenhosa, carismática, independente',
    },
    item: { en: 'The Resonant Lyre', pt: 'A Lira Ressonante' },
    image: 'whispering-frequency.webp',
    atTable: true,
    lore: {
      en: "Behind Hedy's captivating performances lies a brilliant inventor. She has mastered the art of sending secret messages through shifting melodies, allowing allies to communicate without being discovered. Her enchanted instrument can turn a whispered song into a message carried across an entire kingdom.",
      pt: 'Por trás das apresentações cativantes de Hedy existe uma inventora brilhante. Ela dominou a arte de enviar mensagens secretas por melodias que mudam, permitindo que aliados se comuniquem sem ser descobertos. Seu instrumento encantado transforma uma canção sussurrada em mensagem levada por um reino inteiro.',
    },
    ideals: {
      en: 'Freedom: no one should have to listen to a song they did not choose.',
      pt: 'Liberdade: ninguém deveria ouvir uma canção que não escolheu.',
    },
    bonds: {
      en: 'The allies who hide inside her melodies.',
      pt: 'Os aliados que se escondem dentro de suas melodias.',
    },
    flaws: {
      en: 'Wears a dazzling smile over secrets she will not share.',
      pt: 'Veste um sorriso deslumbrante sobre segredos que não divide.',
    },
  },
  {
    slug: 'maren',
    name: 'Maren Hamilton',
    title: 'The Horizon Pathfinder',
    className: { en: 'Ranger', pt: 'Patrulheira' },
    accentColor: '#d98a06',
    personality: {
      en: 'Strategic, disciplined, resilient',
      pt: 'Estratégica, disciplinada, resiliente',
    },
    item: { en: 'The Horizon Compass', pt: 'A Bússola do Horizonte' },
    image: 'horizon-pathfinder.webp',
    atTable: true,
    lore: {
      en: 'Maren is the guardian of journeys beyond the known world. She maps dangerous passages between distant realms and prepares for disasters long before they occur. Her meticulous planning has saved countless expeditions, proving that the greatest explorers are those who know how to bring everyone home.',
      pt: 'Maren é a guardiã das jornadas além do mundo conhecido. Ela mapeia passagens perigosas entre reinos distantes e se prepara para desastres muito antes de acontecerem. Seu planejamento minucioso salvou incontáveis expedições e provou que os maiores exploradores são os que sabem trazer todos de volta.',
    },
    ideals: {
      en: 'Preparation: the worst day is survivable if someone planned for it.',
      pt: 'Preparo: o pior dia é superável se alguém planejou para ele.',
    },
    bonds: {
      en: 'Every expedition she has ever sent out, and every one that returned.',
      pt: 'Cada expedição que ela enviou, e cada uma que voltou.',
    },
    flaws: {
      en: 'Expects the disaster, so she is slow to celebrate.',
      pt: 'Espera o desastre, então demora a comemorar.',
    },
  },
  {
    slug: 'joan',
    name: 'Joan of Arc',
    title: 'The Golden Oath',
    className: { en: 'Paladin', pt: 'Paladina' },
    accentColor: '#d4a017',
    personality: { en: 'Idealistic, fearless, loyal', pt: 'Idealista, destemida, leal' },
    item: { en: 'The Banner of Dawn', pt: 'O Estandarte da Aurora' },
    image: 'golden-oath.webp',
    atTable: false,
    lore: {
      en: 'Joan was once an ordinary young woman who answered a call no one else could hear. Guided by an unwavering sense of purpose, she took up a sword to defend her people against overwhelming odds. Her courage inspires even the most frightened soldiers to stand together when hope seems lost.',
      pt: 'Joan já foi uma jovem comum que atendeu a um chamado que mais ninguém ouvia. Guiada por um propósito inabalável, ela empunhou uma espada para defender seu povo contra probabilidades esmagadoras. Sua coragem inspira até os soldados mais assustados a se manterem unidos quando a esperança parece perdida.',
    },
    ideals: {
      en: 'Faith: a vow is a light you carry for others.',
      pt: 'Fé: um juramento é uma luz que se carrega pelos outros.',
    },
    bonds: {
      en: 'The people who followed her banner without being asked.',
      pt: 'As pessoas que seguiram seu estandarte sem que ela pedisse.',
    },
    flaws: {
      en: 'Trusts the call over the council, even when the council is right.',
      pt: 'Confia mais no chamado do que no conselho, mesmo quando o conselho tem razão.',
    },
  },
  {
    slug: 'mirela',
    name: 'Mirela Pardan',
    title: 'The Rootweaver',
    className: { en: 'Druid', pt: 'Druida' },
    accentColor: '#2f9e55',
    personality: { en: 'Patient, inventive, observant', pt: 'Paciente, inventiva, observadora' },
    item: { en: 'Staff of the Living Network', pt: 'Cajado da Rede Viva' },
    image: 'rootweaver.webp',
    atTable: true,
    lore: {
      en: 'Deep within the ancient forest, the Rootweaver tends a vast network of living roots connecting distant groves. She has learned to guide their growth so that messages and vital energy can travel without becoming trapped in endless loops. To her, harmony is not silence, but the art of keeping every living connection in balance.',
      pt: 'No coração da floresta ancestral, a Tecelã de Raízes cuida de uma vasta rede de raízes vivas que liga bosques distantes. Ela aprendeu a guiar o crescimento delas para que mensagens e energia vital viajem sem ficar presas em ciclos infinitos. Para ela, harmonia não é silêncio, e sim a arte de manter em equilíbrio cada ligação viva.',
    },
    ideals: {
      en: 'Balance: every connection matters, and none may trap the others.',
      pt: 'Equilíbrio: toda ligação importa, e nenhuma pode prender as outras.',
    },
    bonds: {
      en: 'The ancient forest and the groves her roots reach.',
      pt: 'A floresta ancestral e os bosques que as raízes dela alcançam.',
    },
    flaws: {
      en: 'Would rather untangle a problem for a week than cut it.',
      pt: 'Prefere passar uma semana desembaraçando um problema a cortá-lo.',
    },
  },
  {
    slug: 'ching',
    name: 'Ching Shih',
    title: 'The Steel Tide',
    className: { en: 'Rogue', pt: 'Ladina' },
    accentColor: '#4a78b0',
    personality: { en: 'Calculating, commanding, shrewd', pt: 'Calculista, autoritária, astuta' },
    item: { en: 'The Tidecutter', pt: 'O Corta-Maré' },
    image: 'steel-tide.webp',
    atTable: false,
    lore: {
      en: 'Ching Shih rules the coastal waters through intelligence, discipline, and a network of loyal captains. Once underestimated by powerful naval commanders, she united rival crews beneath a single code. Her enemies fear her cunning more than her blades, for she always seems to know their plans before they set sail.',
      pt: 'Ching Shih governa as águas costeiras com inteligência, disciplina e uma rede de capitães leais. Antes subestimada por poderosos comandantes navais, ela uniu tripulações rivais sob um único código. Os inimigos temem mais a astúcia dela do que suas lâminas, pois ela sempre parece saber os planos deles antes de zarparem.',
    },
    ideals: {
      en: 'Order: one code, kept by all, beats a hundred captains.',
      pt: 'Ordem: um código só, respeitado por todos, vence cem capitães.',
    },
    bonds: {
      en: 'The captains who swore to her code.',
      pt: 'Os capitães que juraram seguir o código dela.',
    },
    flaws: {
      en: 'Forgives nothing that breaks the code.',
      pt: 'Não perdoa nada que quebre o código.',
    },
  },
  {
    slug: 'nzinga',
    name: 'Queen Nzinga',
    title: 'The Copper Sovereign',
    className: { en: 'Monk', pt: 'Monja' },
    accentColor: '#b87333',
    personality: {
      en: 'Diplomatic, determined, strategic',
      pt: 'Diplomática, determinada, estrategista',
    },
    item: { en: "The Sovereign's Staff", pt: 'O Cajado da Soberana' },
    image: 'copper-sovereign.webp',
    atTable: false,
    lore: {
      en: 'Queen Nzinga is a master of discipline, diplomacy, and resistance. Within her fortified sanctuary, she trains guardians to defend their homeland through patience, agility, and unwavering resolve. She knows that victory is not always won through force; sometimes the most powerful strike is the one an enemy never sees coming.',
      pt: 'A rainha Nzinga é mestra em disciplina, diplomacia e resistência. Dentro de seu santuário fortificado, ela treina guardiões para defender a terra natal com paciência, agilidade e determinação inabalável. Ela sabe que a vitória nem sempre vem pela força; às vezes o golpe mais poderoso é aquele que o inimigo nunca vê chegar.',
    },
    ideals: {
      en: 'Sovereignty: a homeland is defended with patience before steel.',
      pt: 'Soberania: a terra natal se defende primeiro com paciência, depois com aço.',
    },
    bonds: {
      en: 'The guardians she trained, who now guard her people.',
      pt: 'Os guardiões que treinou e que agora protegem o povo dela.',
    },
    flaws: {
      en: 'Hides her next move so well that allies cannot follow it.',
      pt: 'Esconde tão bem o próximo passo que os aliados não conseguem acompanhar.',
    },
  },
  {
    slug: 'hypatia',
    name: 'Hypatia',
    title: 'The Lunar Scholar',
    className: { en: 'Sorcerer', pt: 'Feiticeira' },
    accentColor: '#b79cf2',
    personality: {
      en: 'Rational, independent, contemplative',
      pt: 'Racional, independente, contemplativa',
    },
    item: { en: 'The Lunar Sphere', pt: 'A Esfera Lunar' },
    image: 'lunar-scholar.webp',
    atTable: false,
    lore: {
      en: 'Hypatia was born with an unusual sensitivity to the rhythms of the cosmos. Through years of study, she learned to channel this natural gift into celestial magic. Within the great library, she protects forgotten knowledge and teaches that wisdom grows through curiosity, reason, and the courage to question.',
      pt: 'Hypatia nasceu com uma sensibilidade incomum aos ritmos do cosmos. Depois de anos de estudo, aprendeu a canalizar esse dom natural em magia celeste. Dentro da grande biblioteca, ela protege saberes esquecidos e ensina que a sabedoria cresce com curiosidade, razão e a coragem de questionar.',
    },
    ideals: {
      en: 'Reason: any claim deserves a question.',
      pt: 'Razão: toda afirmação merece uma pergunta.',
    },
    bonds: {
      en: 'The library and the scrolls no one else would save.',
      pt: 'A biblioteca e os pergaminhos que ninguém mais salvaria.',
    },
    flaws: {
      en: 'Answers anger with an argument, and that rarely calms anyone.',
      pt: 'Responde à raiva com um argumento, e isso raramente acalma alguém.',
    },
  },
  {
    slug: 'florence',
    name: 'Florence Nightingale',
    title: 'The Keeper of Light',
    className: { en: 'Cleric', pt: 'Clériga' },
    accentColor: '#e6d9a8',
    personality: { en: 'Empathetic, rigorous, persistent', pt: 'Empática, rigorosa, persistente' },
    item: { en: 'The Everlasting Lantern', pt: 'A Lanterna Perene' },
    image: 'keeper-of-light.webp',
    atTable: false,
    lore: {
      en: 'When war and disease devastated the surrounding kingdoms, Florence transformed an abandoned sanctuary into a refuge for the wounded. Carrying her lantern through the darkest nights, she combines healing magic with careful observation and compassionate care. Her work has taught generations that saving lives requires both knowledge and kindness.',
      pt: 'Quando guerra e doença devastaram os reinos vizinhos, Florence transformou um santuário abandonado em refúgio para os feridos. Carregando a lanterna pelas noites mais escuras, ela une magia de cura, observação atenta e cuidado compassivo. Seu trabalho ensinou gerações de que salvar vidas exige conhecimento e bondade.',
    },
    ideals: {
      en: 'Care: kindness without knowledge is not enough, and neither is the reverse.',
      pt: 'Cuidado: bondade sem conhecimento não basta, e o contrário também não.',
    },
    bonds: {
      en: 'Every patient who slept under her lantern.',
      pt: 'Cada paciente que dormiu sob a luz da lanterna dela.',
    },
    flaws: {
      en: 'Pushes herself past exhaustion and expects the same of others.',
      pt: 'Vai além do cansaço e espera o mesmo dos outros.',
    },
  },
  {
    slug: 'boudica',
    name: 'Boudica',
    title: 'The Ember Queen',
    className: { en: 'Barbarian', pt: 'Bárbara' },
    accentColor: '#c4593a',
    personality: { en: 'Fierce, proud, protective', pt: 'Feroz, orgulhosa, protetora' },
    item: { en: "The Rebel's Spear", pt: 'A Lança da Rebelde' },
    image: 'ember-queen.webp',
    atTable: false,
    lore: {
      en: 'Boudica rose against an empire that sought to crush her people. With fire in her heart and a fierce determination to defend her homeland, she united scattered tribes into a formidable rebellion. On the battlefield, her presence is like a storm: wild, relentless, and impossible to ignore.',
      pt: 'Boudica se ergueu contra um império que tentava esmagar seu povo. Com fogo no coração e feroz determinação de defender a terra natal, ela uniu tribos dispersas numa rebelião formidável. No campo de batalha, sua presença é como uma tempestade: selvagem, implacável e impossível de ignorar.',
    },
    ideals: {
      en: 'Defiance: a people that stands together cannot be crushed.',
      pt: 'Desafio: um povo unido não pode ser esmagado.',
    },
    bonds: {
      en: 'The scattered tribes she bound into one.',
      pt: 'As tribos dispersas que ela uniu em uma só.',
    },
    flaws: {
      en: 'Her anger arrives before her judgement.',
      pt: 'A raiva dela chega antes do julgamento.',
    },
  },
  {
    slug: 'mary',
    name: 'Mary Shelley',
    title: 'The Spark of the Forbidden',
    className: { en: 'Warlock', pt: 'Bruxa (Warlock)' },
    accentColor: '#2ec4b6',
    personality: {
      en: 'Introspective, creative, questioning',
      pt: 'Introspectiva, criativa, questionadora',
    },
    item: { en: 'The Galvanic Grimoire', pt: 'O Grimório Galvânico' },
    image: 'spark-of-the-forbidden.webp',
    atTable: false,
    lore: {
      en: 'Mary has always been fascinated by the boundary between life and death. After discovering an ancient source of spectral energy, she entered a mysterious pact to uncover its secrets. Now, within her storm-lit laboratory, she studies the consequences of creation, asking whether those who bring life into the world are prepared to care for it.',
      pt: 'Mary sempre se fascinou pela fronteira entre a vida e a morte. Depois de descobrir uma fonte antiga de energia espectral, firmou um pacto misterioso para desvendar seus segredos. Agora, em seu laboratório iluminado por tempestades, ela estuda as consequências da criação e pergunta se quem traz vida ao mundo está pronto para cuidar dela.',
    },
    ideals: {
      en: 'Responsibility: whoever creates must answer for what they create.',
      pt: 'Responsabilidade: quem cria precisa responder pelo que criou.',
    },
    bonds: {
      en: 'The pact she made, and what it asks of her.',
      pt: 'O pacto que firmou e o que ele exige dela.',
    },
    flaws: {
      en: 'Cannot leave a forbidden question alone.',
      pt: 'Não consegue deixar uma pergunta proibida em paz.',
    },
  },
];
