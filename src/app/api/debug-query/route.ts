export const runtime = "edge";
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';
  
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('perfumes')
    .select('id, name, slug')
    .ilike('name', `%${q}%`)
    .limit(10);

  if (error) return NextResponse.json({ error: error.message });

  return NextResponse.json(data);
}
