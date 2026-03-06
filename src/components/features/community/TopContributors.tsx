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
    <div className="flex flex-col gap-0 border-t border-stone-100">
      {contributors.map((user, index) => (
        <div key={user.id} className="group flex items-center justify-between py-4 border-b border-stone-100/60 last:border-b-0 hover:bg-stone-50 transition-colors px-2 -mx-2 rounded-xl">
           
           <div className="flex items-center gap-4">
               <div className="font-serif text-sm font-bold text-stone-300 w-4 text-right">
                  {index + 1}
               </div>
               
               <div className="w-12 h-12 rounded-full bg-stone-50 flex items-center justify-center text-stone-500 font-serif text-sm overflow-hidden border border-stone-100 shadow-sm">
                   {user.avatar_url ? (
                     <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                   ) : (
                     <span className="text-xs">{user.name.charAt(0)}</span>
                   )}
               </div>
    
               <div className="flex flex-col">
                  <div className="font-bold text-[14px] text-stone-900 truncate tracking-tight">{user.name}</div>
                  <div className={`text-[9px] font-bold uppercase tracking-widest text-stone-400 mt-0.5`}>
                    {user.level.name}
                  </div>
               </div>
           </div>

           <div className="text-right pr-2">
              <div className="font-serif text-xl font-bold text-stone-900 leading-none">
                 {user.comment_count}
              </div>
              <div className="text-[9px] font-medium uppercase tracking-[0.2em] text-stone-300 mt-1">
                 Posts
              </div>
           </div>

        </div>
      ))}
    </div>
  );
}