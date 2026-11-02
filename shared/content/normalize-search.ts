/** Case and accent insensitive: "relampago" finds "Relâmpago". */
export const normalizeSearch = (text: string) =>
  text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
