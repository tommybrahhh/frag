'use client';

import { Perfume } from '@/types';
import Link from 'next/link';
import React from 'react';
import Spinner from '@/components/ui/Spinner';

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

  // ADD THIS DEBUG LINE:
  if (results.length > 0) {
    console.log('Debug Search Result Item:', {
      name: results[0].name,
      slug: results[0].slug,
      id: results[0].id
    });
  }

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
      <h2 className="text-xl font-semibold mb-6">
        Results <span className="text-stone-400 font-normal text-sm ml-2">({results.length} shown)</span>
      </h2>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-2xl mb-8">{error}</div>
      )}

      {results.length > 0 ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {results.map(perfume => (
              <div key={perfume.id} className="group bg-white rounded-xl border border-stone-100 p-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <Link href={`/perfume/${perfume.slug || perfume.id}`}>
                  <div className="h-48 flex items-center justify-center p-4 mb-4 bg-stone-50 rounded-lg group-hover:bg-white transition-colors">
                    {perfume.image_url ? (
                      <img 
                        src={perfume.image_url} 
                        alt={perfume.name} 
                        className="h-full object-contain mix-blend-multiply opacity-80 group-hover:opacity-100 transition-opacity" 
                      />
                    ) : (
                      <span className="text-stone-300 text-xs italic">No Image</span>
                    )}
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 truncate mb-1">
                      {perfume.brand}
                    </div>
                    <div className="font-serif text-lg text-stone-900 leading-tight truncate">
                      {perfume.name}
                    </div>
                  </div>
                </Link>
              </div>
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