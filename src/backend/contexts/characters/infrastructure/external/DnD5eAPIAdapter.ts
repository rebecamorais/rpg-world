import { ISystemProvider } from '../../application/ports/ISystemProvider';

export class DnD5eAPIAdapter implements ISystemProvider {
  private baseUrl = 'https://www.dnd5eapi.co/api';

  async getSpellDetails(
    spellIndex: string,
  ): Promise<Record<string, unknown> | null> {
    try {
      const res = await fetch(`${this.baseUrl}/spells/${spellIndex}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (error) {
      console.error(`Failed to fetch spell ${spellIndex}`, error);
      return null;
    }
  }

  async searchEntity(
    query: string,
    type: 'monster' | 'item' | 'spell',
  ): Promise<unknown[]> {
    let endpoint = '';
    if (type === 'spell') endpoint = 'spells';
    else if (type === 'monster') endpoint = 'monsters';
    else if (type === 'item') endpoint = 'magic-items';

    if (!endpoint) return [];

    try {
      const res = await fetch(
        `${this.baseUrl}/${endpoint}?name=${encodeURIComponent(query)}`,
      );
      if (!res.ok) return [];
      const data = await res.json();
      return data.results || [];
    } catch (error) {
      console.error(`Failed to search ${type}`, error);
      return [];
    }
  }
}
