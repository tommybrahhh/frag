
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json([]);
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('notes')
    .select('id, name')
    .ilike('name', `%${query}%`)
    .limit(100);

  if (error) {
    console.error('Notes search error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Sort results: Exact match > Starts with > Alphabetical
  const lowerQuery = query.toLowerCase();
  const sortedData = (data || []).sort((a, b) => {
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();

    // 1. Exact match priority
    if (nameA === lowerQuery && nameB !== lowerQuery) return -1;
    if (nameB === lowerQuery && nameA !== lowerQuery) return 1;

    // 2. Starts with priority
    const aStarts = nameA.startsWith(lowerQuery);
    const bStarts = nameB.startsWith(lowerQuery);
    if (aStarts && !bStarts) return -1;
    if (!aStarts && bStarts) return 1;

    // 3. Alphabetical fallback
    return nameA.localeCompare(nameB);
  });

  return NextResponse.json(sortedData);
}
