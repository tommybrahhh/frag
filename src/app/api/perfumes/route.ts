import { NextResponse } from 'next/server';
import { getPerfumes } from '@/lib/services/perfumeService';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    const params = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20'),
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