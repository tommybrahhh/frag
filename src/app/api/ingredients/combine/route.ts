export const runtime = "edge";
import { createClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ingredients = searchParams.get('ingredients');

  if (!ingredients) return NextResponse.json({ error: 'No ingredients provided' }, { status: 400 });

  const ingredientNames = ingredients.split(',').map(name => decodeURIComponent(name.trim()));
  const supabase = createClient();

  try {
    // 1. Get IDs for the requested notes
    // We use a broader search to ensure we catch capitalized/lowercase variations if possible, 
    // but .in() is case-sensitive. Ideally, ensure your inputs match DB casing.
    const { data: rawNotes, error: notesError } = await supabase
      .from('notes')
      .select('id, name, description, family, color_hex')
      .in('name', ingredientNames);

    if (notesError) throw notesError;
    
    // Explicitly type the result to avoid 'never' inference issues
    type Note = { id: string; name: string; description: string | null; family: string | null; color_hex: string | null };
    const notes = rawNotes as Note[] | null;

    if (!notes || notes.length === 0) {
      return NextResponse.json({ ingredients: [], perfumes: [] });
    }

    const noteIds = notes.map(n => n.id);

    // 2. ROBUST MATCHING (No RPC)
    // Fetch all connections for these specific notes.
    // This is fast because we only fetch 2 columns (perfume_id, note_id).
    const { data: relationships, error: relError } = await supabase
      .from('perfume_notes')
      .select('perfume_id, note_id')
      .in('note_id', noteIds);

    if (relError) throw relError;

    // 3. INTERSECTION LOGIC (Find perfumes that have ALL the notes)
    const perfumeMatchCounts: Record<string, Set<string>> = {};

    relationships?.forEach((row: any) => {
      if (!perfumeMatchCounts[row.perfume_id]) {
        perfumeMatchCounts[row.perfume_id] = new Set();
      }
      perfumeMatchCounts[row.perfume_id].add(row.note_id);
    });

    // Filter: Keep only perfumes where the unique note count matches our search count
    const targetPerfumeIds = Object.entries(perfumeMatchCounts)
      .filter(([_, matchedSet]) => matchedSet.size === noteIds.length)
      .map(([id, _]) => id);

    if (targetPerfumeIds.length === 0) {
      return NextResponse.json({ ingredients: notes, perfumes: [] });
    }

    // 4. FETCH DETAILS (Only for the winners)
    const { data: perfumes, error: perfumeError } = await supabase
      .from('perfumes')
      .select(`
        id, name, image_url, price_tier,
        brand:brands!perfumes_brand_id_fkey(name),
        perfume_notes(
          note_id, type, note:notes(name)
        )
      `)
      .in('id', targetPerfumeIds)
      .limit(50);

    if (perfumeError) throw perfumeError;

    // 5. FORMATTING
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
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}