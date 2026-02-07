import { MetadataRoute } from 'next';
import { createClient } from '@/utils/supabase/server';

const BASE_URL = 'https://scentia.fit';
const ITEMS_PER_SITEMAP = 5000;

export async function generateSitemaps() {
  try {
    const supabase = await createClient();
    const { count } = await supabase
      .from('perfumes')
      .select('*', { count: 'exact', head: true });
    
    const totalItems = count || 0;
    const perfumeSitemaps = Math.ceil(totalItems / ITEMS_PER_SITEMAP);
    
    // Reserve ID 0 for Static + Brands + Ingredients
    // IDs 1+ will be for Perfumes
    return Array.from({ length: perfumeSitemaps + 1 }, (_, i) => ({ id: i }));
  } catch (error) {
    console.error('Error calculating sitemap count:', error);
    return [{ id: 0 }];
  }
}

export default async function sitemap({ id }: { id: number }): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  // ---------------------------------------------------------
  // CHUNK 0: Static Routes + Brands + Ingredients
  // ---------------------------------------------------------
  if (id === 0) {
    // 1. Static Routes
    const staticRoutes: MetadataRoute.Sitemap = [
      '',
      '/about',
      '/privacy',
      '/terms',
      '/layering',
      '/compare',
      '/search',
      '/quiz',
    ].map((route) => ({
      url: `${BASE_URL}${route}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: route === '' ? 1 : 0.8,
    }));

    // 2. Brands
    let brandRoutes: MetadataRoute.Sitemap = [];
    try {
      const { data: brands } = await supabase
        .from('brands')
        .select('name');
      
      if (brands) {
        brandRoutes = brands.map((b) => ({
          url: `${BASE_URL}/brands/${encodeURIComponent(b.name)}`,
          lastModified: new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        }));
      }
    } catch (err) {
      console.error('Sitemap: Error fetching brands', err);
    }

    // 3. Ingredients (Notes)
    let ingredientRoutes: MetadataRoute.Sitemap = [];
    try {
      const { data: notes } = await supabase
        .from('notes')
        .select('name');
      
      if (notes) {
        ingredientRoutes = notes.map((n) => ({
          url: `${BASE_URL}/ingredients/${encodeURIComponent(n.name)}`,
          lastModified: new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        }));
      }
    } catch (err) {
      console.error('Sitemap: Error fetching notes', err);
    }

    return [...staticRoutes, ...brandRoutes, ...ingredientRoutes];
  }

  // ---------------------------------------------------------
  // CHUNK 1+: Perfumes (Paginated)
  // ---------------------------------------------------------
  try {
    // Adjust index since 0 is taken. 
    // ID 1 gets the first 5000 perfumes, ID 2 gets the next, etc.
    const pageIndex = id - 1; 
    const start = pageIndex * ITEMS_PER_SITEMAP;
    const end = start + ITEMS_PER_SITEMAP - 1;

    const { data: perfumes } = await supabase
      .from('perfumes')
      .select('id, slug, created_at')
      .range(start, end);

    if (perfumes) {
      return perfumes.map((p) => ({
        url: `${BASE_URL}/perfume/${p.slug || p.id}`,
        lastModified: p.created_at ? new Date(p.created_at) : new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }));
    }
  } catch (error) {
    console.error(`Sitemap generation error for chunk ${id}:`, error);
  }

  return [];
}