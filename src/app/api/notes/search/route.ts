import { createClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  const supabase = createClient();

  try {
    const { data: notes, error } = await supabase
      .from('notes')
      .select('id, name, description, family, color_hex')
      .ilike('name', `%${query}%`) // Case-insensitive fuzzy search
      .limit(10);

    if (error) throw error;

    return NextResponse.json(notes || []);
  } catch (error: any) {
    console.error('Notes search error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}