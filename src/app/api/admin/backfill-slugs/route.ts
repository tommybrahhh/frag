import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

function slugify(text: string): string {
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
    const offset = parseInt(searchParams.get('offset') || '0');
    const limit = parseInt(searchParams.get('limit') || '500');

    const supabase = await createClient();

    // Fetch perfumes in batch
    const { data: perfumes, error } = await supabase
        .from('perfumes')
        .select('id, name, brand:brands(name)')
        .range(offset, offset + limit - 1)
        .order('id');

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    
    if (!perfumes || perfumes.length === 0) {
        return NextResponse.json({ message: 'Done', count: 0 });
    }

    let updatedCount = 0;

    for (const p of perfumes) {
        const bName = p.brand?.name || '';
        const pName = p.name;
        
        let slugBase = '';
        if (pName.toLowerCase().includes(bName.toLowerCase())) {
            slugBase = pName;
        } else {
            slugBase = `${bName} ${pName}`;
        }
        
        const slug = slugify(slugBase);

        await supabase
            .from('perfumes')
            .update({ slug: slug })
            .eq('id', p.id);
            
        updatedCount++;
    }

    return NextResponse.json({ 
        message: 'Batch complete', 
        offset, 
        count: updatedCount,
        next: `/api/admin/backfill-slugs?offset=${offset + limit}`
    });
}
