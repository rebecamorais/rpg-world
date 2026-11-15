import { screen, within } from '@testing-library/react';
import { renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it } from 'vitest';

import { RulesBlocks, rulesBlocks } from './RulesBlocks';

const WILD_SHAPE = [
  'Your druid level determines the beasts.',
  'Beast Shapes',
  'Level | Max. CR | Example',
  '2nd | {@filter 1/4|bestiary|challenge rating=[&0;&1/4]} | Wolf',
  '4th | {@filter 1/2|bestiary|challenge rating=[&0;&1/2]} | Crocodile',
  'You automatically revert if you fall {@condition unconscious}.',
].join('\n');

describe('rulesBlocks', () => {
  it('separa parágrafos e tabela, com a linha curta de antes como legenda', () => {
    expect(rulesBlocks(WILD_SHAPE)).toEqual([
      { kind: 'paragraph', text: 'Your druid level determines the beasts.' },
      {
        kind: 'rows',
        caption: 'Beast Shapes',
        header: ['Level', 'Max. CR', 'Example'],
        rows: [
          ['2nd', '{@filter 1/4|bestiary|challenge rating=[&0;&1/4]}', 'Wolf'],
          ['4th', '{@filter 1/2|bestiary|challenge rating=[&0;&1/2]}', 'Crocodile'],
        ],
      },
      {
        kind: 'paragraph',
        text: 'You automatically revert if you fall {@condition unconscious}.',
      },
    ]);
  });

  it('uma linha solta com " | " não vira tabela, e frase antes da tabela não vira legenda', () => {
    expect(rulesBlocks('a | b')).toEqual([{ kind: 'paragraph', text: 'a | b' }]);
    const [first, table] = rulesBlocks('As shown below:\nA | B\n1 | 2');
    expect(first).toEqual({ kind: 'paragraph', text: 'As shown below:' });
    expect(table).toMatchObject({ kind: 'rows', caption: null });
  });
});

describe('RulesBlocks', () => {
  it('mostra a tabela com cabeçalho e as marcações como texto', () => {
    renderWithProviders(<RulesBlocks text={WILD_SHAPE} source="srd-5.1" />);

    const table = screen.getByRole('table', { name: 'Beast Shapes' });
    expect(within(table).getByRole('columnheader', { name: 'Max. CR' })).toBeInTheDocument();
    expect(within(table).getByRole('cell', { name: '1/4' })).toBeInTheDocument();
    expect(screen.queryByText(/\{@/)).not.toBeInTheDocument();
  });
});
