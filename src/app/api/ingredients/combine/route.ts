import { createClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ingredients = searchParams.get('ingredients');

  if (!ingredients) {
    return NextResponse.json({ error: 'No ingredients provided' }, { status: 400 });
  }

  const ingredientNames = ingredients.split(',').map(name => decodeURIComponent(name.trim()));
  
  if (ingredientNames.length === 0) {
    return NextResponse.json({ error: 'No valid ingredients provided' }, { status: 400 });
  }

  const supabase = createClient();

  try {
    // 1. Get the IDs of the selected notes
    const { data: notes, error: notesError } = await supabase
      .from('notes')
      .select('id, name, description, family, color_hex')
      .in('name', ingredientNames);

    if (notesError) throw notesError;
    if (!notes || notes.length === 0) return NextResponse.json({ perfumes: [] });

    const noteIds = notes.map(n => n.id);

    // 2. FAST FILTER: Call the Database Function
    // This returns ONLY the IDs of perfumes that have ALL these notes
    const { data: matchingIds, error: rpcError } = await supabase
      .rpc('get_perfume_ids_by_notes', { filter_note_ids: noteIds });

    if (rpcError) throw rpcError;

    if (!matchingIds || matchingIds.length === 0) {
      return NextResponse.json({ ingredients: notes, perfumes: [] });
    }

    // Extract just the UUIDs
    const targetPerfumeIds = matchingIds.map((row: any) => row.id);

    // 3. EFFICIENT FETCH: Get details for ONLY the matching perfumes
    const { data: perfumes, error: perfumeError } = await supabase
      .from('perfumes')
      .select(`
        id, name, image_url, price_tier,
        brand:brands!perfumes_brand_id_fkey(name),
        perfume_notes(
          note_id, type, note:notes(name)
        )
      `)
      .in('id', targetPerfumeIds) // <--- Only fetch the winners
      .limit(50);

    if (perfumeError) throw perfumeError;

    // 4. Formatting (Calculate positions like "Rose (Heart)")
    const formattedPerfumes = perfumes?.map((perfume: any) => {
      const ingredientPositions: Record<string, string> = {};
      
      noteIds.forEach(noteId => {
        const noteInfo = perfume.perfume_notes?.find((pn: any) => pn.note_id === noteId);
        const noteName = notes.find(n => n.id === noteId)?.name;
        
        if (noteInfo && noteName) {
          ingredientPositions[noteName] = noteInfo.type || 'Base';
        }
      });

      return {
        id: perfume.id,
        name: perfume.name,
        image_url: perfume.image_url,
        price_tier: perfume.price_tier,
        brand: perfume.brand,
        ingredient_positions: ingredientPositions
      };
    }) || [];

    return NextResponse.json({
      ingredients: notes,
      perfumes: formattedPerfumes
    });

  } catch (error: any) {
    console.error('Combiner API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}