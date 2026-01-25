import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "About Scentia | The Art of Scent Decoded",
  description: "Learn how Scentia decodes fragrance DNA to help you discover your perfect scent match based on notes, accords, and vibes.",
  openGraph: {
    title: "About Scentia | The Art of Scent Decoded",
    description: "Scentia helps you understand why you love what you love. It’s not just a database; it’s a tool to map your olfactory taste.",
  }
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-800 pb-20">
      
      {/* Hero Section */}
      <div className="bg-stone-900 text-[#FDFBF7] py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-serif text-4xl md:text-5xl mb-6">The Art of Scent, Decoded.</h1>
          <p className="text-stone-400 text-lg leading-relaxed max-w-2xl mx-auto">
            Scentia helps you understand <em>why</em> you love what you love. It’s not just a database; it’s a tool to map your olfactory taste.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 pt-16">
        
        {/* Methodology Content */}
        <div className="prose prose-stone max-w-none prose-headings:font-serif prose-headings:font-normal prose-p:text-sm prose-p:leading-relaxed">
          
          <h3>Beyond "You Might Also Like"</h3>
          <p>
            Most recommendations suggest perfumes because other people bought them. We don't care what other people bought. We care about the <strong>Scent DNA</strong>. Scentia breaks down every fragrance into its constituent notes, accords, and vibes to understand its true character.
          </p>

          <div className="grid md:grid-cols-2 gap-8 my-12 not-prose">
            <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
              <h4 className="font-serif text-xl mb-2">The Dry Down</h4>
              <p className="text-xs text-stone-500 leading-relaxed">
                Perfume is alive. It changes from the first spray to the final skin scent. Our "Layering Lab" doesn't just smash two scents together; it predicts how their top, heart, and base notes will dance with each other over time.
              </p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-stone-100 shadow-sm">
              <h4 className="font-serif text-xl mb-2">Your Taste Profile</h4>
              <p className="text-xs text-stone-500 leading-relaxed">
                Your collection tells a story. Whether you lean towards dark, resinous Ouds or crisp, green Chypres, we visualize your unique preferences so you can find hidden gems that fit your vibe perfectly.
              </p>
            </div>
          </div>

          <h3>The Mission</h3>
          <p>
            Perfume is invisible art, but it shouldn't be a mystery. Whether you're hunting for a new signature scent or trying to understand why a certain note gives you a headache, Scentia gives you the vocabulary and the tools to navigate the world of fragrance with confidence.
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
