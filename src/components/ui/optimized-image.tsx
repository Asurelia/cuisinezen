'use client';

import React, { useState, useRef, useEffect, forwardRef } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  fill?: boolean;
  sizes?: string;
  quality?: number;
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
}

// Base64 blur placeholder généré
const DEFAULT_BLUR_DATA_URL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q==';

const OptimizedImage = forwardRef<HTMLDivElement, OptimizedImageProps>(
  (
    {
      src,
      alt,
      width,
      height,
      className,
      priority = false,
      placeholder = 'blur',
      blurDataURL = DEFAULT_BLUR_DATA_URL,
      fill = false,
      sizes,
      quality = 85,
      onLoad,
      onError,
      fallbackSrc,
      ...props
    },
    ref
  ) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(priority);
    const [hasError, setHasError] = useState(false);
    const [currentSrc, setCurrentSrc] = useState(src);
    const imgRef = useRef<HTMLDivElement>(null);

    // Intersection Observer pour le lazy loading
    useEffect(() => {
      if (priority || !imgRef.current) return;

      const observer = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        },
        {
          threshold: 0.1,
          rootMargin: '50px',
        }
      );

      observer.observe(imgRef.current);

      return () => observer.disconnect();
    }, [priority]);

    const handleLoad = () => {
      setIsLoaded(true);
      onLoad?.();
    };

    const handleError = () => {
      setHasError(true);
      if (fallbackSrc && currentSrc !== fallbackSrc) {
        setCurrentSrc(fallbackSrc);
        setHasError(false);
      } else {
        onError?.();
      }
    };

    // Génération du srcSet pour différentes résolutions
    const generateSrcSet = (baseSrc: string) => {
      if (!baseSrc.startsWith('http')) return undefined;
      
      try {
        const url = new URL(baseSrc);
        const formats = ['webp', 'jpg'];
        const sizes = [640, 750, 828, 1080, 1200, 1920];
        
        return formats
          .map(format => 
            sizes
              .map(size => `${url.origin}${url.pathname}?w=${size}&q=${quality}&f=${format} ${size}w`)
              .join(', ')
          )
          .join(', ');
      } catch {
        return undefined;
      }
    };

    // Ne pas rendre l'image si elle n'est pas encore visible (lazy loading)
    if (!isInView && !priority) {
      return (
        <div
          ref={imgRef}
          className={cn(
            'bg-muted animate-pulse',
            fill ? 'absolute inset-0' : `w-[${width}px] h-[${height}px]`,
            className
          )}
          style={!fill ? { width, height } : undefined}
        />
      );
    }

    return (
      <div
        ref={ref || imgRef}
        className={cn(
          'relative overflow-hidden',
          fill && 'w-full h-full',
          className
        )}
        {...props}
      >
        {/* Image optimisée Next.js */}
        <Image
          src={currentSrc}
          alt={alt}
          width={fill ? undefined : width}
          height={fill ? undefined : height}
          fill={fill}
          sizes={sizes || (fill ? '100vw' : `${width}px`)}
          quality={quality}
          priority={priority}
          placeholder={placeholder}
          blurDataURL={placeholder === 'blur' ? blurDataURL : undefined}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            fill ? 'object-cover' : ''
          )}
          onLoad={handleLoad}
          onError={handleError}
        />

        {/* Skeleton loader pendant le chargement */}
        {!isLoaded && (
          <div
            className={cn(
              'absolute inset-0 bg-muted animate-pulse',
              'flex items-center justify-center text-muted-foreground'
            )}
          >
            <div className="flex flex-col items-center space-y-2">
              <div className="w-8 h-8 border-2 border-current border-t-transparent animate-spin rounded-full opacity-50" />
              <span className="text-xs opacity-70">Chargement...</span>
            </div>
          </div>
        )}

        {/* Fallback en cas d'erreur */}
        {hasError && !fallbackSrc && (
          <div
            className={cn(
              'absolute inset-0 bg-muted',
              'flex items-center justify-center text-muted-foreground'
            )}
          >
            <div className="flex flex-col items-center space-y-2">
              <svg
                className="w-8 h-8 opacity-50"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span className="text-xs opacity-70">Image non disponible</span>
            </div>
          </div>
        )}
      </div>
    );
  }
);

OptimizedImage.displayName = 'OptimizedImage';

export { OptimizedImage };
export type { OptimizedImageProps };