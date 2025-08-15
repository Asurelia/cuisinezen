"use client";

import { useState, useEffect } from 'react';
import { useImage } from '@/hooks/use-image';
import { ImageSize, ImageGetOptions } from '@/services/image.service';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { ImageIcon, AlertCircle } from 'lucide-react';

interface OptimizedImageProps {
  category: 'product' | 'recipe';
  imageId: string;
  alt: string;
  size?: ImageSize;
  className?: string;
  fallbackClassName?: string;
  priority?: boolean;
  responsive?: boolean;
  transformations?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'jpeg';
  };
  onLoad?: () => void;
  onError?: (error: string) => void;
}

export function OptimizedImage({
  category,
  imageId,
  alt,
  size = 'medium',
  className,
  fallbackClassName,
  priority = false,
  responsive = false,
  transformations,
  onLoad,
  onError
}: OptimizedImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [responsiveData, setResponsiveData] = useState<{
    src: string;
    srcSet: string;
    sizes: string;
  } | null>(null);

  const options: ImageGetOptions = {
    useCache: true,
    size,
    transformations
  };

  const { loading, error, url, urls, getResponsive } = useImage(category, imageId, options);

  // Charger les données responsive si nécessaire
  useEffect(() => {
    if (responsive && urls && !loading) {
      getResponsive().then(data => {
        setResponsiveData(data);
      }).catch(err => {
        console.warn('Erreur lors du chargement responsive:', err);
      });
    }
  }, [responsive, urls, loading, getResponsive]);

  // Gestion des callbacks
  useEffect(() => {
    if (error) {
      onError?.(error);
    }
  }, [error, onError]);

  const handleImageLoad = () => {
    setImageLoaded(true);
    onLoad?.();
  };

  const handleImageError = () => {
    setImageError(true);
    onError?.('Erreur lors du chargement de l\'image');
  };

  // État de chargement
  if (loading) {
    return (
      <Skeleton 
        className={cn("w-full h-full", className)} 
        aria-label="Chargement de l'image..."
      />
    );
  }

  // État d'erreur
  if (error || imageError || !url) {
    return (
      <div 
        className={cn(
          "flex flex-col items-center justify-center bg-muted text-muted-foreground border border-dashed border-muted-foreground/25 rounded-lg p-4",
          fallbackClassName || className
        )}
        role="img"
        aria-label={`Erreur: ${alt}`}
      >
        <AlertCircle className="w-6 h-6 mb-2" />
        <span className="text-sm text-center">Image non disponible</span>
      </div>
    );
  }

  // Affichage responsive
  if (responsive && responsiveData) {
    return (
      <picture className={cn("block", className)}>
        {/* Source WebP si supportée */}
        <source
          srcSet={responsiveData.srcSet.replace(/\.(jpg|jpeg|png)/g, '.webp')}
          sizes={responsiveData.sizes}
          type="image/webp"
        />
        {/* Fallback */}
        <img
          src={responsiveData.src}
          srcSet={responsiveData.srcSet}
          sizes={responsiveData.sizes}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            imageLoaded ? "opacity-100" : "opacity-0",
            className
          )}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      </picture>
    );
  }

  // Affichage simple
  return (
    <img
      src={url}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      className={cn(
        "w-full h-full object-cover transition-opacity duration-300",
        imageLoaded ? "opacity-100" : "opacity-0",
        className
      )}
      onLoad={handleImageLoad}
      onError={handleImageError}
    />
  );
}

// Composant pour afficher une galerie d'images
interface ImageGalleryProps {
  category: 'product' | 'recipe';
  imageIds: string[];
  className?: string;
  imageClassName?: string;
  cols?: number;
  gap?: number;
  onImageClick?: (imageId: string, urls: any) => void;
}

export function ImageGallery({
  category,
  imageIds,
  className,
  imageClassName,
  cols = 3,
  gap = 4,
  onImageClick
}: ImageGalleryProps) {
  if (imageIds.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center p-8 text-muted-foreground", className)}>
        <ImageIcon className="w-12 h-12 mb-3" />
        <p className="text-sm">Aucune image disponible</p>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "grid auto-rows-[200px]",
        className
      )}
      style={{
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: `${gap * 0.25}rem`
      }}
    >
      {imageIds.map((imageId, index) => (
        <div
          key={imageId}
          className={cn(
            "relative overflow-hidden rounded-lg cursor-pointer group",
            // Effet masonry simple
            index % 3 === 0 && "row-span-2",
            imageClassName
          )}
          onClick={() => onImageClick?.(imageId, null)}
        >
          <OptimizedImage
            category={category}
            imageId={imageId}
            alt={`Image ${index + 1}`}
            size="medium"
            responsive
            className="group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
        </div>
      ))}
    </div>
  );
}

// Composant pour l'avatar d'image (rond, carré, etc.)
interface ImageAvatarProps {
  category: 'product' | 'recipe';
  imageId: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'circle' | 'square' | 'rounded';
  className?: string;
}

export function ImageAvatar({
  category,
  imageId,
  alt,
  size = 'md',
  variant = 'circle',
  className
}: ImageAvatarProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const variantClasses = {
    circle: 'rounded-full',
    square: 'rounded-none',
    rounded: 'rounded-lg'
  };

  return (
    <div 
      className={cn(
        "relative overflow-hidden flex-shrink-0",
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
    >
      <OptimizedImage
        category={category}
        imageId={imageId}
        alt={alt}
        size="small"
        className="w-full h-full"
      />
    </div>
  );
}