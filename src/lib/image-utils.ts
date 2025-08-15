/**
 * Utilitaires pour l'optimisation des images
 */

// Placeholders blur par catégorie d'image
export const BLUR_PLACEHOLDERS = {
  // Placeholder par défaut (gris neutre)
  default: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==',
  
  // Placeholder pour produits alimentaires (tons chauds)
  food: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==',
  
  // Placeholder pour plats cuisinés (tons orange/rouge)
  recipe: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==',
} as const;

export type BlurPlaceholderType = keyof typeof BLUR_PLACEHOLDERS;

/**
 * Génère un placeholder blur adapté au type d'image
 */
export function getBlurPlaceholder(type: BlurPlaceholderType = 'default'): string {
  return BLUR_PLACEHOLDERS[type] || BLUR_PLACEHOLDERS.default;
}

/**
 * Génère des srcset responsives pour différentes résolutions
 */
export function generateResponsiveSizes(baseWidth: number): string {
  const breakpoints = [
    { size: 640, descriptor: '(max-width: 640px)' },
    { size: 750, descriptor: '(max-width: 750px)' },
    { size: 828, descriptor: '(max-width: 828px)' },
    { size: 1080, descriptor: '(max-width: 1080px)' },
    { size: 1200, descriptor: '(max-width: 1200px)' },
    { size: 1920, descriptor: '(max-width: 1920px)' },
  ];

  return breakpoints
    .filter(bp => bp.size <= baseWidth * 2) // Ne générer que jusqu'à 2x la taille de base
    .map(bp => `${bp.descriptor} ${bp.size}px`)
    .join(', ') + `, ${baseWidth}px`;
}

/**
 * Convertit une image en WebP avec fallback
 */
export function getOptimizedImageSrc(src: string, options: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpg';
} = {}): string {
  // Si c'est une URL externe ou un placeholder, on la retourne telle quelle
  if (src.startsWith('http') || src.startsWith('data:')) {
    return src;
  }

  const { width, height, quality = 85, format = 'webp' } = options;
  const params = new URLSearchParams();
  
  if (width) params.set('w', width.toString());
  if (height) params.set('h', height.toString());
  params.set('q', quality.toString());
  params.set('f', format);

  return `${src}?${params.toString()}`;
}

/**
 * Précharge une image de manière optimisée
 */
export function preloadImage(src: string, priority: 'high' | 'low' = 'low'): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    // Configuration pour le preloading
    if ('loading' in img) {
      img.loading = priority === 'high' ? 'eager' : 'lazy';
    }
    
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to preload image: ${src}`));
    
    img.src = src;
  });
}

/**
 * Précharge plusieurs images avec gestion de la priorité
 */
export async function preloadImages(
  images: Array<{ src: string; priority?: 'high' | 'low' }>,
  concurrency = 3
): Promise<void> {
  const highPriorityImages = images.filter(img => img.priority === 'high');
  const lowPriorityImages = images.filter(img => img.priority !== 'high');

  // Précharger d'abord les images haute priorité
  if (highPriorityImages.length > 0) {
    await Promise.allSettled(
      highPriorityImages.map(img => preloadImage(img.src, 'high'))
    );
  }

  // Puis les images basse priorité par batch
  for (let i = 0; i < lowPriorityImages.length; i += concurrency) {
    const batch = lowPriorityImages.slice(i, i + concurrency);
    await Promise.allSettled(
      batch.map(img => preloadImage(img.src, 'low'))
    );
  }
}

/**
 * Détecte si le navigateur supporte WebP
 */
export function supportsWebP(): Promise<boolean> {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
}

/**
 * Détecte si le navigateur supporte AVIF
 */
export function supportsAVIF(): Promise<boolean> {
  return new Promise((resolve) => {
    const avif = new Image();
    avif.onload = avif.onerror = () => {
      resolve(avif.height === 2);
    };
    avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  });
}

/**
 * Obtient le format d'image optimal supporté par le navigateur
 */
export async function getOptimalImageFormat(): Promise<'avif' | 'webp' | 'jpg'> {
  try {
    if (await supportsAVIF()) return 'avif';
    if (await supportsWebP()) return 'webp';
    return 'jpg';
  } catch {
    return 'jpg';
  }
}

/**
 * Cache simple pour stocker les formats supportés
 */
class ImageFormatCache {
  private cache: Map<string, boolean> = new Map();

  async isSupported(format: 'webp' | 'avif'): Promise<boolean> {
    if (this.cache.has(format)) {
      return this.cache.get(format)!;
    }

    const supported = format === 'webp' ? await supportsWebP() : await supportsAVIF();
    this.cache.set(format, supported);
    return supported;
  }
}

export const imageFormatCache = new ImageFormatCache();