'use client';

import { Contributor } from '@/lib/services/communityService';
import { Medal } from 'lucide-react';

export default function TopContributors({ contributors }: { contributors: Contributor[] }) {
  if (!contributors || contributors.length === 0) {
     return (
       <div className="py-8 text-center border border-dashed border-stone-100 rounded-2xl">
         <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest">Awaiting Voices</p>
       </div>
     );
  }

  return (
    <div className="space-y-5">
      {contributors.map((user, index) => (
        <div key={user.id} className="group flex items-center gap-3">
           
           <div className="relative">
              <div className="w-10 h-10 rounded-lg bg-stone-50 flex items-center justify-center text-stone-400 font-serif text-sm border border-stone-100 overflow-hidden group-hover:border-stone-200 transition-all duration-300">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  ) : (
                    user.name.charAt(0)
                  )}
              </div>
              <div className={`
                absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold text-stone-600 shadow-sm border border-stone-50 bg-white
              `}>
                {index + 1}
              </div>
           </div>

           <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <div className="font-bold text-[13px] text-stone-900 truncate group-hover:text-stone-600 transition-colors">{user.name}</div>
                <div className={`text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border border-stone-100 bg-stone-50 text-stone-500`}>
                  {user.level.name}
                </div>
              </div>
              <div className="text-[10px] font-medium text-stone-400 uppercase tracking-wider">
                 {user.comment_count} Comments
              </div>
           </div>

        </div>
      ))}
    </div>
  );
}