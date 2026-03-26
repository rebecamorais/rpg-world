export interface StorageRepository {
  /**
   * Uploads a file to the given path and returns the public URL.
   * @param bucket - The storage bucket name.
   * @param path - The path within the bucket (e.g., "user-id/avatar.webp").
   * @param file - The file blob to upload.
   * @returns The public URL of the uploaded file.
   */
  upload(bucket: string, path: string, file: Blob): Promise<string>;

  /**
   * Downloads a file from the given path.
   * @param bucket - The storage bucket name.
   * @param path - The path within the bucket.
   * @returns An object with `data` (Blob) and `contentType`.
   */
  download(bucket: string, path: string): Promise<{ data: Blob; contentType: string }>;
}
