import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import FragranceCard from '@/components/features/perfume/FragranceCard';


export const revalidate = 3600; // Revalidate every hour

interface Perfume {
  id: string;
  name: string;
  image_url: string;
  brand: {
    name: string;
  };
  perfumer: string;
  rating?: number;
  vibe_tags?: string[];
}

async function getCreatorData(slug: string) {
  const creatorName = decodeURIComponent(slug);
  const supabase = await createClient();

  // Fetch perfumes by creator name (Case-insensitive match)
  const { data: perfumes, error: perfumeError } = await supabase
    .from('perfumes')
    .select(`
      id, name, image_url, brand:brands!perfumes_brand_id_fkey(name),
      perfumer, rating, vibe_tags
    `)
    .ilike('perfumer', creatorName)
    .order('name');

  if (perfumeError) {
    console.error('Creator Fetch Error:', perfumeError);
    return null;
  }

  // If no perfumes found, we might still want to show the page saying "0 Fragrances" 
  // or 404. For SEO, if it's a valid perfumer but no data, maybe 404 is better?
  // But let's stick to the previous behavior: display the name and empty list if valid, 
  // but here we don't have a separate "Creators" table to validate the name against.
  // So we assume the name from URL is the creator name.
  
  return {
    creator: creatorName,
    perfumes: (perfumes as any[]) || []
  };
}

export async function generateMetadata({ params }: { params: Promise<{ creator: string }> }): Promise<Metadata> {
  const { creator } = await params;
  const decodedName = decodeURIComponent(creator);
  
  return {
    title: `${decodedName} Perfumes & Profile | Scentia`,
    description: `Explore fragrances created by ${decodedName}. Discover their signature scents, ratings, and reviews on Scentia.`
  };
}

export default async function CreatorPage(props: { params: Promise<{ creator: string }> }) {
  const params = await props.params;
  const data = await getCreatorData(params.creator);

  if (!data) {
    notFound();
  }

  const { creator, perfumes } = data;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-gray-800 pb-20 font-sans">
      {/* Nav */}
      <div className="px-6 py-4 border-b border-stone-200 flex justify-between items-center bg-white/50 backdrop-blur sticky top-16 z-20">
        <Link href="/" className="text-xs font-bold tracking-widest uppercase hover:text-stone-500">← Home</Link>
        <span className="font-serif text-xl italic">Creator Library</span>
        <div className="w-8"></div>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-12">
        
        {/* HERO: Creator Details */}
        <div className="bg-white rounded-3xl p-10 border border-stone-100 shadow-sm mb-16 text-center max-w-3xl mx-auto">
          <div className="flex justify-center mb-6">
            <div 
              className="w-16 h-16 rounded-full shadow-inner border-4 border-stone-50 bg-stone-200 flex items-center justify-center"
            >
              <span className="text-stone-600 text-2xl font-serif font-medium">
                {creator.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <h1 className="font-serif text-5xl text-stone-900 mb-6">
            {creator}
          </h1>
          <p className="text-lg text-stone-600 font-serif leading-relaxed italic">
            Perfumer & Creator
          </p>
        </div>

        {/* PERFUME GRID */}
        <div className="border-t border-stone-200 pt-10">
          <h3 className="font-serif text-2xl text-stone-900 mb-8">Created {perfumes.length} Fragrances</h3>
          
          {perfumes.length === 0 ? (
            <div className="text-stone-400 italic">No perfumes found by this creator yet.</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {perfumes.map((p: any) => (
                <FragranceCard key={p.id} perfume={p} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
