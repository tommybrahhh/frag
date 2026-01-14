
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const { noteIds, page = 1, limit = 12 } = await request.json();

  if (!noteIds || !Array.isArray(noteIds) || noteIds.length === 0) {
    return NextResponse.json({ data: [], count: 0 });
  }

  const supabase = await createClient();

  // Get the total count first
  const { data: perfumeNotes, error: perfumeNotesError } = await supabase
    .from('perfume_notes')
    .select('perfume_id, note_id')
    .in('note_id', noteIds);

  if (perfumeNotesError) {
    console.error('Error fetching perfume notes for count:', perfumeNotesError);
    return NextResponse.json({ error: perfumeNotesError.message }, { status: 500 });
  }

  const perfumeIdToNotes = perfumeNotes.reduce((acc, { perfume_id, note_id }) => {
    if(perfume_id) {
      if (!acc[perfume_id]) {
        acc[perfume_id] = new Set();
      }
      acc[perfume_id].add(note_id);
    }
    return acc;
  }, {} as Record<string, Set<string>>);

  const matchingPerfumeIds = Object.entries(perfumeIdToNotes)
    .filter(([_, notes]) => notes.size === noteIds.length)
    .map(([perfume_id]) => perfume_id);
  
  const count = matchingPerfumeIds.length;

  // Now get the paginated data
  const from = (page - 1) * limit;
  const pagedIds = matchingPerfumeIds.slice(from, from + limit);

  if (pagedIds.length === 0) {
     return NextResponse.json({ data: [], count });
  }

  const { data, error } = await supabase
    .from('perfumes')
    .select(`
      id, 
      name,
      slug,  // <--- ADD THIS LINE
      image_url,
      brand:brands(name)
    `)
    .in('id', pagedIds);

  if (error) {
    console.error('Error fetching perfumes by notes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Transform data to flatten brand name if needed, or keep as object depending on frontend expectation
  // Frontend SearchResults expects `brand` as a string currently based on previous code, 
  // but let's check the type definition I just saw.
  // The type definition says `brand: string`.
  // The query returns `brand: { name: string }`.
  // So we map it.

  const formattedData = data.map((p: any) => ({
    ...p,
    brand: p.brand?.name || 'Unknown Brand'
  }));

  return NextResponse.json({ data: formattedData, count });
}
