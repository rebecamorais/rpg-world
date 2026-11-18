import { imageBlob, textAsImage } from '@tests/helpers/image-blob';
import { describe, expect, it } from 'vitest';

import { hasImageSignature } from './avatar';

describe('hasImageSignature', () => {
  it.each(['image/jpeg', 'image/png', 'image/webp'])('aceita um %s de verdade', async (type) => {
    expect(await hasImageSignature(imageBlob(type))).toBe(true);
  });

  it('recusa um texto declarado image/png', async () => {
    expect(await hasImageSignature(textAsImage('image/png'))).toBe(false);
  });

  it('recusa um RIFF que não é WebP (um WAV, por exemplo)', async () => {
    const wav = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x41, 0x56, 0x45]);
    expect(await hasImageSignature(new Blob([wav], { type: 'image/webp' }))).toBe(false);
  });

  it('recusa um arquivo vazio ou menor que a assinatura', async () => {
    expect(await hasImageSignature(new Blob([], { type: 'image/png' }))).toBe(false);
    expect(await hasImageSignature(new Blob([new Uint8Array([0x89, 0x50])]))).toBe(false);
  });
});
