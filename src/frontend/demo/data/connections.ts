/*
 * Who each character stands with and against, and what they belong to. Invented for the campaign:
 * every enemy and organization here is fiction, and no real history is implied.
 */
import type { Bilingual } from './heroes';

export interface Connections {
  alliesAndEnemies: Bilingual;
  organizations: Bilingual;
}

const b = (en: string, pt: string): Bilingual => ({ en, pt });

export const CONNECTIONS: Record<string, Connections> = {
  ada: {
    alliesAndEnemies: b(
      'Ally: Katherine, who checks her numbers against the stars. Enemy: Baron Ostrel, who wants her engines turned into siege weapons.',
      'Aliada: Katherine, que confere os números dela nas estrelas. Inimigo: o barão Ostrel, que quer transformar os motores dela em armas de cerco.',
    ),
    organizations: b(
      'The Brass Collegium, a guild of artificers who share their blueprints freely.',
      'O Colégio de Latão, uma guilda de artífices que compartilham suas plantas livremente.',
    ),
  },
  katherine: {
    alliesAndEnemies: b(
      'Ally: Maren, who walks the routes Katherine charts. Enemy: the Veil Cartographers, who sell false maps to stranded ships.',
      'Aliada: Maren, que percorre as rotas traçadas por Katherine. Inimigos: os Cartógrafos do Véu, que vendem mapas falsos a navios à deriva.',
    ),
    organizations: b(
      'The Skyward Observatory, keeper of the realm’s star charts.',
      'O Observatório Celeste, guardião das cartas estelares do reino.',
    ),
  },
  grace: {
    alliesAndEnemies: b(
      'Ally: Hedy, whose coded songs carry orders between her ships. Rival: Ching Shih, who raids her convoys and has earned her respect.',
      'Aliada: Hedy, cujas canções cifradas levam ordens entre os navios dela. Rival: Ching Shih, que ataca seus comboios e conquistou seu respeito.',
    ),
    organizations: b(
      'The Azure Fleet, which she commands as admiral.',
      'A Frota Azul, que ela comanda como almirante.',
    ),
  },
  hedy: {
    alliesAndEnemies: b(
      'Ally: Grace, who trusts her songs with the fleet. Enemy: Inquisitor Vael, who hunts every message he cannot read.',
      'Aliada: Grace, que confia a frota às canções dela. Inimigo: o inquisidor Vael, que caça toda mensagem que não consegue ler.',
    ),
    organizations: b(
      'The Silent Chorus, a secret network of traveling musicians.',
      'O Coro Silencioso, uma rede secreta de músicos viajantes.',
    ),
  },
  maren: {
    alliesAndEnemies: b(
      'Ally: Mirela, whose roots warn her of bad passages. Enemy: the Hollow Tide, a hunger between realms that swallows expeditions.',
      'Aliada: Mirela, cujas raízes a avisam de passagens ruins. Inimiga: a Maré Oca, uma fome entre os reinos que engole expedições.',
    ),
    organizations: b(
      'The Wayfarers’ Compact, explorers sworn to bring everyone home.',
      'O Pacto dos Andarilhos, exploradores que juraram trazer todos de volta.',
    ),
  },
  joan: {
    alliesAndEnemies: b(
      'Ally: Florence, who tends those wounded under her banner. Enemy: Lord Marrowen, whose army burned her village.',
      'Aliada: Florence, que cuida dos feridos sob o estandarte dela. Inimigo: o lorde Marrowen, cujo exército queimou a aldeia dela.',
    ),
    organizations: b(
      'The Order of the Dawn Banner, soldiers bound by a single vow.',
      'A Ordem do Estandarte da Aurora, soldados unidos por um único juramento.',
    ),
  },
  mirela: {
    alliesAndEnemies: b(
      'Ally: Maren, who brings her news from beyond the forest. Enemy: the Ashen Company, loggers who fell the old groves for profit.',
      'Aliada: Maren, que traz notícias de além da floresta. Inimiga: a Companhia Cinzenta, madeireiros que derrubam os bosques antigos por lucro.',
    ),
    organizations: b(
      'The Circle of the Deep Grove, druids who tend the living network.',
      'O Círculo do Bosque Profundo, druidas que cuidam da rede viva.',
    ),
  },
  ching: {
    alliesAndEnemies: b(
      'Allies: the captains who swore to her code. Rival: Grace, the one admiral she has not outplayed.',
      'Aliados: os capitães que juraram seguir o código dela. Rival: Grace, a única almirante que ela ainda não superou.',
    ),
    organizations: b(
      'The Steel Tide Confederacy, rival crews united under one code.',
      'A Confederação da Maré de Aço, tripulações rivais unidas sob um único código.',
    ),
  },
  nzinga: {
    alliesAndEnemies: b(
      'Ally: Boudica, with whom she keeps a wary pact. Enemy: Viceroy Dorvane, who mistakes her patience for weakness.',
      'Aliada: Boudica, com quem mantém um pacto cauteloso. Inimigo: o vice-rei Dorvane, que confunde a paciência dela com fraqueza.',
    ),
    organizations: b(
      'The Copper Sanctuary, a fortified school of guardians.',
      'O Santuário de Cobre, uma escola fortificada de guardiões.',
    ),
  },
  hypatia: {
    alliesAndEnemies: b(
      'Ally: Katherine, with whom she trades star tables. Enemy: the Ember Zealots, who would burn the library rather than read it.',
      'Aliada: Katherine, com quem troca tabelas estelares. Inimigos: os Zelotes da Brasa, que prefeririam queimar a biblioteca a lê-la.',
    ),
    organizations: b(
      'The Keepers of the Great Library, scholars of forgotten knowledge.',
      'Os Guardiões da Grande Biblioteca, estudiosos de saberes esquecidos.',
    ),
  },
  florence: {
    alliesAndEnemies: b(
      'Ally: Joan, who sends her wounded to the sanctuary. Enemy: the Grey Fever, and every lord who will not pay for clean water.',
      'Aliada: Joan, que envia os feridos ao santuário. Inimigos: a Febre Cinzenta e todo lorde que se recusa a pagar por água limpa.',
    ),
    organizations: b(
      'The Lantern Sisterhood, healers who keep watch through the night.',
      'A Irmandade da Lanterna, curandeiras que fazem vigília durante a noite.',
    ),
  },
  boudica: {
    alliesAndEnemies: b(
      'Ally: Nzinga, who taught her that a retreat can be a weapon. Enemy: the Iron Dominion, the empire that tried to crush her people.',
      'Aliada: Nzinga, que lhe ensinou que uma retirada pode ser uma arma. Inimigo: o Domínio de Ferro, o império que tentou esmagar o povo dela.',
    ),
    organizations: b(
      'The Council of Free Tribes, which answers to no crown.',
      'O Conselho das Tribos Livres, que não responde a coroa nenhuma.',
    ),
  },
  mary: {
    alliesAndEnemies: b(
      'Ally: Hypatia, the only scholar who will still debate her. Enemy: the Pale Patron, who will one day collect on their pact.',
      'Aliada: Hypatia, a única estudiosa que ainda debate com ela. Inimigo: o Patrono Pálido, que um dia cobrará o pacto.',
    ),
    organizations: b(
      'The Storm-Lit Circle, a secret society that studies forbidden sciences.',
      'O Círculo da Tempestade, uma sociedade secreta que estuda ciências proibidas.',
    ),
  },
};
