import { describe, expect, it } from 'vitest';

import { type Coins, fromCopper, pay, receive, toCopper } from './coins';

const purse = (coins: Partial<Coins>): Coins => ({ cp: 0, sp: 0, ep: 0, gp: 0, pp: 0, ...coins });

describe('toCopper', () => {
  it('soma tudo em cobre, com o câmbio do SRD', () => {
    expect(toCopper(purse({ cp: 1, sp: 1, ep: 1, gp: 1, pp: 1 }))).toBe(1 + 10 + 50 + 100 + 1000);
  });
});

describe('fromCopper', () => {
  it('troca cobre pelas maiores moedas, sem eletro', () => {
    expect(fromCopper(1234)).toEqual(purse({ pp: 1, gp: 2, sp: 3, cp: 4 }));
    expect(fromCopper(50)).toEqual(purse({ sp: 5 }));
  });
});

describe('pay', () => {
  it('paga com a moeda do preço quando dá', () => {
    const result = pay(purse({ cp: 12, gp: 45, pp: 2 }), 5, 'gp');
    expect(result).toEqual({
      ok: true,
      spent: purse({ gp: 5 }),
      change: purse({}),
      after: purse({ cp: 12, gp: 40, pp: 2 }),
    });
  });

  it('quebra a menor moeda maior e devolve o troco', () => {
    const result = pay(purse({ cp: 12, sp: 3, gp: 45, pp: 2 }), 50, 'gp');
    expect(result).toEqual({
      ok: true,
      spent: purse({ gp: 45, pp: 1 }),
      change: purse({ gp: 5 }),
      after: purse({ cp: 12, sp: 3, gp: 5, pp: 1 }),
    });
  });

  it('só paga 5 PO com PL: sai 1 PL, voltam 5 PO', () => {
    const result = pay(purse({ pp: 1 }), 5, 'gp');
    expect(result).toMatchObject({ ok: true, spent: purse({ pp: 1 }), change: purse({ gp: 5 }) });
  });

  it('prefere quebrar uma moeda maior a gastar as menores', () => {
    const result = pay(purse({ cp: 500, pp: 1 }), 1, 'gp');
    expect(result).toMatchObject({ spent: purse({ pp: 1 }), change: purse({ gp: 9 }) });
  });

  it('usa as moedas menores quando não há maiores', () => {
    const result = pay(purse({ sp: 100 }), 5, 'gp');
    expect(result).toMatchObject({ spent: purse({ sp: 50 }), change: purse({}) });
  });

  it('gasta o que tem da moeda do preço e quebra uma maior para o resto', () => {
    // 6 PP: os 3 PP não bastam, o PE (5 PP) cobre o resto e sobram 2 PP de troco
    const result = pay(purse({ ep: 1, sp: 3 }), 6, 'sp');
    expect(result).toMatchObject({ spent: purse({ sp: 3, ep: 1 }), change: purse({ sp: 2 }) });
  });

  it('usa as menores, das maiores para as menores, quando as maiores não bastam', () => {
    // 2 PO: o PE vale 50 PC e cobre metade; o resto sai em PP
    const result = pay(purse({ ep: 1, sp: 20 }), 2, 'gp');
    expect(result).toMatchObject({ spent: purse({ ep: 1, sp: 15 }), change: purse({}) });
  });

  it('o troco vem nas maiores moedas possíveis, sem eletro', () => {
    const result = pay(purse({ pp: 1 }), 1, 'cp');
    expect(result).toMatchObject({ change: purse({ gp: 9, sp: 9, cp: 9 }) });
  });

  it('diz quanto falta, em cobre, quando o dinheiro não dá', () => {
    expect(pay(purse({ gp: 4, sp: 5 }), 5, 'gp')).toEqual({ ok: false, missing: 50 });
  });

  it('não aceita valor zero ou negativo', () => {
    expect(() => pay(purse({ gp: 1 }), 0, 'gp')).toThrow();
    expect(() => pay(purse({ gp: 1 }), -1, 'gp')).toThrow();
  });
});

describe('receive', () => {
  it('soma na moeda recebida, sem trocar nada', () => {
    expect(receive(purse({ gp: 2 }), 30, 'sp')).toEqual(purse({ gp: 2, sp: 30 }));
  });
});
