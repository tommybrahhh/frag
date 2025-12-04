import { createClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createClient();

  try {
    // Get popular ingredients based on usage in perfumes - limit to 8 for better UX
    const { data: popularNotes, error } = await supabase
      .from('notes')
      .select('id, name, description, family, color_hex')
      .order('name')
      .limit(8);

    if (error) throw error;

    // If we have data, return it
    if (popularNotes && popularNotes.length > 0) {
      return NextResponse.json(popularNotes);
    }

    // Fallback to common ingredients if no database data
    const commonIngredients = [
      { id: '1', name: 'Vanilla', description: 'Sweet, warm, and creamy', family: 'Gourmand', color_hex: '#F3E5AB' },
      { id: '2', name: 'Bergamot', description: 'Citrusy and fresh', family: 'Citrus', color_hex: '#93C572' },
      { id: '3', name: 'Sandalwood', description: 'Woody and creamy', family: 'Woody', color_hex: '#C19A6B' },
      { id: '4', name: 'Rose', description: 'Floral and romantic', family: 'Floral', color_hex: '#FF007F' },
      { id: '5', name: 'Jasmine', description: 'Floral and sensual', family: 'Floral', color_hex: '#F8BBD0' },
      { id: '6', name: 'Patchouli', description: 'Earthy and aromatic', family: 'Woody', color_hex: '#7B3F00' },
      { id: '7', name: 'Amber', description: 'Warm and resinous', family: 'Oriental', color_hex: '#FFBF00' },
      { id: '8', name: 'Musk', description: 'Animalic and warm', family: 'Animalic', color_hex: '#E6E6FA' },
      { id: '9', name: 'Lavender', description: 'Herbaceous and calming', family: 'Aromatic', color_hex: '#967BB6' },
      { id: '10', name: 'Cedarwood', description: 'Woody and dry', family: 'Woody', color_hex: '#8B4513' }
    ];

    return NextResponse.json(commonIngredients);

  } catch (error: any) {
    console.error('Popular notes error:', error);
    
    // Return fallback data on error
    const fallbackIngredients = [
      { id: '1', name: 'Vanilla', description: 'Sweet, warm, and creamy', family: 'Gourmand', color_hex: '#F3E5AB' },
      { id: '2', name: 'Bergamot', description: 'Citrusy and fresh', family: 'Citrus', color_hex: '#93C572' },
      { id: '3', name: 'Sandalwood', description: 'Woody and creamy', family: 'Woody', color_hex: '#C19A6B' },
      { id: '4', name: 'Rose', description: 'Floral and romantic', family: 'Floral', color_hex: '#FF007F' },
      { id: '5', name: 'Jasmine', description: 'Floral and sensual', family: 'Floral', color_hex: '#F8BBD0' }
    ];

    return NextResponse.json(fallbackIngredients);
  }
}