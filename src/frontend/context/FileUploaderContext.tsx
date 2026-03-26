'use client';

import { ReactNode, createContext, useContext, useState } from 'react';

import { toast } from 'sonner';

export type UploadTarget = 'profile' | 'character' | 'item';

export interface UploadParams {
  file: File;
  target: UploadTarget;
  id?: string; // characterId, itemId, etc.
}

interface FileUploaderContextType {
  upload: (params: UploadParams) => Promise<{ url: string }>;
  isUploading: boolean;
  error: string | null;
  lastUploadTimestamp: number;
}

const FileUploaderContext = createContext<FileUploaderContextType | undefined>(undefined);

const endpoints: Record<UploadTarget, (id?: string) => string> = {
  profile: () => '/api/profile/avatar',
  character: (id?: string) => `/api/characters/${id}/avatar`,
  item: (id?: string) => `/api/items/${id}/image`,
};

const getEndpoint = (target: UploadTarget, id?: string): string => {
  const endpointFn = endpoints[target];
  if (!endpointFn) throw new Error(`Invalid upload target: ${target}`);

  if (target !== 'profile' && !id) {
    throw new Error(`ID is required for target: ${target}`);
  }

  return endpointFn(id);
};

export function FileUploaderProvider({ children }: { children: ReactNode }) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUploadTimestamp, setLastUploadTimestamp] = useState<number>(() => Date.now());

  const upload = async ({ file, target, id }: UploadParams): Promise<{ url: string }> => {
    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const endpoint = getEndpoint(target, id);

      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || 'Upload failed');
      }

      const data = await res.json();
      setLastUploadTimestamp(Date.now());
      return data as { url: string };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown upload error';
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <FileUploaderContext.Provider value={{ upload, isUploading, error, lastUploadTimestamp }}>
      {children}
    </FileUploaderContext.Provider>
  );
}

export function useFileUploader() {
  const context = useContext(FileUploaderContext);
  if (context === undefined) {
    throw new Error('useFileUploader must be used within a FileUploaderProvider');
  }
  return context;
}
