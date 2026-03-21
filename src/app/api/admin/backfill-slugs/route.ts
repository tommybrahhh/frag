export const runtime = "edge";
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

function slugify(text: string): string {
    if (!text) return '';
    return text
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    
    // Proactive Fix: Validate integers to prevent NaN errors
    const offsetParam = parseInt(searchParams.get('offset') || '0');
    const limitParam = parseInt(searchParams.get('limit') || '500');
    
    const offset = isNaN(offsetParam) ? 0 : offsetParam;
    const limit = isNaN(limitParam) ? 500 : limitParam;

    const supabase = await createClient();

    // Fetch perfumes in batch
    const { data: perfumes, error } = await supabase
        .from('perfumes')
        .select('id, name, brand:brands(name)')
        .range(offset, offset + limit - 1)
        .order('id') as any;

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    
    if (!perfumes || perfumes.length === 0) {
        return NextResponse.json({ message: 'Done', count: 0 });
    }

    let updatedCount = 0;

    for (const p of perfumes) {
        // Fix: Handle type mismatch safely (TS thinks Array, Runtime might be Object)
        // This 'as any' bypasses the specific build error while the logic handles both cases
        const brandData = p.brand as any;
        const brandName = Array.isArray(brandData) 
            ? brandData[0]?.name 
            : brandData?.name;
            
        const bName = brandName || '';
        const pName = p.name || '';
        
        let slugBase = '';
        if (bName && pName.toLowerCase().includes(bName.toLowerCase())) {
            slugBase = pName;
        } else {
            slugBase = `${bName} ${pName}`.trim();
        }
        
        const slug = slugify(slugBase);

        // Proactive Fix: Only attempt update if a valid slug exists
        if (slug) {
            await (supabase.from('perfumes') as any)
                .update({ slug: slug })
                .eq('id', p.id);
                
            updatedCount++;
        }
    }

    return NextResponse.json({ 
        message: 'Batch complete', 
        offset, 
        count: updatedCount,
        next: `/api/admin/backfill-slugs?offset=${offset + limit}`
    });
}