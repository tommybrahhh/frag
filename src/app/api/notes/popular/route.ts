import { createClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createClient();

  try {
    // Try to fetch real popular notes
    const { data: notes } = await supabase
      .from('notes')
      .select('id, name, family, color_hex')
      .limit(10);

    if (notes && notes.length > 0) {
      return NextResponse.json(notes);
    }

    // Fallback if DB is empty
    return NextResponse.json([
      { id: '1', name: 'Vanilla', family: 'Gourmand', color_hex: '#F3E5AB' },
      { id: '2', name: 'Bergamot', family: 'Citrus', color_hex: '#93C572' },
      { id: '3', name: 'Oud', family: 'Woody', color_hex: '#4a3b2a' },
      { id: '4', name: 'Rose', family: 'Floral', color_hex: '#FF007F' },
      { id: '5', name: 'Musk', family: 'Animalic', color_hex: '#E6E6FA' }
    ]);
  } catch (error) {
    return NextResponse.json([]);
  }
}