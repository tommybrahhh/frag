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

  // Call the custom SQL function we just created
  const { data, error } = await supabase
    .rpc('search_perfumes', { keyword: query })
    .limit(6);

  if (error) {
    console.error('Search RPC Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Transform the data to match the frontend expectations
  // The RPC returns 'brand_name' as a flat string, but our UI might expect an object
  const formattedData = data.map((item: any) => ({
    ...item,
    brand: { name: item.brand_name } // Map flat string back to object structure
  }));

  return NextResponse.json(formattedData);
}