'use client';

import { useState } from 'react';
import Image from 'next/image';

interface PerfumeImageProps {
  src: string | null;
  alt: string;
  className?: string;
}

export default function PerfumeImage({ src, alt, className }: PerfumeImageProps) {
  const [error, setError] = useState(false);

  // Fallback Placeholder (A generic bottle silhouette or similar)
  // You can replace this SVG with a local asset like '/images/bottle-placeholder.png'
  const fallbackSrc = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23e5e7eb'%3E%3Cpath d='M9 3v2h6V3h-6zm0 4h6v2h-6V7zm-2 4v10h10V11H7z'/%3E%3C/svg%3E`;

  if (!src || error) {
    return (
      <div className={`flex items-center justify-center bg-stone-100 ${className}`}>
        <span className="text-2xl opacity-20">🧴</span>
      </div>
    );
  }

  return (
    <img 
      src={src} 
      alt={alt} 
      className={className}
      onError={() => setError(true)}
      loading="lazy"
    />
  );
}