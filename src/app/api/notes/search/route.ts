import { createClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const family = searchParams.get('family');
  const sortBy = searchParams.get('sort') || 'relevance';

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  const supabase = createClient();

  try {
    console.log('Searching for query:', query);
    
    // Use individual .ilike() calls instead of .or() with string concatenation
    let queryBuilder = supabase
      .from('notes')
      .select('id, name, description, family, color_hex, intensity_level')
      .ilike('name', `%${query}%`)
      .ilike('family', `%${query}%`)
      .ilike('description', `%${query}%`);

    // Apply family filter if specified
    if (family && family !== 'all') {
      queryBuilder = queryBuilder.ilike('family', `%${family}%`);
    }

    // Apply sorting
    if (sortBy === 'popularity') {
      queryBuilder = queryBuilder.order('name', { ascending: true });
    } else if (sortBy === 'intensity') {
      queryBuilder = queryBuilder.order('intensity_level', { ascending: false });
    } else {
      queryBuilder = queryBuilder.order('name', { ascending: true });
    }

    queryBuilder = queryBuilder.limit(15);

    const { data: notes, error } = await queryBuilder;

    if (error) {
      console.error('Supabase query error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      // Fallback to individual queries if the combined query fails
      console.log('Trying fallback query approach...');
      try {
        const { data: nameResults } = await supabase
          .from('notes')
          .select('id, name, description, family, color_hex, intensity_level')
          .ilike('name', `%${query}%`);
        
        const { data: familyResults } = await supabase
          .from('notes')
          .select('id, name, description, family, color_hex, intensity_level')
          .ilike('family', `%${query}%`);
        
        const { data: descResults } = await supabase
          .from('notes')
          .select('id, name, description, family, color_hex, intensity_level')
          .ilike('description', `%${query}%`);
        
        // Combine and deduplicate results
        const allResults = [...(nameResults || []), ...(familyResults || []), ...(descResults || [])];
        const uniqueResults = allResults.filter((note, index, self) =>
          index === self.findIndex(n => n.id === note.id)
        );
        
        return NextResponse.json(uniqueResults);
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        return NextResponse.json([]);
      }
    }

    // Enhance results with relevance scoring for better ordering
    const enhancedNotes = (notes || []).map(note => {
      const nameMatch = note.name.toLowerCase().includes(query.toLowerCase());
      const familyMatch = note.family?.toLowerCase().includes(query.toLowerCase());
      const descriptionMatch = note.description?.toLowerCase().includes(query.toLowerCase());
      
      // Simple relevance scoring
      let relevance = 0;
      if (nameMatch) relevance += 3;
      if (familyMatch) relevance += 2;
      if (descriptionMatch) relevance += 1;
      
      return {
        ...note,
        _relevance: relevance
      };
    });

    // Sort by relevance if not already sorted by popularity or intensity
    if (sortBy === 'relevance') {
      enhancedNotes.sort((a, b) => b._relevance - a._relevance);
    }

    // Remove the temporary relevance field before returning
    const finalNotes = enhancedNotes.map(({ _relevance, ...note }) => note);

    return NextResponse.json(finalNotes);
  } catch (error: any) {
    console.error('Notes search error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}