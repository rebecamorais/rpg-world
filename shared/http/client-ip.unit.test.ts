import { describe, expect, it } from 'vitest';

import { clientIp } from './client-ip';

const request = (headers: HeadersInit) => ({ headers: new Headers(headers) });

describe('clientIp', () => {
  it('usa a primeira entrada do x-forwarded-for', () => {
    expect(clientIp(request({ 'x-forwarded-for': ' 203.0.113.7 , 10.0.0.1' }))).toBe('203.0.113.7');
  });

  it('sem x-forwarded-for, usa o x-real-ip', () => {
    expect(clientIp(request({ 'x-real-ip': '198.51.100.2' }))).toBe('198.51.100.2');
  });

  it('o x-forwarded-for vem antes do x-real-ip', () => {
    expect(
      clientIp(request({ 'x-forwarded-for': '203.0.113.7', 'x-real-ip': '198.51.100.2' })),
    ).toBe('203.0.113.7');
  });

  it.each<Record<string, string>>([{}, { 'x-forwarded-for': ' , ' }, { 'x-real-ip': '  ' }])(
    'sem IP nos cabeçalhos, não inventa um (%o)',
    (headers) => {
      expect(clientIp(request(headers))).toBeUndefined();
    },
  );
});
