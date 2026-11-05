/*
 * The real women behind the characters: documented facts, in our own words, with sources. This is
 * the only file where Radia Perlman and Margaret Hamilton are named; elsewhere they are Mirela
 * Pardan and Maren Hamilton.
 */
import type { Bilingual } from './heroes';

export interface InspirationSource {
  realName: string;
  period: string;
  contribution: Bilingual;
  sources: { label: string; url: string }[];
}

const wiki = (path: string) => ({
  label: 'Wikipedia',
  url: `https://en.wikipedia.org/wiki/${path}`,
});
const britannica = (path: string) => ({
  label: 'Britannica',
  url: `https://www.britannica.com/biography/${path}`,
});

export const INSPIRATIONS: Record<string, InspirationSource> = {
  ada: {
    realName: 'Ada Lovelace',
    period: '1815–1852',
    contribution: {
      en: 'English mathematician who annotated a description of Charles Babbage’s Analytical Engine in 1843. Her notes include a step-by-step method for computing Bernoulli numbers, often called the first published computer program.',
      pt: 'Matemática inglesa que anotou, em 1843, a descrição da Máquina Analítica de Charles Babbage. Suas notas incluem um passo a passo para calcular os números de Bernoulli, muitas vezes chamado de primeiro programa de computador publicado.',
    },
    sources: [britannica('Ada-Lovelace'), wiki('Ada_Lovelace')],
  },
  katherine: {
    realName: 'Katherine Johnson',
    period: '1918–2020',
    contribution: {
      en: 'American mathematician at NASA who calculated orbital trajectories for early crewed spaceflights, including Alan Shepard’s 1961 flight. In 1962 astronaut John Glenn asked her to check the computer’s numbers for his orbit.',
      pt: 'Matemática americana da NASA que calculou trajetórias orbitais dos primeiros voos tripulados, incluindo o de Alan Shepard, em 1961. Em 1962, o astronauta John Glenn pediu que ela conferisse os números do computador para a órbita dele.',
    },
    sources: [britannica('Katherine-Johnson'), wiki('Katherine_Johnson')],
  },
  grace: {
    realName: 'Grace Hopper',
    period: '1906–1992',
    contribution: {
      en: 'American computer scientist and U.S. Navy rear admiral. She built one of the first compilers in the early 1950s and argued for programming languages closer to English, which shaped the creation of COBOL.',
      pt: 'Cientista da computação americana e contra-almirante da Marinha dos EUA. Criou um dos primeiros compiladores no início dos anos 1950 e defendeu linguagens de programação mais próximas do inglês, o que influenciou a criação do COBOL.',
    },
    sources: [britannica('Grace-Hopper'), wiki('Grace_Hopper')],
  },
  hedy: {
    realName: 'Hedy Lamarr',
    period: '1914–2000',
    contribution: {
      en: 'Austrian-American film actress and inventor. With composer George Antheil she patented a frequency-hopping radio system in 1942, an idea related to spread-spectrum techniques later used in wireless communication.',
      pt: 'Atriz e inventora austro-americana. Com o compositor George Antheil, patenteou em 1942 um sistema de rádio com salto de frequência, ideia ligada às técnicas de espalhamento espectral usadas depois em comunicações sem fio.',
    },
    sources: [britannica('Hedy-Lamarr'), wiki('Hedy_Lamarr')],
  },
  maren: {
    realName: 'Margaret Hamilton',
    period: '1936–2026',
    contribution: {
      en: 'American computer scientist who led the team writing onboard flight software for NASA’s Apollo missions at the MIT Instrumentation Laboratory. She helped establish the term "software engineering" and received the Presidential Medal of Freedom in 2016.',
      pt: 'Cientista da computação americana que liderou a equipe do software de bordo das missões Apollo da NASA, no Laboratório de Instrumentação do MIT. Ajudou a firmar o termo "engenharia de software" e recebeu a Medalha Presidencial da Liberdade em 2016.',
    },
    sources: [wiki('Margaret_Hamilton_(software_engineer)')],
  },
  joan: {
    realName: 'Joan of Arc',
    period: 'c. 1412–1431',
    contribution: {
      en: 'French peasant girl who led troops during the Hundred Years’ War and helped lift the siege of Orléans in 1429. She was tried and executed in 1431, and the Catholic Church canonized her in 1920.',
      pt: 'Jovem camponesa francesa que liderou tropas na Guerra dos Cem Anos e ajudou a romper o cerco de Orléans em 1429. Foi julgada e executada em 1431, e a Igreja Católica a canonizou em 1920.',
    },
    sources: [britannica('Saint-Joan-of-Arc'), wiki('Joan_of_Arc')],
  },
  mirela: {
    realName: 'Radia Perlman',
    period: 'b. 1951',
    contribution: {
      en: 'American computer scientist who invented the spanning-tree protocol in the 1980s, which lets network bridges avoid endless loops of traffic. She is nicknamed "the mother of the Internet" by some, a title she herself has downplayed.',
      pt: 'Cientista da computação americana que inventou, nos anos 1980, o protocolo spanning tree, que evita ciclos infinitos de tráfego entre pontes de rede. Alguns a chamam de "mãe da Internet", título que ela própria relativiza.',
    },
    sources: [wiki('Radia_Perlman')],
  },
  ching: {
    realName: 'Ching Shih',
    period: 'c. 1775–1844',
    contribution: {
      en: 'Chinese pirate leader who, after her husband’s death in 1807, took charge of a large confederation of pirate fleets off the coast of southern China, with Zhang Bao commanding its Red Flag Fleet. She negotiated an amnesty with the authorities in 1810.',
      pt: 'Líder pirata chinesa que, após a morte do marido em 1807, assumiu uma grande confederação de frotas piratas na costa do sul da China, com Zhang Bao no comando da Frota da Bandeira Vermelha. Negociou uma anistia com as autoridades em 1810.',
    },
    sources: [wiki('Ching_Shih')],
  },
  nzinga: {
    realName: 'Nzinga of Ndongo and Matamba',
    period: 'c. 1583–1663',
    contribution: {
      en: 'Ruler of the kingdoms of Ndongo and Matamba, in present-day Angola. She spent decades negotiating, allying and fighting to resist Portuguese colonization. She also took part in the slave trade, which helped pay for her wars.',
      pt: 'Governante dos reinos de Ndongo e Matamba, no território da atual Angola. Passou décadas negociando, fazendo alianças e lutando para resistir à colonização portuguesa. Também participou do tráfico de escravizados, que ajudou a pagar suas guerras.',
    },
    sources: [britannica('Nzinga'), wiki('Nzinga_of_Ndongo_and_Matamba')],
  },
  hypatia: {
    realName: 'Hypatia of Alexandria',
    period: 'c. 350/370–415',
    contribution: {
      en: 'Mathematician, astronomer and philosopher who taught in Alexandria, in Roman Egypt. She wrote commentaries on mathematical works and was killed by a mob in 415.',
      pt: 'Matemática, astrônoma e filósofa que ensinou em Alexandria, no Egito romano. Escreveu comentários sobre obras matemáticas e foi morta por uma multidão em 415.',
    },
    sources: [britannica('Hypatia'), wiki('Hypatia')],
  },
  florence: {
    realName: 'Florence Nightingale',
    period: '1820–1910',
    contribution: {
      en: 'English nurse who improved hospital conditions during the Crimean War. She used statistics and charts to argue for sanitary reform and founded a nursing school at St Thomas’ Hospital in London in 1860.',
      pt: 'Enfermeira inglesa que melhorou as condições hospitalares na Guerra da Crimeia. Usou estatísticas e gráficos para defender reformas sanitárias e fundou uma escola de enfermagem no Hospital St Thomas, em Londres, em 1860.',
    },
    sources: [britannica('Florence-Nightingale'), wiki('Florence_Nightingale')],
  },
  boudica: {
    realName: 'Boudica',
    period: 'died c. 60–61',
    contribution: {
      en: 'Queen of the Iceni, a tribe in eastern Britain, who led an uprising against Roman rule around 60 or 61 CE. Her forces burned Camulodunum, Londinium and Verulamium before being defeated.',
      pt: 'Rainha dos icenos, tribo do leste da Britânia, que liderou uma revolta contra o domínio romano por volta de 60 ou 61 d.C. Suas forças incendiaram Camulodunum, Londinium e Verulamium antes de serem derrotadas.',
    },
    sources: [britannica('Boudicca'), wiki('Boudica')],
  },
  mary: {
    realName: 'Mary Shelley',
    period: '1797–1851',
    contribution: {
      en: 'English novelist who wrote Frankenstein; or, The Modern Prometheus, published in 1818 when she was twenty. The novel is often counted among the first works of science fiction.',
      pt: 'Romancista inglesa autora de Frankenstein; ou, O Prometeu Moderno, publicado em 1818, quando ela tinha vinte anos. O romance costuma ser citado entre as primeiras obras de ficção científica.',
    },
    sources: [britannica('Mary-Wollstonecraft-Shelley'), wiki('Mary_Shelley')],
  },
};
