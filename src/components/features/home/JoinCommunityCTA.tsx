'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, UserPlus, Users } from 'lucide-react';

export default function JoinCommunityCTA() {
  return (
    <section className="py-24 bg-stone-900 text-white overflow-hidden relative">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-stone-800/30 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-stone-800/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />

      <div className="max-w-[1000px] mx-auto px-6 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-8 backdrop-blur-sm border border-white/10">
            <Users className="w-4 h-4 text-stone-300" />
            <span className="text-xs font-bold uppercase tracking-widest text-stone-200">Growing Community</span>
          </div>

          <h2 className="font-serif text-4xl md:text-6xl mb-6">
            Your Scent Journey <br />
            <span className="text-stone-400 italic">Starts Here</span>
          </h2>

          <p className="text-lg text-stone-300 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
            Create your profile to build your digital collection, rate fragrances, find your signature scent, and connect with other enthusiasts.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/login?mode=signup"
              className="px-8 py-4 bg-white text-stone-900 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-stone-200 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Free Account</span>
            </Link>
            
            <Link 
              href="/about"
              className="px-8 py-4 bg-transparent border border-white/20 text-white rounded-full font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
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
