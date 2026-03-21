export const runtime = "edge";
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = await createClient();
    
    // 1. Fetch all perfumes with slugs
    const { data: perfumes, error } = await supabase
        .from('perfumes')
        .select('id, slug')
        .not('slug', 'is', null) as any;

    if (error) return NextResponse.json({ error: error.message });

    let updated = 0;
    for (const p of perfumes) {
        if (!p.slug) continue;

        // Logic: if slug starts with "brand-brand-", replace with "brand-"
        // E.g., "dior-dior-addict" -> "dior-addict"
        const parts = p.slug.split('-');
        if (parts.length >= 2 && parts[0] === parts[1]) {
            const newSlug = parts.slice(1).join('-');
            
            await (supabase.from('perfumes') as any)
                .update({ slug: newSlug })
                .eq('id', p.id);
            updated++;
        }
    }

    return NextResponse.json({ message: 'Cleanup complete', updated });
}
