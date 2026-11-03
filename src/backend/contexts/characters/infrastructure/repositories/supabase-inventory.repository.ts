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

/** Whose containers a repository reads and writes: a character's, or a party's (the chest). */
export type InventoryOwner = 'character_id' | 'party_id';

export class SupabaseInventoryRepository implements InventoryRepo {
  constructor(
    private readonly client: SupabaseClient<Database>,
    private readonly owner: InventoryOwner = 'character_id',
  ) {}

  async find(ownerId: string) {
    const { data, error } = await this.client
      .from('containers')
      .select(
        'id, kind, name, position, coins, inventory_items(id, container_id, item_ref, quantity, created_at)',
      )
      .eq(this.owner, ownerId)
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

  async addItem(ownerId: string, containerId: string, ref: string, quantity: number) {
    if (!(await this.ownsContainer(ownerId, containerId))) return null;

    const { data, error } = await this.client.rpc('add_inventory_item', {
      p_container_id: containerId,
      p_item_ref: ref,
      p_quantity: quantity,
    });
    if (error) throw limitError(error) ?? new Error(`Failed to add item: ${error.message}`);
    return toEntry(data);
  }

  async setQuantity(ownerId: string, itemId: string, quantity: number) {
    const ids = await this.containerIds(ownerId);
    const { data, error } = await this.client
      .from('inventory_items')
      .update({ quantity })
      .eq('id', itemId)
      .in('container_id', ids)
      .select('id');
    if (error) throw new Error(`Failed to set item quantity: ${error.message}`);
    return data.length > 0;
  }

  async remove(ownerId: string, itemId: string) {
    const ids = await this.containerIds(ownerId);
    const { data, error } = await this.client
      .from('inventory_items')
      .delete()
      .eq('id', itemId)
      .in('container_id', ids)
      .select('id');
    if (error) throw new Error(`Failed to remove item: ${error.message}`);
    return data.length > 0;
  }

  async setCoins(ownerId: string, containerId: string, coins: Coins) {
    const { data, error } = await this.client
      .from('containers')
      .update({ coins })
      .eq('id', containerId)
      .eq(this.owner, ownerId)
      .select('id');
    if (error) throw new Error(`Failed to set coins: ${error.message}`);
    return data.length > 0;
  }

  private async containerIds(ownerId: string): Promise<string[]> {
    const { data, error } = await this.client
      .from('containers')
      .select('id')
      .eq(this.owner, ownerId);
    if (error) throw new Error(`Failed to fetch containers: ${error.message}`);
    return data.map((row) => row.id);
  }

  private async ownsContainer(ownerId: string, containerId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('containers')
      .select('id')
      .eq('id', containerId)
      .eq(this.owner, ownerId)
      // The coin pouch holds coins, not items
      .neq('kind', 'coin_pouch')
      .maybeSingle();
    if (error) throw new Error(`Failed to fetch container: ${error.message}`);
    return data !== null;
  }
}
