'use client';

import Link from 'next/link';

export default function GlobalFooter() {
  return (
    <footer className="w-full bg-[#FDFBF7] border-t border-stone-100 py-12 mt-24">
      <div className="max-w-[1400px] mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Brand */}
        <div className="col-span-1 md:col-span-2">
          <Link href="/" className="font-serif text-2xl font-medium tracking-tight text-stone-900 mb-4 block">
            Scentia
          </Link>
          <p className="text-xs text-stone-500 max-w-xs leading-relaxed mb-6">
            An algorithmic approach to olfactory discovery. Analyzing molecular harmony, volatility profiles, and personal taste DNA.
          </p>
          <div className="text-[10px] text-stone-400 uppercase tracking-widest">
            © 2025 Scentia Labs
          </div>
        </div>

        {/* Explore */}
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-900 mb-4">Explore</h4>
          <ul className="space-y-3">
            <li><Link href="/search" className="text-xs text-stone-500 hover:text-stone-900 transition">Note Laboratory</Link></li>
            <li><Link href="/layering" className="text-xs text-stone-500 hover:text-stone-900 transition">Layering Lab</Link></li>
            <li><Link href="/compare" className="text-xs text-stone-500 hover:text-stone-900 transition">Battle Analysis</Link></li>
            <li><Link href="/quiz" className="text-xs text-stone-500 hover:text-stone-900 transition">Scent Quiz</Link></li>
          </ul>
        </div>

        {/* Legal & Info */}
        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-stone-900 mb-4">Information</h4>
          <ul className="space-y-3">
            <li><Link href="/about" className="text-xs text-stone-500 hover:text-stone-900 transition">Methodology</Link></li>
            <li><Link href="/privacy" className="text-xs text-stone-500 hover:text-stone-900 transition">Privacy Policy</Link></li>
            <li><Link href="/terms" className="text-xs text-stone-500 hover:text-stone-900 transition">Terms of Service</Link></li>
            <li><a href="mailto:support@scentia.app" className="text-xs text-stone-500 hover:text-stone-900 transition">Contact Support</a></li>
          </ul>
        </div>

      </div>
    </footer>
  );
}
