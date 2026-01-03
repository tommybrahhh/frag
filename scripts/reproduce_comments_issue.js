const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Load env vars
const envPath = path.resolve(__dirname, '../.env.local');
try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^"(.*)"$/, '$1'); // Remove quotes if present
      process.env[key] = value;
    }
  });
  console.log('Loaded .env.local');
} catch (e) {
  console.log('Could not load .env.local, relying on existing env vars.');
}

// 2. Init Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Fetching a perfume...');
  const { data: perfumes, error: pError } = await supabase
    .from('perfumes')
    .select('id, name')
    .limit(1);

  if (pError) {
    console.error('Error fetching perfume:', pError);
    return;
  }

  if (!perfumes || perfumes.length === 0) {
    console.log('No perfumes found.');
    return;
  }

  const perfumeId = perfumes[0].id;
  console.log(`Testing comments for perfume: ${perfumes[0].name} (${perfumeId})`);

  console.log('Calling get_comments_with_upvotes...');
  const { data, error } = await supabase
    .rpc('get_comments_with_upvotes', { 
      p_perfume_id: perfumeId, 
      p_order_by: 'created_at' 
    });

  if (error) {
    console.error('RPC Error:', error);
  } else {
    console.log('RPC Success. Data:', data);
  }
}

run();
