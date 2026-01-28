'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const VideoHero = () => {
  return (
    <section className="px-6 max-w-[1400px] mx-auto mb-20 pt-8">
      <div className="relative w-full rounded-[2rem] overflow-hidden shadow-2xl aspect-[16/10] md:aspect-[21/9]">
        {/* Video Background */}
        <video
          className="absolute inset-0 w-full h-full object-cover scale-105"
          src="/video.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
        
        {/* Cinematic Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        {/* Content Layer */}
        <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 lg:px-24">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-white/60 text-[10px] font-bold uppercase tracking-[0.3em] mb-4 block"
            >
              The Art of Fragrance
            </motion.span>
            
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-white mb-8 leading-[1.1]">
              Find Your <br />
              <span className="italic font-light">Signature Scent</span>
            </h1>
            
            <p className="text-white/70 text-base md:text-lg mb-12 max-w-md font-light leading-relaxed">
              Experience a personalized discovery journey powered by our fragrance intelligence engine.
            </p>

            <div className="flex flex-wrap gap-5">
              <Link 
                href="/quiz"
                className="px-10 py-4 bg-white text-stone-900 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-stone-100 transition-all hover:scale-105 active:scale-95 shadow-xl"
              >
                Start Scent Quiz
              </Link>
              <Link 
                href="/search"
                className="px-10 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full font-bold text-xs uppercase tracking-widest hover:bg-white/20 transition-all hover:scale-105 active:scale-95"
              >
                Explore Library
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Subtle Bottom Accent */}
        <div className="absolute bottom-8 left-8 md:left-16 lg:left-24 flex items-center gap-4">
          <div className="w-12 h-[1px] bg-white/20" />
          <span className="text-white/30 text-[9px] font-bold uppercase tracking-widest">Scroll to explore</span>
        </div>
      </div>
    </section>
  );
};

export default VideoHero;

