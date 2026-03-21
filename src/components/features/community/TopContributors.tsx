'use client';

import { Contributor } from '@/lib/services/communityService';

export default function TopContributors({ contributors }: { contributors: Contributor[] }) {
  if (!contributors || contributors.length === 0) {
     return (
       <div className="py-8 text-center border border-dashed border-stone-200 rounded-2xl">
         <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest">Awaiting Voices</p>
       </div>
     );
  }

  return (
    <div className="flex flex-col">
      {contributors.map((user, index) => (
        <div key={user.id} className="flex items-baseline justify-between py-3 border-b border-stone-100 last:border-0 hover:bg-stone-50/50 transition-colors -mx-2 px-2 rounded-lg">
           <div className="flex items-baseline gap-3">
               <span className="font-serif text-sm text-stone-400 w-3">
                  {index + 1}
               </span>
               <span className="text-sm text-stone-800 tracking-tight">
                  {user.name}
               </span>
           </div>
           <div className="flex items-baseline gap-1.5">
              <span className="font-serif text-sm text-stone-900">
                 {user.comment_count}
              </span>
              <span className="text-[10px] text-stone-400 uppercase tracking-widest">
                 Posts
              </span>
           </div>
        </div>
      ))}
    </div>
  );
}
