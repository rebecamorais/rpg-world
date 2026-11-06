import { describe, expect, it } from 'vitest';

import { avatarPathOf, fullImageUrl } from './avatar-files';

describe('fullImageUrl', () => {
  it('tira o sufixo do avatar de um personagem', () => {
    expect(
      fullImageUrl('https://images.rpgworldapp.com/avatars/u/characters/c-1-avatar.webp'),
    ).toBe('https://images.rpgworldapp.com/avatars/u/characters/c-1.webp');
  });

  it('imagem antiga não tem imagem completa', () => {
    expect(fullImageUrl('https://x.test/avatars/u/characters/c-1.webp')).toBeNull();
  });

  it('avatar de perfil não tem imagem completa', () => {
    expect(fullImageUrl('https://x.test/avatars/u/avatar-1-avatar.webp')).toBeNull();
  });

  it('imagem da demo e do seed não tem imagem completa', () => {
    expect(fullImageUrl('/demo/pioneers/golden-oath.webp')).toBeNull();
  });
});

describe('avatarPathOf', () => {
  it('coloca o sufixo antes da extensão', () => {
    expect(avatarPathOf('u/characters/c-1.webp')).toBe('u/characters/c-1-avatar.webp');
  });
});
