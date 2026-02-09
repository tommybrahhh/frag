import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "About Scentia | Where Every Fragrance Has a Story",
  description: "Discover the art of fragrance with Scentia. We go beyond simple notes to tell the story of every perfume, helping you find scents that resonate with your memories and style.",
  openGraph: {
    title: "About Scentia | Where Every Fragrance Has a Story",
    description: "Scentia isn't just a database; it's a community where every fragrance has a story. Join us to decode the art of scent and find your signature.",
  }
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] text-stone-800 pb-20">
      
      {/* Hero Section */}
      <div className="bg-stone-900 text-[#FDFBF7] py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-serif text-4xl md:text-6xl mb-8 leading-tight">
            Where Every Fragrance <br/> 
            <span className="italic text-stone-400">Has a Story.</span>
          </h1>
          <p className="text-stone-300 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto font-light">
            We believe perfume isn't just a smell; it's a memory, a mood, and a narrative waiting to be told. Scentia is the definitive guide to decoding these stories.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 pt-20">
        
        {/* Editorial Content */}
        <div className="prose prose-stone prose-lg max-w-none prose-headings:font-serif prose-headings:font-normal prose-p:leading-relaxed prose-a:text-stone-900">
          
          <h3>The Narrative of Scent</h3>
          <p>
            Every bottle on a shelf holds more than just essential oils and alcohol. It holds the vision of a perfumer, the history of a brand, and the potential to become part of your personal identity. At Scentia, we don't just list notes; we explore the <strong>context</strong> behind every fragrance. Is it a chaotic, smoky jazz club in the 90s? A serene walk through a Kyoto garden? We help you find the story you want to wear.
          </p>

          <div className="my-16 grid md:grid-cols-2 gap-8 not-prose">
            <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
              <h4 className="font-serif text-2xl mb-4 text-stone-900">The Olfactory Archive</h4>
              <p className="text-stone-600 leading-relaxed">
                Our comprehensive database tracks thousands of fragrances, from iconic designer staples to obscure indie masterpieces. We analyze longevity, projection, and seasonal suitability to give you the full technical picture alongside the artistic one.
              </p>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow">
              <h4 className="font-serif text-2xl mb-4 text-stone-900">Community Voices</h4>
              <p className="text-stone-600 leading-relaxed">
                A fragrance smells different on everyone. That's why our community is our heartbeat. Real reviews from real enthusiasts provide the honest, unfiltered truth about how a scent performs in the real world, beyond the marketing copy.
              </p>
            </div>
          </div>

          <h3>Why "Fragrance" Matters</h3>
          <p>
            In a world of fast fashion and fleeting trends, fragrance remains a deeply personal, enduring luxury. It is the invisible accessory that leaves the lasting impression. Our mission is to demystify this world, giving you the vocabulary to describe what you love and the tools to find it.
          </p>
          
          <p>
            Whether you are searching for a signature scent that defines your presence or building a wardrobe of fragrances for every chapter of your life, Scentia is your curator, your critic, and your community.
          </p>

        </div>

        <div className="mt-20 pt-10 border-t border-stone-200 flex justify-center">
          <Link href="/search" className="inline-flex items-center gap-3 px-8 py-4 bg-stone-900 text-white rounded-full font-bold text-xs uppercase tracking-widest hover:bg-stone-800 transition-all hover:scale-105">
            Start Your Journey
          </Link>
        </div>

      </div>
    </div>
  );
}