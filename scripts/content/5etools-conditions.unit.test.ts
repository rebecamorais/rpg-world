import { describe, expect, it } from 'vitest';

import {
  type FiveToolsCondition,
  toConditionData,
  toConditionId,
  toConditionText,
} from './5etools-conditions';

const prone: FiveToolsCondition = {
  name: 'Prone',
  source: 'PHB',
  srd: true,
  entries: [
    {
      type: 'list',
      items: [
        'A prone creature can only crawl.',
        'The creature has {@variantrule Disadvantage|XPHB} on attacks.',
      ],
    },
  ],
};

const exhaustion: FiveToolsCondition = {
  name: 'Exhaustion',
  source: 'XPHB',
  srd52: true,
  entries: [
    'While you have the {@condition Exhaustion} condition:',
    { type: 'list', items: ['Level one.'] },
  ],
};

describe('conversão das condições do 5etools', () => {
  it('o id vem do nome', () => {
    expect(toConditionId(prone)).toBe('prone');
  });

  it('só a exaustão tem nível, de 1 a 6', () => {
    expect(toConditionData(exhaustion)).toEqual({ id: 'exhaustion', maxLevel: 6 });
    expect(toConditionData(prone)).toEqual({ id: 'prone' });
  });

  it('o texto guarda as tags e as listas', () => {
    expect(toConditionText(prone)).toEqual({
      name: 'Prone',
      description:
        '• A prone creature can only crawl.\n• The creature has {@variantrule Disadvantage|XPHB} on attacks.',
    });
    expect(toConditionText(exhaustion).description).toBe(
      'While you have the {@condition Exhaustion} condition:\n• Level one.',
    );
  });
});
