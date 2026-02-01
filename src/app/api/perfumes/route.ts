import { NextResponse } from 'next/server';
import { getPerfumes } from '@/lib/services/perfumeService';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Proactive Fix: Validation to prevent NaN crashing the DB query
    const pageParam = parseInt(searchParams.get('page') || '1');
    const limitParam = parseInt(searchParams.get('limit') || '20');

    const params = {
      page: isNaN(pageParam) || pageParam < 1 ? 1 : pageParam,
      limit: isNaN(limitParam) || limitParam < 1 ? 20 : limitParam,
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
      sort: searchParams.get('sort'),
    };

    const { data, error, count } = await getPerfumes(params);

    if (error) {
      console.error('Query Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const offset = (params.page - 1) * params.limit;

    return NextResponse.json({ 
      perfumes: data, 
      total: count,
      page: params.page,
      limit: params.limit,
      hasMore: count ? (offset + params.limit < count) : false
    });

  } catch (err) {
    console.error('Server Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}