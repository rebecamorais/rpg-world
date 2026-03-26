import 'server-only';

import { StorageRepository } from '../../../../shared/domain/StorageRepository';
import { CharacterRepo } from '../../domain/repository/character.repo';

export class UploadCharacterAvatarUseCase {
  constructor(
    private readonly storageRepository: StorageRepository,
    private readonly characterRepository: CharacterRepo,
  ) {}

  async execute(characterId: string, userId: string, file: Blob): Promise<string> {
    // 1. Check if character exists and belongs to user
    const character = await this.characterRepository.findById(characterId);
    if (!character) {
      throw new Error('Character not found');
    }

    if (character.ownerUsername !== userId) {
      throw new Error('Unauthorized: You do not own this character');
    }

    // 2. Validate file (size, type)
    if (file.size > 2 * 1024 * 1024) {
      throw new Error('File too large (max 2MB)');
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new Error(`Invalid file type: ${file.type}. Allowed: jpeg, png, webp`);
    }

    // 3. Upload to storage
    const bucket = 'avatars'; // Use existing avatars bucket
    const extension = file.type.split('/')[1];
    // Ensure the path starts with userId to comply with RLS policies
    const path = `${userId}/characters/${characterId}.${extension}`;

    const publicUrl = await this.storageRepository.upload(bucket, path, file);

    // 4. Update character entity (Note: repo should handle this persistence)
    // Actually, in our current architecture, the character record in DB should store this URL.
    // The repository handles the mapping.
    // However, the 'save' method currently takes a whole character object.
    // Let's just update the URL in the DB directly if we want speed,
    // or use the domain model.

    // For now, let's assume we just return the URL and the frontend will update the character
    // via the normal save flow, OR we update it here if it's considered part of the 'upload' action.
    // The user said 'filepicker igual o de perfil', and profile upload UPDATES the profile immediately.

    // Let's update the character record in DB.
    // Since I don't have a 'partial update' in character repo yet,
    // I might need to add one or just reuse save().

    // I'll return the URL and let the API caller (the route) decide if it needs to update the DB.
    // In profile, the api route does NOT update the DB, it just returns the URL
    // and the ProfileForm frontend then calls updateProfile().

    return publicUrl;
  }
}
