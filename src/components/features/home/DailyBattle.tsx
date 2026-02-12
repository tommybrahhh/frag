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
    <section className="py-16 md:py-24 bg-white">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col items-center mb-10">
          <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-stone-400 mb-2">
            The Daily Face-off
          </span>
          <h2 className="font-serif text-3xl text-stone-900">
            Pick Your <span className="italic text-stone-400">Favorite</span>
          </h2>
        </div>

        <div className="relative flex items-stretch gap-2 md:gap-8 max-w-4xl mx-auto">
          
          {/* VS Badge - Smaller for mobile */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
             <div className="w-10 h-10 md:w-14 md:h-14 bg-stone-900 text-white rounded-full flex items-center justify-center font-serif italic text-sm md:text-xl shadow-xl border-4 border-white">
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
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }}
               className="text-center mt-8"
             >
               <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">
                 Thanks for voting! Come back tomorrow.
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
      className={`relative flex-1 bg-stone-50 rounded-3xl p-4 md:p-8 transition-all duration-500 group overflow-hidden border border-stone-100
         ${disabled && showResult && percentage >= 50 ? 'bg-stone-100 border-stone-200' : ''}
         ${!disabled ? 'hover:bg-white hover:border-stone-200 cursor-pointer' : 'cursor-default'}
      `}
    >
      <div className="relative z-10 flex flex-col items-center">
         {/* Bottle Image */}
         <div className="relative w-24 h-24 md:w-40 md:h-40 mb-4 md:mb-6">
            {perfume.image_url ? (
                <Image 
                    src={perfume.image_url} 
                    alt={perfume.name} 
                    fill 
                    className="object-contain mix-blend-multiply opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                    sizes="(max-width: 768px) 96px, 160px"
                />
            ) : (
                <div className="w-full h-full bg-stone-200/50 rounded-2xl flex items-center justify-center text-[10px] text-stone-400">No Image</div>
            )}
         </div>

         {/* Info */}
         <div className="w-full text-center">
             <div className="text-[8px] md:text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-1 truncate">
                {perfume.brand?.name}
             </div>
             <h3 className="font-serif text-sm md:text-xl text-stone-900 mb-4 leading-tight line-clamp-2 min-h-[2.5rem] md:min-h-0">
               {perfume.name}
             </h3>
             
             {!showResult ? (
                <div className={`mx-auto w-fit px-4 py-2 md:px-8 md:py-3 rounded-full text-[8px] md:text-[10px] font-bold uppercase tracking-widest transition-all border
                    ${side === 'left' 
                       ? 'bg-stone-900 text-white border-stone-900' 
                       : 'bg-white text-stone-900 border-stone-200'}
                `}>
                    Vote
                </div>
             ) : (
                <div className="w-full flex flex-col items-center">
                    <div className="text-2xl md:text-4xl font-serif text-stone-900 mb-1">{percentage}%</div>
                    <div className="w-full h-1 bg-stone-200 rounded-full overflow-hidden max-w-[60px] md:max-w-full">
                        <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${percentage}%` }}
                           transition={{ duration: 1, ease: "circOut" }}
                           className={`h-full ${percentage >= 50 ? 'bg-stone-900' : 'bg-stone-400'}`}
                        />
                    </div>
                </div>
             )}
         </div>
      </div>
    </motion.button>
  );
}
