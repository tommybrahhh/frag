import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  const supabase = await createClient();

  try {
    const { data, error } = await supabase
      .from('brands')
      .select('id, name')
      .ilike('name', `%${query}%`)
      .limit(10)
      .order('name');

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Brand Search Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
