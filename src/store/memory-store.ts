import type { User } from '@/types/user';
import type { DnD5eCharacter } from '@/systems/dnd5e';

const users = new Map<string, User>();
const characters = new Map<string, DnD5eCharacter>();

export function addUser(user: User): User {
  if (users.has(user.username)) {
    return users.get(user.username)!;
  }
  users.set(user.username, { ...user });
  return users.get(user.username)!;
}

export function getUserByUsername(username: string): User | undefined {
  return users.get(username);
}

export function getOrCreateUser(username: string, displayName?: string): User {
  const existing = users.get(username);
  if (existing) {
    if (displayName !== undefined) {
      const updated = { ...existing, displayName };
      users.set(username, updated);
      return updated;
    }
    return existing;
  }
  const user: User = { username, displayName };
  users.set(username, user);
  return user;
}

export function getAllUsernames(): string[] {
  return Array.from(users.keys());
}

export function addCharacter(character: DnD5eCharacter): DnD5eCharacter {
  characters.set(character.id, { ...character });
  return character;
}

export function getCharacterById(id: string): DnD5eCharacter | undefined {
  return characters.get(id);
}

export function getCharactersByOwner(ownerUsername: string): DnD5eCharacter[] {
  return Array.from(characters.values()).filter(
    (c) => c.ownerUsername === ownerUsername
  );
}

export function updateCharacter(
  id: string,
  ownerUsername: string,
  updates: Partial<Omit<DnD5eCharacter, 'id' | 'ownerUsername' | 'system'>>
): DnD5eCharacter | null {
  const existing = characters.get(id);
  if (!existing || existing.ownerUsername !== ownerUsername) return null;
  const updated: DnD5eCharacter = { ...existing, ...updates };
  characters.set(id, updated);
  return updated;
}

export function deleteCharacter(id: string, ownerUsername: string): boolean {
  const existing = characters.get(id);
  if (!existing || existing.ownerUsername !== ownerUsername) return false;
  characters.delete(id);
  return true;
}
