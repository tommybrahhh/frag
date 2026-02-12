'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, UserPlus, Users } from 'lucide-react';

export default function JoinCommunityCTA() {
  return (
    <section className="py-20 md:py-32 bg-stone-50 text-stone-900 overflow-hidden relative border-t border-stone-200">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/50 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-white/50 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />

      <div className="max-w-[1000px] mx-auto px-6 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full mb-8 shadow-sm border border-stone-100">
            <Users className="w-3.5 h-3.5 text-stone-400" />
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-stone-500">The Scent Community</span>
          </div>

          <h2 className="font-serif text-3xl md:text-7xl mb-6 md:mb-8 text-stone-900 leading-tight">
            Your Scent Journey <br className="hidden md:block" />
            <span className="text-stone-400 italic">Starts Here</span>
          </h2>

          <p className="text-base md:text-xl text-stone-600 mb-10 md:mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            Build your collection, rate fragrances, and find your signature scent.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6">
            <Link 
              href="/login?mode=signup"
              className="w-full sm:w-auto px-8 py-4 bg-stone-900 text-white rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-stone-800 transition-all shadow-xl shadow-stone-200 flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Sign Up Free</span>
            </Link>
            
            <Link 
              href="/about"
              className="w-full sm:w-auto px-8 py-4 bg-white border border-stone-200 text-stone-900 rounded-full font-bold text-[10px] uppercase tracking-widest hover:border-stone-900 transition-all flex items-center justify-center gap-2"
            >
              <span>Learn More</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
