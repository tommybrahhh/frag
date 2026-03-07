import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const BASE_URL = 'https://scentia.fit';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in env files.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function generate() {
  console.log('Fetching data from Supabase...');

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
  ];

  // Initialize XML string
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  // Helper function to escape XML entities properly
  function escapeXml(unsafe) {
    if (!unsafe) return '';
    return unsafe.replace(/[<>&'"]/g, function (c) {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
  }

  // Add Statics
  staticRoutes.forEach(route => {
    xml += `
  <url>
    <loc>${escapeXml(BASE_URL + route)}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${route === '' ? '1.0' : '0.8'}</priority>
  </url>`;
  });

  // 2. Fetch Brands
  const { data: brands } = await supabase.from('brands').select('name');
  if (brands) {
    console.log(`Adding ${brands.length} brands...`);
    brands.forEach(b => {
      xml += `
  <url>
    <loc>${escapeXml(BASE_URL + '/brands/' + encodeURIComponent(b.name))}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });
  }

  // 3. Fetch Notes (Ingredients)
  const { data: notes } = await supabase.from('notes').select('name');
  if (notes) {
    console.log(`Adding ${notes.length} notes...`);
    notes.forEach(n => {
      xml += `
  <url>
    <loc>${escapeXml(BASE_URL + '/ingredients/' + encodeURIComponent(n.name))}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });
  }

  // 4. Fetch ALL Perfumes using pagination
  let from = 0;
  let batchSize = 1000; // Increased batch size for faster fetching
  let to = batchSize - 1;
  let hasMore = true;
  let totalPerfumes = 0;

  console.log('Fetching perfumes with minimal query...');
  while (hasMore) {
    const { data: perfumes, error } = await supabase
      .from('perfumes')
      .select('slug') // ONLY fetch slug, nothing else
      .range(from, to);

    if (error) {
      console.error('Error fetching perfumes:', error);
      break;
    }

    if (perfumes && perfumes.length > 0) {
      totalPerfumes += perfumes.length;
      console.log(`...fetched ${totalPerfumes} perfumes`);
      
      // Append directly to the XML string to save memory
      perfumes.forEach(p => {
        xml += `
  <url>
    <loc>${escapeXml(BASE_URL + '/perfume/' + encodeURIComponent(p.slug))}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
      });

      from += batchSize;
      to += batchSize;
      await new Promise(resolve => setTimeout(resolve, 50));
    } else {
      hasMore = false;
    }
  }

  xml += `
</urlset>`;

  const publicPath = path.join(process.cwd(), 'public', 'sitemap.xml');

  // FIXED: Added .trim() to remove any accidental leading whitespace/newlines
  fs.writeFileSync(publicPath, xml.trim());

  console.log(`Sitemap generated successfully at ${publicPath}`);
}

generate();