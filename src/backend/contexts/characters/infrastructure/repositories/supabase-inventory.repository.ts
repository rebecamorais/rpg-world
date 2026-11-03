import { SupabaseClient } from '@supabase/supabase-js';

import type { Coins } from '@shared/systems/dnd5e/coins';

import { Database } from '@database-types';

import { CharacterError, CharacterErrorCodes } from '../../domain/CharacterError';
import {
  InventoryContainer,
  InventoryEntry,
  InventoryRepo,
} from '../../domain/repository/inventory.repo';

type ItemRow = Database['public']['Tables']['inventory_items']['Row'];

const toEntry = (row: ItemRow): InventoryEntry => ({
  id: row.id,
  containerId: row.container_id,
  ref: row.item_ref,
  quantity: row.quantity,
});

/** The database triggers raise these as P0001 with the rule's name as the message. */
function limitError(error: { code?: string; message: string }): CharacterError | null {
  if (error.code !== 'P0001') return null;
  if (error.message === 'item_limit') return new CharacterError(CharacterErrorCodes.ITEM_LIMIT);
  if (error.message === 'container_limit') {
    return new CharacterError(CharacterErrorCodes.CONTAINER_LIMIT);
  }
  return null;
}

export class SupabaseInventoryRepository implements InventoryRepo {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async find(characterId: string) {
    const { data, error } = await this.client
      .from('containers')
      .select(
        'id, kind, name, position, coins, inventory_items(id, container_id, item_ref, quantity, created_at)',
      )
      .eq('character_id', characterId)
      .order('position')
      .order('created_at')
      .order('id');
    if (error) throw new Error(`Failed to fetch inventory: ${error.message}`);

    const containers: InventoryContainer[] = data.map((row) => ({
      id: row.id,
      kind: row.kind as InventoryContainer['kind'],
      name: row.name,
      position: row.position,
      coins: row.coins as Coins,
    }));
    const items = data
      .flatMap((row) => row.inventory_items)
      .sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id))
      .map(toEntry);
    return { containers, items };
  }

  async addItem(characterId: string, containerId: string, ref: string, quantity: number) {
    if (!(await this.ownsContainer(characterId, containerId))) return null;

    const { data, error } = await this.client.rpc('add_inventory_item', {
      p_container_id: containerId,
      p_item_ref: ref,
      p_quantity: quantity,
    });
    if (error) throw limitError(error) ?? new Error(`Failed to add item: ${error.message}`);
    return toEntry(data);
  }

  async setQuantity(characterId: string, itemId: string, quantity: number) {
    const ids = await this.containerIds(characterId);
    const { data, error } = await this.client
      .from('inventory_items')
      .update({ quantity })
      .eq('id', itemId)
      .in('container_id', ids)
      .select('id');
    if (error) throw new Error(`Failed to set item quantity: ${error.message}`);
    return data.length > 0;
  }

  async remove(characterId: string, itemId: string) {
    const ids = await this.containerIds(characterId);
    const { data, error } = await this.client
      .from('inventory_items')
      .delete()
      .eq('id', itemId)
      .in('container_id', ids)
      .select('id');
    if (error) throw new Error(`Failed to remove item: ${error.message}`);
    return data.length > 0;
  }

  async setCoins(characterId: string, containerId: string, coins: Coins) {
    const { data, error } = await this.client
      .from('containers')
      .update({ coins })
      .eq('id', containerId)
      .eq('character_id', characterId)
      .select('id');
    if (error) throw new Error(`Failed to set coins: ${error.message}`);
    return data.length > 0;
  }

  private async containerIds(characterId: string): Promise<string[]> {
    const { data, error } = await this.client
      .from('containers')
      .select('id')
      .eq('character_id', characterId);
    if (error) throw new Error(`Failed to fetch containers: ${error.message}`);
    return data.map((row) => row.id);
  }

  private async ownsContainer(characterId: string, containerId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('containers')
      .select('id')
      .eq('id', containerId)
      .eq('character_id', characterId)
      // The coin pouch holds coins, not items
      .neq('kind', 'coin_pouch')
      .maybeSingle();
    if (error) throw new Error(`Failed to fetch container: ${error.message}`);
    return data !== null;
  }
}
