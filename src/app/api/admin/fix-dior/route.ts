import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = await createClient();
    
    // Force update Dior Addict
    const { error } = await (supabase.from('perfumes') as any)
        .update({ slug: 'dior-addict' })
        .eq('name', 'Dior Addict'); // Updating by name to be sure

    if (error) return NextResponse.json({ error: error.message });

    return NextResponse.json({ message: 'Fixed Dior Addict slug to "dior-addict"' });
}
