import { NextRequest, NextResponse } from 'next/server';
import { getPerfumes } from '@/lib/services/perfumeService';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const params = {
    page: parseInt(searchParams.get('page') || '1', 10),
    limit: parseInt(searchParams.get('limit') || '12', 10),
    sort: searchParams.get('sort'),
    q: searchParams.get('q'), // for general search query if implemented later
    // Add other filter parameters as needed from PerfumeFilterParams
    price: searchParams.get('price'),
    gender: searchParams.get('gender'),
    longevity: searchParams.get('longevity'),
    season: searchParams.get('season'),
    concentration: searchParams.get('concentration'),
    tier: searchParams.get('tier'),
    moment: searchParams.get('moment'),
    occasion: searchParams.get('occasion'),
    year: searchParams.get('year'),
    family: searchParams.get('family'),
    vibe: searchParams.get('vibe'),
  };

  try {
    const { data, count, error } = await getPerfumes(params);

    if (error) {
      console.error('Error fetching perfumes:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data, count });
  } catch (error: any) {
    console.error('Unexpected error fetching perfumes:', error);
    return NextResponse.json({ error: error.message || 'An unexpected error occurred' }, { status: 500 });
  }
}
