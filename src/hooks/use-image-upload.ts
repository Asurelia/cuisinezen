import { useState, useCallback } from 'react';
import { imageService, ImageUploadOptions, UploadResult } from '@/services/image.service';

interface UseImageUploadState {
  uploading: boolean;
  progress: number;
  error: string | null;
  result: UploadResult | null;
}

interface UseImageUploadReturn extends UseImageUploadState {
  uploadImage: (file: File, category: 'product' | 'recipe', options?: ImageUploadOptions) => Promise<UploadResult | null>;
  uploadMultiple: (files: File[], category: 'product' | 'recipe', options?: ImageUploadOptions) => Promise<UploadResult[] | null>;
  reset: () => void;
}

export const useImageUpload = (): UseImageUploadReturn => {
  const [state, setState] = useState<UseImageUploadState>({
    uploading: false,
    progress: 0,
    error: null,
    result: null
  });

  const reset = useCallback(() => {
    setState({
      uploading: false,
      progress: 0,
      error: null,
      result: null
    });
  }, []);

  const uploadImage = useCallback(async (
    file: File,
    category: 'product' | 'recipe',
    options?: ImageUploadOptions
  ): Promise<UploadResult | null> => {
    try {
      setState(prev => ({ ...prev, uploading: true, error: null, progress: 0 }));

      // Simulation du progrès (Firebase ne fournit pas de vraie progression pour les petits fichiers)
      const progressInterval = setInterval(() => {
        setState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        }));
      }, 100);

      const result = await imageService.uploadImage(file, category, options);

      clearInterval(progressInterval);
      setState(prev => ({
        ...prev,
        uploading: false,
        progress: 100,
        result
      }));

      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        uploading: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        progress: 0
      }));
      return null;
    }
  }, []);

  const uploadMultiple = useCallback(async (
    files: File[],
    category: 'product' | 'recipe',
    options?: ImageUploadOptions
  ): Promise<UploadResult[] | null> => {
    try {
      setState(prev => ({ ...prev, uploading: true, error: null, progress: 0 }));

      const results = await imageService.uploadMultipleImages(files, category, options);

      setState(prev => ({
        ...prev,
        uploading: false,
        progress: 100,
        result: results[0] || null // Retourner le premier résultat
      }));

      return results;
    } catch (error) {
      setState(prev => ({
        ...prev,
        uploading: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        progress: 0
      }));
      return null;
    }
  }, []);

  return {
    ...state,
    uploadImage,
    uploadMultiple,
    reset
  };
};