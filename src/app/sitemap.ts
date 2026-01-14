import { MetadataRoute } from 'next';
import { createClient } from '@/utils/supabase/server';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://scentia.app'; // Replace with your actual domain
  
  // 1. Static Routes
  const staticRoutes = [
    '',
    '/about',
    '/privacy',
    '/terms',
    '/layering',
    '/compare',
    '/search',
    '/quiz',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // 2. Dynamic Routes: Perfumes
  let perfumeRoutes: any[] = [];
  try {
    const supabase = await createClient();
    // CHANGED: Fetch 'slug' as well
    const { data: perfumes } = await supabase
      .from('perfumes')
      .select('id, slug, created_at') 
      .limit(2000); 

    if (perfumes) {
      perfumeRoutes = perfumes.map((p) => ({
        // CHANGED: Prefer Slug, fallback to ID if slug is missing
        url: `${baseUrl}/perfume/${p.slug || p.id}`,
        lastModified: p.created_at ? new Date(p.created_at) : new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }));
    }
  } catch (error) {
    console.error('Sitemap generation error:', error);
  }

  return [...staticRoutes, ...perfumeRoutes];
}
