import { describe, expect, it } from 'vitest';

import { googleDocUrl, parseGoogleDocId } from './google-docs';

const ID = '1AbCdEfGhIjKlMnOpQrStUvWxYz_0123456789-ab';

describe('google-docs', () => {
  describe('parseGoogleDocId', () => {
    it.each([
      `https://docs.google.com/document/d/${ID}/edit?usp=sharing`,
      `docs.google.com/document/d/${ID}`,
      `https://docs.google.com/document/u/1/d/${ID}/view#heading=h.x`,
      `  https://docs.google.com/document/d/${ID}/preview  `,
      ID,
    ])('extrai o ID de %j', (input) => {
      expect(parseGoogleDocId(input)).toBe(ID);
    });

    it.each([
      `https://docs.google.com/spreadsheets/d/${ID}/edit`,
      `https://drive.google.com/file/d/${ID}/view`,
      `https://evil.com/document/d/${ID}`,
      `https://docs.google.com.evil.com/document/d/${ID}`,
      'javascript:alert(1)',
      '',
      'curto',
    ])('recusa %j', (input) => {
      expect(parseGoogleDocId(input)).toBeNull();
    });
  });

  it('googleDocUrl monta a URL de edição', () => {
    expect(googleDocUrl(ID)).toBe(`https://docs.google.com/document/d/${ID}/edit`);
  });
});
