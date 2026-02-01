'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import Image from 'next/image';

interface CommentWithPerfume {
  id: string;
  user_name: string;
  content: string;
  created_at: string;
  perfume_id: string;
  perfume?: {
    name: string;
    image_url: string | null;
    brand: { name: string } | null;
    slug: string | null;
  };
}

const getTimeAgo = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return "Just now";
};

interface CommunityBuzzProps {
  initialComments?: CommentWithPerfume[];
}

const CommunityBuzz = ({ initialComments = [] }: CommunityBuzzProps) => {
  const comments = initialComments;

  if (comments.length === 0) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between mb-8 px-2">
          <h3 className="font-serif text-3xl text-stone-900">Latest Reviews</h3>
        </div>
        <div className="text-center py-12 bg-stone-50 rounded-2xl border border-dashed border-stone-200">
          <p className="text-stone-500 font-medium">No reviews found.</p>
          <p className="text-stone-400 text-sm mt-1">Be the first to leave a review!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-8 px-2">
        <h3 className="font-serif text-3xl text-stone-900">Latest Reviews</h3>
        <Link href="/community" className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors border-b border-transparent hover:border-stone-900 pb-0.5">
          View All
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {comments.map((c) => {
           const perfumeName = c.perfume?.name || 'Unknown Scent';
           const perfumeLink = c.perfume?.slug ? `/perfume/${c.perfume.slug}` : `/perfume/${c.perfume_id}`;
           const initials = c.user_name ? c.user_name.slice(0, 2).toUpperCase() : '??';

           return (
            <Link key={c.id} href={perfumeLink} className="group flex flex-col justify-between bg-white border border-stone-100 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full">
              
              {/* Header: User & Time */}
              <div className="flex items-center justify-between mb-4 border-b border-stone-50 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center text-[10px] font-bold tracking-wider border border-stone-200">
                    {initials}
                  </div>
                  <span className="text-xs font-bold text-stone-900">{c.user_name}</span>
                </div>
                <span className="text-[10px] font-medium text-stone-400">{getTimeAgo(c.created_at)}</span>
              </div>
              
              {/* Content */}
              <div className="mb-6 flex-grow">
                 <p className="text-stone-600 text-sm md:text-base font-serif italic leading-relaxed line-clamp-4 group-hover:text-stone-800 transition-colors">
                    “{c.content}”
                 </p>
              </div>

              {/* Footer: Perfume Context */}
              <div className="flex items-center gap-3 bg-stone-50 rounded-xl p-2 pr-4 transition-colors group-hover:bg-stone-100/50">
                <div className="w-10 h-10 bg-white rounded-lg flex-shrink-0 flex items-center justify-center p-1 border border-stone-100 shadow-sm">
                  {c.perfume?.image_url ? (
                    <Image 
                      src={c.perfume.image_url} 
                      alt={perfumeName} 
                      width={32} 
                      height={32} 
                      className="w-full h-full object-contain mix-blend-multiply" 
                    />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-stone-200" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-[9px] text-stone-400 font-bold uppercase tracking-wider mb-0.5">Reviewing</div>
                  <div className="text-xs font-medium text-stone-900 truncate">{perfumeName}</div>
                </div>
              </div>

            </Link>
           );
        })}
      </div>
    </div>
  );
};

export default CommunityBuzz;