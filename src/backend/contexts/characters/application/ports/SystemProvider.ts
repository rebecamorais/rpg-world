export interface SystemProvider {
  /**
   * Busca os detalhes de uma magia em uma API externa ou banco estático
   * @param spellIndex Identificador único da magia
   */
  getSpellDetails(spellIndex: string): Promise<Record<string, unknown> | null>;

  /**
   * Busca uma lista de monstros, itens ou outras entidades externas baseadas no nome.
   */
  searchEntity(query: string, type: 'monster' | 'item' | 'spell'): Promise<unknown[]>;
}
