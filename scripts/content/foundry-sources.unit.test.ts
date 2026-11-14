import { describe, expect, it } from 'vitest';

import { idNameOf } from './foundry-sources';

describe('idNameOf', () => {
  it('reads _id and name', () =>
    expect(
      idNameOf("_id: phbClcPotentSpel\nname: 'Blessed Strikes: Potent Spellcasting'\ntype: feat\n"),
    ).toEqual(['phbClcPotentSpel', 'Blessed Strikes: Potent Spellcasting']));

  it('ignores files without a name', () => expect(idNameOf('_id: x\n')).toBeUndefined());
});
