'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import Image from 'next/image';
import { formatRelativeTime } from '@/utils/timeUtils';
import { getPerfumeImage } from '@/lib/perfume-utils';

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

const CommunityBuzz = () => {
  const [comments, setComments] = useState<CommentWithPerfume[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    const fetchComments = async () => {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          user_name,
          content,
          created_at,
          perfume_id,
          perfume:perfumes (
            name,
            image_url,
            slug,
            brand:brands ( name )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(3);

      if (!error && data) {
        setComments(data as any);
      }
      setLoading(false);
    };

    fetchComments();
  }, []);

  if (loading) {
    return <div className="animate-pulse space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="h-32 bg-stone-100 rounded-2xl" />)}
    </div>;
  }

  if (comments.length === 0) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {comments.map((c) => {
          const perfumeName = c.perfume?.name || 'Unknown';
          const perfumeLink = `/perfume/${c.perfume?.slug || c.perfume_id}`;
          const initials = c.user_name.slice(0, 2).toUpperCase();

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
                <span className="text-[10px] font-medium text-stone-400">
                  {mounted ? formatRelativeTime(c.created_at) : ''}
                </span>
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
                      src={getPerfumeImage(c.perfume.image_url)} 
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
