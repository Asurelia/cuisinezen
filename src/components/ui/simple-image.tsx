'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface SimpleImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  quality?: number;
}

// Composant image simplifié sans hooks complexes
const SimpleImage: React.FC<SimpleImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  fill = false,
  sizes,
  quality = 85,
  ...props
}) => {
  return (
    <div className={cn('overflow-hidden', className)}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        sizes={sizes}
        quality={quality}
        priority={priority}
        className="object-cover transition-opacity duration-300"
        {...props}
      />
    </div>
  );
};

export default SimpleImage;