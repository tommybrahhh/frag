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
    // First, get the note IDs for all the ingredient names
    const { data: notes, error: notesError } = await supabase
      .from('notes')
      .select('id, name')
      .in('name', ingredientNames);

    if (notesError) throw notesError;

    if (!notes || notes.length === 0) {
      return NextResponse.json({ perfumes: [] });
    }

    const noteIds = notes.map(note => note.id);

    // Find perfumes that contain ALL the specified notes
    // We use a subquery approach to find perfumes that have all the required note IDs
    const { data: perfumes, error: perfumeError } = await supabase
      .from('perfumes')
      .select(`
        id,
        name,
        image_url,
        price_tier,
        brand:brands!perfumes_brand_id_fkey(name),
        perfume_notes!inner(
          note_id,
          type,
          note:notes(name)
        )
      `)
      .in('perfume_notes.note_id', noteIds)
      .limit(50);

    if (perfumeError) throw perfumeError;

    // Filter to only include perfumes that contain ALL the specified notes
    const filteredPerfumes = perfumes?.filter(perfume => {
      // Count how many of the required notes this perfume has
      const perfumeNoteIds = perfume.perfume_notes?.map((pn: any) => pn.note_id) || [];
      const matchingNotes = noteIds.filter(noteId => perfumeNoteIds.includes(noteId));
      return matchingNotes.length === noteIds.length;
    }) || [];

    // Enhance the response with price and note position information
    const formattedPerfumes = filteredPerfumes.map(perfume => {
      // Find the position of each searched ingredient in this perfume
      const ingredientPositions: Record<string, string> = {};
      
      noteIds.forEach(noteId => {
        const noteInfo = perfume.perfume_notes?.find((pn: any) => pn.note_id === noteId);
        if (noteInfo) {
          const noteName = notes.find(n => n.id === noteId)?.name;
          if (noteName) {
            ingredientPositions[noteName] = noteInfo.type || 'Base';
          }
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
    });

    return NextResponse.json({
      ingredients: notes,
      perfumes: formattedPerfumes
    });

  } catch (error: any) {
    console.error('Multi-ingredient search error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}