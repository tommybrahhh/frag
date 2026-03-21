export const runtime = "edge";

import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { FragranceService } from '@/services/fragranceService';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const { noteIds, page = 1, limit = 12 } = await request.json();

  if (!noteIds || !Array.isArray(noteIds) || noteIds.length === 0) {
    return NextResponse.json({ data: [], count: 0 });
  }

  const supabase = await createClient();
  const fragranceService = new FragranceService(supabase);

  try {
    const { data, count } = await fragranceService.getFragrancesByNotes(noteIds, page, limit);
    return NextResponse.json({ data, count });
  } catch (error: any) {
    console.error('Error fetching perfumes by notes:', error.message || error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
