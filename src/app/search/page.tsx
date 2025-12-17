import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { Database } from '@/types/database';

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const query = typeof params.q === 'string' ? params.q : '';
  const vibe = typeof params.vibe === 'string' ? params.vibe : '';
  
  // Prioritize 'q', fallback to 'vibe'
  const searchTerm = query || vibe;

  if (!searchTerm) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-serif text-2xl text-stone-400 mb-4">Search</h1>
          <p className="text-stone-500">Please enter a search term.</p>
        </div>
      </div>
    );
  }

  const supabase = await createClient();
  
  // Use the RPC for keyword search if available, otherwise fallback to simple text search
  let results: any[] = [];
  
  try {
    // Try RPC first (better for similarity/fuzzy matching)
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('search_perfumes', { keyword: searchTerm })
      .limit(50); // Higher limit for result page

    if (!rpcError) {
      results = rpcData || [];
    } else {
        // Fallback or explicit vibe search if RPC fails or isn't perfect for "vibe" specific
        // Actually, if 'vibe' param is used, maybe we want exact vibe match?
        if (vibe) {
             const { data: vibeData } = await supabase
                .from('perfumes')
                .select(`
                    id, name, image_url, 
                    brand:brands!inner(name)
                `)
                .contains('vibe_tags', [vibe])
                .limit(50);
             results = vibeData?.map(p => ({ ...p, brand_name: p.brand?.name })) || [];
        } else {
            throw rpcError;
        }
    }
  } catch (err) {
    console.error('Search error:', err);
    // Final Fallback: Simple ILIKE on name
    const { data: fallbackData } = await supabase
        .from('perfumes')
        .select(`
            id, name, image_url, 
            brand:brands!inner(name)
        `)
        .ilike('name', `%${searchTerm}%`)
        .limit(50);
    
    results = fallbackData?.map(p => ({ ...p, brand_name: p.brand?.name })) || [];
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-gray-800 font-sans pb-20 pt-12">
      <div className="max-w-6xl mx-auto px-6">
        <div className="mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Search Results</span>
          <h1 className="text-4xl font-serif text-stone-900 mt-2">
            "{searchTerm}"
          </h1>
          <p className="text-stone-500 mt-2">{results.length} perfumes found</p>
        </div>

        {results.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {results.map((perfume) => (
              <Link 
                key={perfume.id} 
                href={`/perfume/${perfume.id}`}
                className="group bg-white rounded-xl border border-stone-100 p-4 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="h-48 flex items-center justify-center p-4 mb-4 bg-stone-50 rounded-lg group-hover:bg-white transition-colors">
                  {perfume.image_url ? (
                    <img src={perfume.image_url} alt={perfume.name} className="h-full object-contain mix-blend-multiply opacity-80 group-hover:opacity-100 transition-opacity" />
                  ) : (
                    <span className="text-stone-300 text-xs italic">No Image</span>
                  )}
                </div>
                <div className="text-center">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-stone-400 truncate mb-1">
                    {perfume.brand_name || perfume.brand?.name}
                  </div>
                  <div className="font-serif text-lg text-stone-900 leading-tight truncate">
                    {perfume.name}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center border border-dashed border-stone-200 rounded-2xl bg-white">
            <p className="text-stone-400">No perfumes found matching "{searchTerm}".</p>
            <Link href="/" className="mt-4 inline-block text-xs font-bold uppercase tracking-widest text-stone-900 border-b border-stone-900 pb-1">
              Back to Home
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}