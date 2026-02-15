'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { voteInBattle } from '@/lib/actions/battleActions';

interface BattleProps {
  battle: {
    id: string;
    left: any;
    right: any;
    totalVotes: number;
  } | null;
}

export default function DailyBattle({ battle }: BattleProps) {
  const [hasVoted, setHasVoted] = useState(false);
  const [localStats, setLocalStats] = useState(battle);
  const [isVoting, setIsVoting] = useState(false);

  if (!battle || !localStats) return null;

  const handleVote = async (side: 'left' | 'right') => {
    if (hasVoted || isVoting) return;
    setIsVoting(true);

    // Optimistic Update
    const newStats = { ...localStats };
    if (side === 'left') {
        newStats.left.votes += 1;
    } else {
        newStats.right.votes += 1;
    }
    newStats.totalVotes += 1;
    setLocalStats(newStats);
    setHasVoted(true);

    await voteInBattle(battle.id, side);
    setIsVoting(false);
  };

  const leftPct = localStats.totalVotes === 0 ? 50 : Math.round((localStats.left.votes / localStats.totalVotes) * 100);
  const rightPct = 100 - leftPct;

  return (
    <section className="py-8 md:py-16 bg-white">
      <div className="max-w-[800px] mx-auto px-6">
        <div className="flex flex-col items-center mb-6 md:mb-10">
          <div className="flex items-center gap-2 mb-2">
             <div className="w-4 h-px bg-stone-200" />
             <span className="text-[8px] md:text-[9px] font-bold uppercase tracking-[0.3em] text-stone-400">
               The Daily Duel
             </span>
             <div className="w-4 h-px bg-stone-200" />
          </div>
          <h2 className="font-serif text-xl md:text-3xl text-stone-900">
            Which one <span className="italic text-stone-400">wins?</span>
          </h2>
        </div>

        <div className="relative flex items-center gap-4 md:gap-8 max-w-2xl mx-auto">
          
          {/* VS Badge - Even smaller */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
             <div className="w-7 h-7 md:w-10 md:h-10 bg-white text-stone-900 rounded-full flex items-center justify-center font-serif italic text-[10px] md:text-base shadow-sm border border-stone-50">
               vs
             </div>
          </div>

          {/* Left Contender */}
          <BattleCard 
            perfume={localStats.left} 
            side="left" 
            onClick={() => handleVote('left')}
            disabled={hasVoted}
            percentage={leftPct}
            showResult={hasVoted}
          />

          {/* Right Contender */}
          <BattleCard 
            perfume={localStats.right} 
            side="right" 
            onClick={() => handleVote('right')}
            disabled={hasVoted}
            percentage={rightPct}
            showResult={hasVoted}
          />
        </div>
        
        {hasVoted && (
             <motion.div 
               initial={{ opacity: 0, y: 10 }} 
               animate={{ opacity: 1, y: 0 }}
               className="text-center mt-6"
             >
               <p className="text-[8px] text-stone-400 font-bold uppercase tracking-[0.2em]">
                 Vote cast.
               </p>
             </motion.div>
        )}
      </div>
    </section>
  );
}

function BattleCard({ perfume, side, onClick, disabled, percentage, showResult }: any) {
  return (
    <motion.button 
      whileTap={!disabled ? { scale: 0.98 } : {}}
      onClick={onClick}
      disabled={disabled}
      className={`relative flex-1 py-2 md:py-4 transition-all duration-500 group overflow-hidden
         ${!disabled ? 'cursor-pointer' : 'cursor-default'}
      `}
    >
      <div className="relative z-10 flex flex-col items-center">
         {/* Bottle Image - Smaller */}
         <div className="relative w-16 h-16 md:w-24 md:h-24 mb-3 md:mb-5">
            {perfume.image_url ? (
                <Image 
                    src={perfume.image_url} 
                    alt={perfume.name} 
                    fill 
                    className="object-contain mix-blend-multiply opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                    sizes="(max-width: 768px) 64px, 96px"
                />
            ) : (
                <div className="w-full h-full bg-stone-50 rounded-2xl flex items-center justify-center text-[8px] text-stone-300">No Image</div>
            )}
         </div>

         {/* Info */}
         <div className="w-full text-center px-2">
             <div className="text-[7px] md:text-[8px] font-bold tracking-[0.2em] text-stone-400 uppercase mb-0.5 truncate">
                {perfume.brand?.name}
             </div>
             <h3 className="font-serif text-[10px] md:text-base text-stone-900 mb-3 leading-tight line-clamp-1">
               {perfume.name}
             </h3>
             
             {!showResult ? (
                <div className={`mx-auto w-fit px-4 py-1.5 md:px-6 md:py-2 rounded-full text-[7px] md:text-[8px] font-bold uppercase tracking-widest transition-all border
                    ${side === 'left' 
                       ? 'bg-stone-900 text-white border-stone-900 hover:bg-stone-800' 
                       : 'bg-white text-stone-900 border-stone-200 hover:border-stone-400'}
                `}>
                    Choose
                </div>
             ) : (
                <div className="w-full flex flex-col items-center">
                    <div className="text-lg md:text-2xl font-serif text-stone-900 mb-1">{percentage}%</div>
                    <div className="w-full h-1 bg-stone-100 rounded-full overflow-hidden max-w-[60px] md:max-w-[100px]">
                        <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${percentage}%` }}
                           transition={{ duration: 1, ease: "circOut" }}
                           className={`h-full ${percentage >= 50 ? 'bg-stone-900' : 'bg-stone-300'}`}
                        />
                    </div>
                </div>
             )}
         </div>
      </div>
    </motion.button>
  );
}
