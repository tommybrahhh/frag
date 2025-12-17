'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

interface Comment {
  id: string;
  user_name: string;
  content: string;
  created_at: string;
}

const CommunityBuzz = () => {
  const [comments, setComments] = useState<Comment[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchRecentComments = async () => {
      const { data } = await supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);
      
      setComments(data || []);
    };
    fetchRecentComments();
  }, []);

  if (comments.length === 0) return null;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-end justify-between mb-6">
        <h3 className="font-serif text-2xl text-stone-900">Community Voices</h3>
        <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Recent Reviews</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 flex-1">
        {comments.map((c) => (
          <div key={c.id} className="bg-white border border-stone-100 p-6 rounded-2xl shadow-sm hover:shadow-md transition duration-300 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-[10px] font-bold text-stone-900 border border-stone-200">
                {c.user_name?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <div className="text-[11px] font-bold text-stone-900 uppercase tracking-wide">{c.user_name || 'Anonymous'}</div>
                <div className="text-[9px] text-stone-400 font-bold uppercase">Verified Member</div>
              </div>
            </div>
            <p className="text-stone-600 text-sm italic font-serif leading-relaxed line-clamp-3 mb-4 flex-1">
              "{c.content}"
            </p>
            <div className="pt-4 border-t border-stone-50 text-[9px] text-stone-300 font-bold uppercase tracking-widest">
              Review
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommunityBuzz;