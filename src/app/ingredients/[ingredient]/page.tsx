import { createClient } from '@/utils/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Metadata } from 'next';
import { getPerfumeImage } from '@/lib/perfume-utils';


export const revalidate = 3600; // Revalidate every hour

interface Perfume {
  id: string;
  name: string;
  image_url: string;
  brand: {
    name: string;
  };
}

interface Note {
  id: string;
  name: string;
  description: string;
  family: string;
  color_hex: string;
}

async function getIngredientData(slug: string) {
  const ingredientName = decodeURIComponent(slug);
  const supabase = await createClient();

  // 1. Find the Note ID based on the name
  const { data: rawNote, error: noteError } = await supabase
    .from('notes')
    .select('id, name, description, family, color_hex')
    .ilike('name', ingredientName)
    .maybeSingle();

  if (noteError || !rawNote) {
    return null;
  }

  const note = rawNote as Note;

  // 2. Fetch perfumes that use this note
  const { data: perfumes, error: perfumeError } = await supabase
    .from('perfumes')
    .select(`
      id, name, image_url, 
      brand:brands!perfumes_brand_id_fkey(name),
      perfume_notes!inner(note_id)
    `)
    .eq('perfume_notes.note_id', note.id);

  if (perfumeError) {
    console.error('Perfume Fetch Error:', perfumeError);
    return { note, perfumes: [] };
  }

  return {
    note,
    perfumes: (perfumes as any[]) || []
  };
}

export async function generateMetadata({ params }: { params: Promise<{ ingredient: string }> }): Promise<Metadata> {
  const { ingredient } = await params;
  const data = await getIngredientData(ingredient);

  if (!data || !data.note) {
    return {
      title: 'Ingredient Not Found | Scentia',
      description: 'The requested perfume ingredient could not be found.'
    };
  }

  return {
    title: `Best ${data.note.name} Perfumes & Scents | Scentia`,
    description: `Discover perfumes featuring ${data.note.name}. ${data.note.description || ''}`
  };
}

export default async function IngredientPage(props: { params: Promise<{ ingredient: string }> }) {
  const params = await props.params;
  const data = await getIngredientData(params.ingredient);

  if (!data || !data.note) {
    notFound();
  }

  const { note, perfumes } = data;

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-gray-800 pb-20 font-sans">
      {/* Nav */}
      <div className="px-6 py-4 border-b border-stone-200 flex justify-between items-center bg-white/50 backdrop-blur sticky top-16 z-20">
        <Link href="/" className="text-xs font-bold tracking-widest uppercase hover:text-stone-500">← Home</Link>
        <span className="font-serif text-xl italic">Ingredient Library</span>
        <Link href="/ingredients/combine" className="text-xs font-bold tracking-widest uppercase hover:text-stone-500">
          Combine Ingredients
        </Link>
      </div>

      <div className="max-w-6xl mx-auto px-6 mt-12">
        
        {/* HERO: Note Details */}
        <div className="bg-white rounded-3xl p-10 border border-stone-100 shadow-sm mb-16 text-center max-w-3xl mx-auto">
            <div className="flex justify-center mb-6">
            <div 
                className="w-16 h-16 rounded-full shadow-inner border-4 border-stone-50"
                style={{ backgroundColor: note.color_hex || '#ddd' }}
            ></div>
            </div>
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-400 mb-2">
            {note.family} Family
            </div>
            <h1 className="font-serif text-5xl text-stone-900 mb-6 capitalize">
            {note.name}
            </h1>
            <p className="text-lg text-stone-600 font-serif leading-relaxed italic">
            "{note.description || 'No description available for this note.'}"
            </p>
        </div>

        {/* PERFUME GRID */}
        <div className="border-t border-stone-200 pt-10">
          <h3 className="font-serif text-2xl text-stone-900 mb-8">Found in {perfumes.length} Fragrances</h3>
          
          {perfumes.length === 0 ? (
            <div className="text-stone-400 italic">No perfumes found with this note yet.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {perfumes.map((p: any) => (
                <div key={p.id} className="group relative bg-white rounded-xl p-4 hover:shadow-xl transition duration-500 border border-transparent hover:border-stone-100">
                  {/* Full card link (accessible, covers everything except z-20 elements) */}
                  <Link href={`/perfume/${p.id}`} className="absolute inset-0 z-10" aria-label={`View ${p.name}`} />
                  
                  <div className="h-48 mb-4 overflow-hidden flex items-center justify-center p-2 relative">
                     {p.image_url ? (
                       <img src={getPerfumeImage(p.image_url)} alt={p.name} className="h-full object-contain group-hover:scale-110 transition duration-700" />
                     ) : (
                       <div className="text-stone-300 text-xs">No Image</div>
                     )}
                  </div>
                  <div className="text-center relative">
                    {/* Brand Link - Explicit z-index to sit above the card link */}
                    <Link
                      href={`/brands/${encodeURIComponent(p.brand?.name || 'Unknown House')}`}
                      className="inline-block text-[10px] font-bold tracking-widest text-stone-400 uppercase mb-1 hover:text-stone-600 transition-colors relative z-20"
                    >
                      {p.brand?.name}
                    </Link>
                    <div className="font-serif text-lg text-stone-900 leading-tight group-hover:text-stone-600 transition">{p.name}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
