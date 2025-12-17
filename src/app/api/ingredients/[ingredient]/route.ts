import { createClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  props: { params: Promise<{ ingredient: string }> }
) {
  // 1. FIX: Await the params object (Next.js 15 requirement)
  const params = await props.params;
  
  // 2. Decode the URL (e.g. "Sea%20Salt" -> "Sea Salt")
  const ingredientName = decodeURIComponent(params.ingredient);

  const supabase = createClient();

  try {
    // 3. Find the Note ID based on the name
    // Use .maybeSingle() to return null instead of crashing if not found
    const { data: note, error: noteError } = await supabase
      .from('notes')
      .select('id, name, description, family, color_hex')
      .ilike('name', ingredientName) // Case-insensitive match
      .maybeSingle(); 

    if (noteError) throw noteError;

    if (!note) {
      return NextResponse.json({ error: 'Ingredient not found' }, { status: 404 });
    }

    // Explicitly cast note to avoid TypeScript 'never' inference issues
    const noteId = (note as any).id;

    // 4. Fetch perfumes that use this note (removed limit to show all perfumes)
    const { data: perfumes, error: perfumeError } = await supabase
      .from('perfumes')
      .select(`
        id, name, image_url, brand:brands!perfumes_brand_id_fkey(name),
        perfume_notes!inner(note_id)
      `)
      .eq('perfume_notes.note_id', noteId);

    if (perfumeError) throw perfumeError;

    return NextResponse.json({
      note,
      perfumes: perfumes || []
    });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}