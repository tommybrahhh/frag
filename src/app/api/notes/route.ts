export const runtime = "edge";

import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('notes')
    .select('id, name')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
