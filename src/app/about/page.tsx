import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-800 pb-20">
      
      {/* Hero Section */}
      <div className="bg-stone-900 text-[#FDFBF7] py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-serif text-4xl md:text-5xl mb-6">The Science of Scent</h1>
          <p className="text-stone-400 text-lg leading-relaxed max-w-2xl mx-auto">
            Scentia is not just a database. It is an algorithmic approach to understanding olfactory harmony, volatility, and personal taste.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 pt-16">
        
        {/* Methodology Content */}
        <div className="prose prose-stone max-w-none prose-headings:font-serif prose-headings:font-normal prose-p:text-sm prose-p:leading-relaxed">
          
          <h3>Our Methodology</h3>
          <p>
            Unlike traditional recommendations that simply match "People who bought X also bought Y," Scentia analyzes the <strong>molecular architecture</strong> of a fragrance.
          </p>

          <div className="grid md:grid-cols-2 gap-8 my-12 not-prose">
            <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
              <h4 className="font-serif text-xl mb-2">Volatility Profiling</h4>
              <p className="text-xs text-stone-500 leading-relaxed">
                We categorize ingredients by their evaporation rate (Top, Heart, Base). This allows our "Layering Lab" to predict how two scents will interact over time—preventing muddy, clashing mixes.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
              <h4 className="font-serif text-xl mb-2">Olfactory DNA</h4>
              <p className="text-xs text-stone-500 leading-relaxed">
                Your "Shelf" isn't just a list. It's a dataset. We extract the dominant traits (e.g., Woody, Gourmand, Fresh) from your collection to visualize your unique "Taste Profile" radar chart.
              </p>
            </div>
          </div>

          <h3>The Mission</h3>
          <p>
            Perfume is invisible art. Our goal is to make it visible, understandable, and accessible. Whether you are a novice looking for your signature scent or a collector organizing a vast library, Scentia provides the tools to deepen your connection with your sense of smell.
          </p>

        </div>

        <div className="mt-16 pt-8 border-t border-stone-200">
          <Link href="/" className="text-xs font-bold uppercase tracking-widest text-stone-400 hover:text-stone-900 transition">
            ← Start Exploring
          </Link>
        </div>

      </div>
    </div>
  );
}
