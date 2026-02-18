'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getPerfumeImage, PLACEHOLDER_IMAGE } from '@/lib/perfume-utils';

interface PerfumeImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  priority?: boolean;
}

export default function PerfumeImage({ 
  src, 
  alt, 
  className, 
  fill = false, 
  width, 
  height,
  sizes,
  priority = false
}: PerfumeImageProps) {
  const [imgSrc, setImgSrc] = useState(getPerfumeImage(src));

  // Sync when src prop changes
  useEffect(() => {
    setImgSrc(getPerfumeImage(src));
  }, [src]);

  return (
    <Image 
      src={imgSrc} 
      alt={alt} 
      className={className}
      fill={fill}
      width={!fill ? width : undefined}
      height={!fill ? height : undefined}
      sizes={sizes}
      priority={priority}
      onError={() => setImgSrc(PLACEHOLDER_IMAGE)}
      unoptimized={src?.startsWith('http')} // Optimization: don't double-process external URLs if they are already optimized
    />
  );
}