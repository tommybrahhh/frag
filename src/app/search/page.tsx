
import React, { Suspense } from 'react';
import UnifiedSearch from '@/components/features/search/UnifiedSearch';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search Fragrances',
  description: 'Search for perfumes by name, brand, or notes.',
};

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-stone-400">Loading...</div>}>
      <UnifiedSearch />
    </Suspense>
  );
}
