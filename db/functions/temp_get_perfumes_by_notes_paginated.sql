create or replace function get_perfumes_by_notes_paginated(
    p_note_ids uuid[],
    p_limit int,
    p_offset int
)
returns table (
    id uuid,
    name text,
    slug text,        -- <--- ADDED THIS
    image_url text,   -- <--- ADDED THIS (Highly recommended)
    brand text
)
as $$
begin
    return query
    select
        p.id,
        p.name,
        p.slug,       -- <--- ADDED THIS
        p.image_url,  -- <--- ADDED THIS
        b.name as brand
    from
        perfumes p
    join
        brands b on p.brand_id = b.id
    where
        p.id in (
            select perfume_id
            from perfume_notes
            where note_id = any(p_note_ids)
            group by perfume_id
            having count(distinct note_id) = array_length(p_note_ids, 1)
        )
    order by
        p.name
    limit
        p_limit
    offset
        p_offset;
end;
$$ language plpgsql;