'use client';

import { motion } from 'framer-motion';

export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-100 dark:border-stone-800 p-4">
      <div className="h-40 bg-stone-100 dark:bg-stone-800 rounded-lg mb-4 animate-pulse"></div>
      <div className="text-center">
        <div className="h-3 bg-stone-200 dark:bg-stone-700 rounded-full mb-2 w-3/4 mx-auto animate-pulse"></div>
        <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded-full w-1/2 mx-auto animate-pulse"></div>
      </div>
    </div>
  );
}

export function SkeletonProfileHeader() {
  return (
    <div className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 pt-32 pb-12 px-6">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-end gap-8">
        {/* Avatar Skeleton */}
        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-stone-100 dark:bg-stone-800 border-4 border-white dark:border-stone-800 shadow-xl animate-pulse"></div>
        </div>
        
        {/* Info Skeleton */}
        <div className="flex-1 w-full space-y-4">
          <div className="h-12 bg-stone-200 dark:bg-stone-700 rounded animate-pulse w-3/4"></div>
          <div className="h-6 bg-stone-200 dark:bg-stone-700 rounded animate-pulse w-full"></div>
          <div className="h-6 bg-stone-200 dark:bg-stone-700 rounded animate-pulse w-2/3"></div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonTabs() {
  return (
    <div className="flex gap-8 border-b border-stone-200 dark:border-stone-800 mb-8">
      {[1, 2].map((i) => (
        <div key={i} className="pb-4">
          <div className="h-4 bg-stone-200 dark:bg-stone-700 rounded-full w-24 animate-pulse"></div>
        </div>
      ))}
    </div>
  );
}

export default function SkeletonLoader() {
  return (
    <div className="min-h-screen bg-[#FAFAF9] dark:bg-stone-950 pb-24 font-sans">
      <SkeletonProfileHeader />
      
      <div className="max-w-5xl mx-auto px-6 mt-12">
        {/* Analytics Skeleton */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-8 border border-stone-100 dark:border-stone-800 shadow-sm">
            <div className="h-6 bg-stone-200 dark:bg-stone-700 rounded-full w-32 mb-6 animate-pulse"></div>
            <div className="flex items-center gap-8">
              <div className="w-32 h-32 bg-stone-100 dark:bg-stone-800 rounded-full animate-pulse"></div>
              <div className="flex-1 space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-3 bg-stone-200 dark:bg-stone-700 rounded-full w-16 animate-pulse"></div>
                    <div className="h-3 bg-stone-200 dark:bg-stone-700 rounded-full w-8 animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-stone-900 dark:bg-stone-800 rounded-3xl p-8 animate-pulse">
            <div className="h-6 bg-stone-700 rounded-full w-40 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-stone-700 rounded-full"></div>
                  <div className="flex-1 border-b border-stone-700 pb-3">
                    <div className="h-3 bg-stone-700 rounded-full w-20 mb-2"></div>
                    <div className="h-4 bg-stone-700 rounded-full w-32"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <SkeletonTabs />

        {/* Collection Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}