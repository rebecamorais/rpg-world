export interface StorageRepository {
  /**
   * Uploads a file to the given path and returns the public URL.
   * @param bucket - The storage bucket name.
   * @param path - The path within the bucket (e.g., "user-id/avatar.webp").
   * @param file - The file blob to upload.
   * @returns The public URL of the uploaded file.
   */
  upload(bucket: string, path: string, file: Blob): Promise<string>;
}
