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

const CommunityBuzz = () => {
  const [comments, setComments] = useState<CommentWithPerfume[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchRecentComments = async () => {
      // We need to join with perfumes table. 
      // Supabase JS client syntax for joining: .select('*, perfume:perfumes(name, image_url, slug, brand:brands(name))')
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
      
      if (error) {
        console.error('Error fetching comments:', error);
      } else {
        // Cast the response to our type manually since the deeply nested type inference can be tricky
        setComments((data as any) || []);
      }
    };
    fetchRecentComments();
  }, []);

  if (comments.length === 0) return null;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-end justify-between mb-6">
        <h3 className="font-serif text-2xl text-stone-900">Community Voices</h3>
        <Link href="/community" className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors">
          Join the conversation
        </Link>
      </div>
      
      <div className="flex flex-col gap-4 flex-1">
        {comments.map((c) => {
           // Fallback if relation is missing
           const perfumeName = c.perfume?.name || 'Unknown Scent';
           const perfumeBrand = c.perfume?.brand?.name || 'Brand';
           const perfumeLink = c.perfume?.slug ? `/perfume/${c.perfume.slug}` : `/perfume/${c.perfume_id}`;

           return (
            <Link key={c.id} href={perfumeLink} className="group block bg-white border border-stone-100 rounded-2xl p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
              <div className="flex gap-4">
                {/* Mini Perfume Image */}
                <div className="flex-shrink-0 w-16 h-16 bg-stone-50 rounded-xl flex items-center justify-center p-2 border border-stone-100">
                  {c.perfume?.image_url ? (
                    <Image 
                      src={c.perfume.image_url} 
                      alt={perfumeName} 
                      width={48} 
                      height={48} 
                      className="w-full h-full object-contain mix-blend-multiply" 
                    />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-stone-200" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-bold uppercase tracking-wider text-stone-900">{c.user_name}</span>
                       <span className="text-[9px] text-stone-400">•</span>
                       <span className="text-[9px] text-stone-400 uppercase">on {perfumeName}</span>
                    </div>
                  </div>
                  
                  <p className="text-stone-600 text-xs md:text-sm font-serif leading-relaxed line-clamp-2 group-hover:text-stone-900 transition-colors">
                    "{c.content}"
                  </p>
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