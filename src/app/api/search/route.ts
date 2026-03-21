export const runtime = "edge";
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { FragranceService } from '@/services/fragranceService';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  const supabase = await createClient();
  const fragranceService = new FragranceService(supabase);

  try {
    const data = await fragranceService.searchFragrances(query);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Search RPC Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}