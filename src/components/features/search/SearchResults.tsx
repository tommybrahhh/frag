'use client';

import { Perfume } from '@/types';
import React from 'react';
import Spinner from '@/components/ui/Spinner';
import FragranceCard from '@/components/features/perfume/FragranceCard';

interface SearchResultsProps {
  loading: boolean;
  error: string | null;
  results: Perfume[];
  currentPage: number;
  totalPages: number;
  onLoadMore: () => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ loading, error, results, currentPage, totalPages, onLoadMore }) => {
  const hasMore = currentPage < totalPages;

  // Initial loading state (page 1)
  if (loading && currentPage === 1) {
    return (
      <div className="mt-8 flex justify-center items-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mt-8">
      

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-2xl mb-8">{error}</div>
      )}

      {results.length > 0 ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {results.map((perfume, index) => (
              <FragranceCard key={`${perfume.id}-${index}`} perfume={perfume} />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-12 pb-12">
              <button
                onClick={onLoadMore}
                disabled={loading}
                className="px-8 py-3 bg-stone-900 text-white rounded-full hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase tracking-widest text-xs font-bold"
              >
                {loading ? 'Loading...' : 'Show More'}
              </button>
            </div>
          )}
        </>
      ) : (
        !loading && <p className="text-stone-500 text-center py-10">No perfumes found with the selected notes. Try a different combination.</p>
      )}
    </div>
  );
};

export default SearchResults;