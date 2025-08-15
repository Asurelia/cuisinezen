import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject, 
  listAll,
  StorageReference,
  UploadResult
} from 'firebase/storage';
import { storage } from '@/lib/firebase';

// Types pour les différentes tailles d'images
export type ImageSize = 'small' | 'medium' | 'large' | 'original';

// Configuration des tailles de thumbnails
const THUMBNAIL_SIZES = {
  small: { width: 150, height: 150, quality: 0.8 },
  medium: { width: 400, height: 400, quality: 0.85 },
  large: { width: 800, height: 800, quality: 0.9 }
} as const;

// Limite de taille de fichier (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB en bytes

// Types supportés
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// Interface pour les métadonnées d'upload
export interface UploadMetadata {
  originalName: string;
  size: number;
  type: string;
  uploadedAt: string;
  userId?: string;
  category: 'product' | 'recipe';
}

// Interface pour les URLs générées
export interface ImageUrls {
  original: string;
  large: string;
  medium: string;
  small: string;
}

// Interface pour le résultat d'upload
export interface UploadResult {
  id: string;
  urls: ImageUrls;
  metadata: UploadMetadata;
}

class StorageService {
  private static instance: StorageService;

  private constructor() {
    if (!storage) {
      throw new Error('Firebase Storage is not initialized');
    }
  }

  public static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  /**
   * Valide le fichier avant l'upload
   */
  private validateFile(file: File): void {
    // Vérifier la taille
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`La taille du fichier ne peut pas dépasser ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    // Vérifier le type
    if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
      throw new Error(`Type de fichier non supporté. Types acceptés: ${SUPPORTED_IMAGE_TYPES.join(', ')}`);
    }
  }

  /**
   * Compresse une image en utilisant Canvas
   */
  private async compressImage(
    file: File, 
    maxWidth: number, 
    maxHeight: number, 
    quality: number
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculer les nouvelles dimensions en conservant le ratio
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Dessiner l'image redimensionnée
        ctx?.drawImage(img, 0, 0, width, height);

        // Convertir en WebP si supporté, sinon JPEG
        const outputFormat = this.supportsWebP() ? 'image/webp' : 'image/jpeg';
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Erreur lors de la compression de l\'image'));
            }
          },
          outputFormat,
          quality
        );
      };

      img.onerror = () => reject(new Error('Erreur lors du chargement de l\'image'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Vérifie si le navigateur supporte WebP
   */
  private supportsWebP(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }

  /**
   * Génère un ID unique pour l'image
   */
  private generateImageId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Crée les références Storage pour toutes les tailles
   */
  private createStorageRefs(category: string, imageId: string): Record<ImageSize, StorageReference> {
    if (!storage) throw new Error('Storage not initialized');

    return {
      original: ref(storage, `${category}/${imageId}/original`),
      large: ref(storage, `${category}/${imageId}/large`),
      medium: ref(storage, `${category}/${imageId}/medium`),
      small: ref(storage, `${category}/${imageId}/small`)
    };
  }

  /**
   * Upload une image avec génération automatique de thumbnails
   */
  public async uploadImage(
    file: File,
    category: 'product' | 'recipe',
    userId?: string
  ): Promise<UploadResult> {
    try {
      // Validation du fichier
      this.validateFile(file);

      const imageId = this.generateImageId();
      const storageRefs = this.createStorageRefs(category, imageId);

      // Métadonnées
      const metadata: UploadMetadata = {
        originalName: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        userId,
        category
      };

      // Upload de l'image originale
      await uploadBytes(storageRefs.original, file);

      // Génération et upload des thumbnails
      const thumbnailPromises = Object.entries(THUMBNAIL_SIZES).map(async ([size, config]) => {
        const compressedBlob = await this.compressImage(
          file,
          config.width,
          config.height,
          config.quality
        );
        return uploadBytes(storageRefs[size as keyof typeof THUMBNAIL_SIZES], compressedBlob);
      });

      await Promise.all(thumbnailPromises);

      // Récupération des URLs de téléchargement
      const urls: ImageUrls = {
        original: await getDownloadURL(storageRefs.original),
        large: await getDownloadURL(storageRefs.large),
        medium: await getDownloadURL(storageRefs.medium),
        small: await getDownloadURL(storageRefs.small)
      };

      return {
        id: imageId,
        urls,
        metadata
      };

    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      throw error;
    }
  }

  /**
   * Supprime une image et tous ses thumbnails
   */
  public async deleteImage(category: 'product' | 'recipe', imageId: string): Promise<void> {
    try {
      const storageRefs = this.createStorageRefs(category, imageId);

      const deletePromises = Object.values(storageRefs).map(async (ref) => {
        try {
          await deleteObject(ref);
        } catch (error) {
          // Ignore si le fichier n'existe pas
          console.warn(`Fichier non trouvé: ${ref.fullPath}`);
        }
      });

      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      throw error;
    }
  }

  /**
   * Récupère l'URL d'une image spécifique
   */
  public async getImageUrl(
    category: 'product' | 'recipe',
    imageId: string,
    size: ImageSize = 'medium'
  ): Promise<string> {
    try {
      if (!storage) throw new Error('Storage not initialized');
      
      const imageRef = ref(storage, `${category}/${imageId}/${size}`);
      return await getDownloadURL(imageRef);
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'URL:', error);
      throw error;
    }
  }

  /**
   * Récupère toutes les URLs d'une image
   */
  public async getAllImageUrls(
    category: 'product' | 'recipe',
    imageId: string
  ): Promise<ImageUrls> {
    try {
      const storageRefs = this.createStorageRefs(category, imageId);

      const urlPromises = Object.entries(storageRefs).map(async ([size, ref]) => {
        try {
          const url = await getDownloadURL(ref);
          return [size, url];
        } catch (error) {
          console.warn(`URL non disponible pour ${size}:`, error);
          return [size, ''];
        }
      });

      const urlEntries = await Promise.all(urlPromises);
      return Object.fromEntries(urlEntries) as ImageUrls;
    } catch (error) {
      console.error('Erreur lors de la récupération des URLs:', error);
      throw error;
    }
  }

  /**
   * Liste toutes les images d'une catégorie
   */
  public async listImages(category: 'product' | 'recipe'): Promise<string[]> {
    try {
      if (!storage) throw new Error('Storage not initialized');
      
      const categoryRef = ref(storage, category);
      const result = await listAll(categoryRef);
      
      // Extraire les IDs des dossiers (chaque dossier = un imageId)
      return result.prefixes.map(prefix => {
        const pathParts = prefix.fullPath.split('/');
        return pathParts[pathParts.length - 1];
      });
    } catch (error) {
      console.error('Erreur lors de la liste des images:', error);
      return [];
    }
  }

  /**
   * Nettoie les images non utilisées
   * Cette méthode devrait être appelée périodiquement
   */
  public async cleanupUnusedImages(
    category: 'product' | 'recipe',
    usedImageIds: string[]
  ): Promise<number> {
    try {
      const allImages = await this.listImages(category);
      const unusedImages = allImages.filter(id => !usedImageIds.includes(id));

      let deletedCount = 0;
      for (const imageId of unusedImages) {
        try {
          await this.deleteImage(category, imageId);
          deletedCount++;
        } catch (error) {
          console.warn(`Impossible de supprimer l'image ${imageId}:`, error);
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('Erreur lors du nettoyage:', error);
      return 0;
    }
  }

  /**
   * Optimise une image existante (regenere les thumbnails)
   */
  public async optimizeImage(
    category: 'product' | 'recipe',
    imageId: string
  ): Promise<ImageUrls> {
    try {
      if (!storage) throw new Error('Storage not initialized');
      
      // Récupérer l'image originale
      const originalRef = ref(storage, `${category}/${imageId}/original`);
      const originalUrl = await getDownloadURL(originalRef);

      // Télécharger l'image originale
      const response = await fetch(originalUrl);
      const blob = await response.blob();
      const file = new File([blob], 'image', { type: blob.type });

      // Regenerer les thumbnails
      const storageRefs = this.createStorageRefs(category, imageId);
      
      const thumbnailPromises = Object.entries(THUMBNAIL_SIZES).map(async ([size, config]) => {
        const compressedBlob = await this.compressImage(
          file,
          config.width,
          config.height,
          config.quality
        );
        return uploadBytes(storageRefs[size as keyof typeof THUMBNAIL_SIZES], compressedBlob);
      });

      await Promise.all(thumbnailPromises);

      // Retourner les nouvelles URLs
      return await this.getAllImageUrls(category, imageId);
    } catch (error) {
      console.error('Erreur lors de l\'optimisation:', error);
      throw error;
    }
  }
}

// Export de l'instance singleton
export const storageService = StorageService.getInstance();

// Export des types et constantes utiles
export { THUMBNAIL_SIZES, MAX_FILE_SIZE, SUPPORTED_IMAGE_TYPES };