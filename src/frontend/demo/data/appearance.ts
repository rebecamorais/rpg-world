/*
 * How the fantasy characters of The Pioneers look, taken from their portraits. Fiction only, like
 * heroes.ts: ages and measures are invented, never the real person's.
 */
import type { Bilingual } from './heroes';

export interface Appearance {
  age: Bilingual;
  height: Bilingual;
  weight: Bilingual;
  eyes: Bilingual;
  skin: Bilingual;
  hair: Bilingual;
}

const b = (en: string, pt: string): Bilingual => ({ en, pt });
const age = (years: number) => b(`${years} years`, `${years} anos`);

export const APPEARANCE: Record<string, Appearance> = {
  ada: {
    age: age(32),
    height: b(`5'5"`, '1,65 m'),
    weight: b('128 lb', '58 kg'),
    eyes: b('Dark brown', 'Castanho-escuros'),
    skin: b('Deep brown', 'Marrom-escura'),
    hair: b(
      'Full black curls, pinned with brass gears',
      'Cachos pretos e volumosos, presos com engrenagens de latão',
    ),
  },
  katherine: {
    age: age(67),
    height: b(`5'6"`, '1,68 m'),
    weight: b('132 lb', '60 kg'),
    eyes: b('Warm brown', 'Castanhos e calorosos'),
    skin: b('Dark brown', 'Marrom-escura'),
    hair: b('Short white curls', 'Cachos brancos e curtos'),
  },
  grace: {
    age: age(58),
    height: b(`5'8"`, '1,73 m'),
    weight: b('154 lb', '70 kg'),
    eyes: b('Steel grey', 'Cinza-aço'),
    skin: b(
      'Sea-tanned, with a scar across one cheek',
      'Bronzeada pelo mar, com uma cicatriz na bochecha',
    ),
    hair: b(
      'Silver and black waves, shaved on one side',
      'Ondas prateadas e pretas, raspadas de um lado',
    ),
  },
  hedy: {
    age: age(41),
    height: b(`5'7"`, '1,70 m'),
    weight: b('128 lb', '58 kg'),
    eyes: b('Green', 'Verdes'),
    skin: b('Light, with tattooed arms', 'Clara, com os braços tatuados'),
    hair: b('Short, in violet and magenta', 'Curto, em violeta e magenta'),
  },
  maren: {
    age: age(36),
    height: b(`5'9"`, '1,75 m'),
    weight: b('150 lb', '68 kg'),
    eyes: b('Amber', 'Âmbar'),
    skin: b('Bronze, weathered by the sun', 'Bronze, marcada pelo sol'),
    hair: b('Long dark locs with gold rings', 'Dreads longos e escuros, com anéis dourados'),
  },
  joan: {
    age: age(24),
    height: b(`5'6"`, '1,68 m'),
    weight: b('143 lb', '65 kg'),
    eyes: b('Blue-grey', 'Azul-acinzentados'),
    skin: b('Fair, with a scar on one cheek', 'Clara, com uma cicatriz na bochecha'),
    hair: b('Cropped close, golden blond', 'Bem curto, loiro-dourado'),
  },
  mirela: {
    age: age(410),
    height: b(`5'3"`, '1,60 m'),
    weight: b('110 lb', '50 kg'),
    eyes: b('Dark brown', 'Castanho-escuros'),
    skin: b('Weathered brown, with pale rune marks', 'Marrom e curtida, com runas claras'),
    hair: b(
      'White locs woven with flowers and leaves',
      'Dreads brancos, trançados com flores e folhas',
    ),
  },
  ching: {
    age: age(38),
    height: b(`5'3"`, '1,60 m'),
    weight: b('119 lb', '54 kg'),
    eyes: b('Near black', 'Quase pretos'),
    skin: b('Light olive', 'Oliva-clara'),
    hair: b('Straight black bob with a fringe', 'Chanel preto e liso, com franja'),
  },
  nzinga: {
    age: age(44),
    height: b(`5'10"`, '1,78 m'),
    weight: b('165 lb', '75 kg'),
    eyes: b('Dark brown', 'Castanho-escuros'),
    skin: b('Deep copper brown', 'Marrom-acobreada'),
    hair: b('Black braids crowned with copper', 'Tranças pretas, coroadas de cobre'),
  },
  hypatia: {
    age: age(34),
    height: b(`5'7"`, '1,70 m'),
    weight: b('137 lb', '62 kg'),
    eyes: b('Pale grey', 'Cinza-claros'),
    skin: b('Olive', 'Oliva'),
    hair: b('Long black waves', 'Ondas pretas e longas'),
  },
  florence: {
    age: age(33),
    height: b(`5'4"`, '1,63 m'),
    weight: b('130 lb', '59 kg'),
    eyes: b('Honey brown', 'Castanho-mel'),
    skin: b('Warm brown', 'Marrom-clara'),
    hair: b(
      'Short dark curls with golden laurel leaves',
      'Cachos escuros e curtos, com folhas de louro douradas',
    ),
  },
  boudica: {
    age: age(39),
    height: b(`5'11"`, '1,80 m'),
    weight: b('181 lb', '82 kg'),
    eyes: b('Blue', 'Azuis'),
    skin: b('Fair, with blue war paint', 'Clara, com pintura de guerra azul'),
    hair: b('Long red waves and a thick braid', 'Longas ondas ruivas e uma trança grossa'),
  },
  mary: {
    age: age(26),
    height: b(`5'5"`, '1,66 m'),
    weight: b('119 lb', '54 kg'),
    eyes: b('Grey-green', 'Verde-acinzentados'),
    skin: b('Pale', 'Muito clara'),
    hair: b(
      'Tousled platinum blond with thin braids',
      'Loiro-platinado e desalinhado, com tranças finas',
    ),
  },
};
