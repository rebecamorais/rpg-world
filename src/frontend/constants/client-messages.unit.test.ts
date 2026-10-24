import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import en from '../../../messages/en.json';
import { SERVER_ONLY_NAMESPACES, clientMessages } from './client-messages';

const sources = execFileSync('git', ['ls-files', 'src', 'app'], { encoding: 'utf-8' })
  .split('\n')
  .filter((file) => /\.(ts|tsx)$/.test(file) && !file.includes('.test.'));

describe('mensagens entregues ao cliente', () => {
  it('nenhum useTranslations lê um namespace que só vai para o servidor', () => {
    const namespaces = SERVER_ONLY_NAMESPACES.join('|');
    const clientRead = new RegExp(`useTranslations\\(\\s*['"](${namespaces})['".]`);
    const offenders = sources.filter((file) => clientRead.test(readFileSync(file, 'utf-8')));

    expect(offenders).toEqual([]);
  });

  it('tira só os namespaces do servidor', () => {
    const kept = Object.keys(clientMessages(en));

    expect(kept).toEqual(
      Object.keys(en).filter((ns) => !(SERVER_ONLY_NAMESPACES as readonly string[]).includes(ns)),
    );
    for (const ns of SERVER_ONLY_NAMESPACES) expect(Object.keys(en)).toContain(ns);
  });
});
