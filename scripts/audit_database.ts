
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function audit() {
  console.log('--- Starting Database Audit ---');

  // 1. Check Perfumes without Slugs
  const { data: noSlug, error: slugErr } = await supabase
    .from('perfumes')
    .select('id, name')
    .is('slug', null);
  
  if (slugErr) console.error('Error fetching perfumes without slugs:', slugErr.message);
  else if (noSlug?.length) console.warn(`[WARNING] Found ${noSlug.length} perfumes without slugs.`);
  else console.log('[OK] All perfumes have slugs.');

  // 2. Check Perfumes without Brands
  const { data: noBrand, error: brandErr } = await supabase
    .from('perfumes')
    .select('id, name')
    .is('brand_id', null);

  if (brandErr) console.error('Error fetching perfumes without brands:', brandErr.message);
  else if (noBrand?.length) console.warn(`[WARNING] Found ${noBrand.length} perfumes without brand_id.`);
  else console.log('[OK] All perfumes have a brand_id.');

  // 3. Check for Orphaned Comments
  // First, get all perfume IDs to check in memory (if not too many)
  const { data: perfumes } = await supabase.from('perfumes').select('id');
  const perfumeIds = new Set(perfumes?.map(p => p.id) || []);

  const { data: comments, error: commentErr } = await supabase.from('comments').select('id, perfume_id, user_name');
  if (commentErr) {
    console.error('Error fetching comments:', commentErr.message);
  } else if (comments) {
    const orphanedComments = comments.filter(c => !perfumeIds.has(c.perfume_id));
    if (orphanedComments.length > 0) {
       console.warn(`[WARNING] Found ${orphanedComments.length} orphaned comments (perfume_id not found).`);
       console.log('Example orphan:', orphanedComments[0]);
    } else {
       console.log('[OK] No orphaned comments found.');
    }
  }

  // 4. Check for Perfumes without Image URL
  const { data: noImage } = await supabase.from('perfumes').select('id, name').is('image_url', null);
  if (noImage?.length) console.warn(`[WARNING] Found ${noImage.length} perfumes without images.`);

  // 5. Check for Broken Perfume-Note Links
  const { data: notes } = await supabase.from('notes').select('id');
  const noteIds = new Set(notes?.map(n => n.id) || []);
  
  const { data: pNotes, error: pNoteErr } = await supabase.from('perfume_notes').select('id, perfume_id, note_id');
  if (pNoteErr) {
    console.error('Error fetching perfume_notes:', pNoteErr.message);
  } else if (pNotes) {
    const orphanedNotes = pNotes.filter(pn => !perfumeIds.has(pn.perfume_id) || !noteIds.has(pn.note_id));
    if (orphanedNotes.length > 0) {
        console.warn(`[WARNING] Found ${orphanedNotes.length} invalid perfume_note records.`);
    } else {
        console.log('[OK] Perfume-Note associations are valid.');
    }
  }

  // 6. Check for Duplicate Slugs
  const { data: allPerfumes } = await supabase.from('perfumes').select('slug');
  if (allPerfumes) {
    const slugCounts = new Map();
    allPerfumes.forEach(p => {
        if (p.slug) {
            slugCounts.set(p.slug, (slugCounts.get(p.slug) || 0) + 1);
        }
    });
    const duplicates = Array.from(slugCounts.entries()).filter(([_, count]) => count > 1);
    if (duplicates.length > 0) {
        console.warn(`[WARNING] Found ${duplicates.length} duplicate slugs:`, duplicates.slice(0, 5));
    } else {
        console.log('[OK] No duplicate slugs found.');
    }
  }

  // 7. Check for User Collections with Invalid Perfumes
  const { data: collections } = await supabase.from('user_collections').select('id, perfume_id');
  if (collections) {
    const orphanedCollections = collections.filter(c => !perfumeIds.has(c.perfume_id));
    if (orphanedCollections.length > 0) {
        console.warn(`[WARNING] Found ${orphanedCollections.length} orphaned items in user collections.`);
    } else {
        console.log('[OK] User collections are valid.');
    }
  }

  // 8. Check for Reviews (Confirm table existence first)
  const { data: reviews, error: reviewsErr } = await supabase.from('reviews').select('id, perfume_id');
  if (reviewsErr) {
    if (reviewsErr.code === '42P01') {
      console.log('[INFO] Reviews table does not exist.');
    } else {
      console.error('Error fetching reviews:', reviewsErr.message);
    }
  } else if (reviews) {
    const orphanedReviews = reviews.filter(r => !perfumeIds.has(r.perfume_id));
    if (orphanedReviews.length > 0) {
        console.warn(`[WARNING] Found ${orphanedReviews.length} orphaned reviews.`);
    } else {
        console.log('[OK] No orphaned reviews found.');
    }
  }

  console.log('--- Audit Finished ---');
}

audit();
