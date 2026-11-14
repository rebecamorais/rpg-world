import { fireEvent, render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Avatar, AvatarFallback, AvatarImage } from './avatar';

function Subject({ src }: { src?: string }) {
  return (
    <Avatar>
      <AvatarImage src={src} alt="Alice" />
      <AvatarFallback>AL</AvatarFallback>
    </Avatar>
  );
}

describe('Avatar', () => {
  afterEach(() => vi.restoreAllMocks());

  it('o HTML do servidor já traz a imagem, para o navegador buscá-la antes do JS', () => {
    const html = renderToString(<Subject src="https://images.test/a.webp" />);

    expect(html).toContain('<img');
    expect(html).toContain('src="https://images.test/a.webp"');
  });

  it('mostra o fallback por baixo enquanto a imagem carrega, e o tira quando ela carrega', () => {
    render(<Subject src="https://images.test/a.webp" />);

    expect(screen.getByText('AL')).toBeInTheDocument();
    fireEvent.load(screen.getByRole('img', { name: 'Alice' }));

    expect(screen.queryByText('AL')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Alice' })).toBeInTheDocument();
  });

  it('uma imagem que já estava carregada (do cache) tira o fallback sem esperar o evento', () => {
    vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true);
    vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(64);

    render(<Subject src="https://images.test/a.webp" />);

    expect(screen.queryByText('AL')).not.toBeInTheDocument();
  });

  it('quando a imagem falha, só o fallback fica', () => {
    render(<Subject src="https://images.test/missing.webp" />);

    fireEvent.error(screen.getByRole('img', { name: 'Alice' }));

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('AL')).toBeInTheDocument();
  });

  it('uma imagem que falhou antes da hidratação também cai no fallback', () => {
    vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true);
    vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(0);

    render(<Subject src="https://images.test/missing.webp" />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('AL')).toBeInTheDocument();
  });

  it('sem src, mostra só o fallback', () => {
    render(<Subject />);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getByText('AL')).toBeInTheDocument();
  });
});
