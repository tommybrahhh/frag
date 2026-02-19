'use client';

import { useState, useEffect } from 'react';
import { ActivityItem } from '@/lib/services/communityService';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { formatRelativeTime } from '@/utils/timeUtils';

export default function CommunityFeed({ initialActivity }: { initialActivity: ActivityItem[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!initialActivity || initialActivity.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-stone-200">
        <p className="text-stone-500">No recent activity found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {initialActivity.map((item, index) => (
        <motion.div 
          key={item.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-start gap-4">
            
            {/* User Avatar Placeholder */}
            <div className="flex-shrink-0">
               <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 font-bold text-xs border border-stone-200">
                  {item.user_name.slice(0, 2).toUpperCase()}
               </div>
            </div>

            <div className="flex-1 min-w-0">
               <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-bold text-stone-900 text-sm">{item.user_name}</span>
                    <span className="text-stone-400 text-sm mx-2">•</span>
                    <span className="text-stone-500 text-sm">
                       {item.type === 'review' ? 'reviewed' : 'commented on'}
                    </span>
                  </div>
                  <span className="text-stone-400 text-xs whitespace-nowrap">
                    {mounted ? formatRelativeTime(item.created_at) : ''}
                  </span>
               </div>

               {/* Perfume Context */}
               <Link 
                 href={`/perfume/${item.perfume_slug || '#'}`} 
                 className="flex items-center gap-3 bg-stone-50 p-3 rounded-xl mb-3 hover:bg-stone-100 transition-colors group"
               >
                  <div className="w-10 h-10 bg-white rounded-lg flex-shrink-0 p-1 border border-stone-100">
                     {item.perfume_image ? (
                        <Image src={item.perfume_image} alt={item.perfume_name} width={40} height={40} className="w-full h-full object-contain mix-blend-multiply" unoptimized />
                     ) : (
                        <div className="w-full h-full bg-stone-200 rounded" />
                     )}
                  </div>
                  <div>
                     <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 group-hover:text-stone-600 transition-colors">
                        {item.brand_name}
                     </div>
                     <div className="font-serif text-stone-900 group-hover:text-stone-600 transition-colors">
                        {item.perfume_name}
                     </div>
                  </div>
               </Link>

               {/* Content */}
               {item.content && (
                  <div className="prose prose-stone prose-sm text-stone-600 italic leading-relaxed mb-4">
                     <p>"{item.content}"</p>
                  </div>
               )}
               
               {/* Rating Badge */}
               {item.rating && (
                  <div className="inline-flex items-center gap-2 bg-stone-900 px-3 py-1 rounded-full text-[10px] font-bold text-stone-50 tracking-tighter">
                     <span className="text-stone-400">★</span>
                     <span>{item.rating.toFixed(1)}</span>
                  </div>
               )}

            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
