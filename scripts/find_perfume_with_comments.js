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
      const value = match[2].trim().replace(/^\"(.*)\"$/, '$1'); 
      process.env[key] = value;
    }
  });
} catch (e) {
  console.log('Could not load .env.local');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Searching for a perfume with comments...');
  
  // Get a comment to find a valid perfume_id
  const { data: comments, error } = await supabase
    .from('comments')
    .select('perfume_id')
    .limit(1);

  if (error) {
    console.error('Error fetching comments:', error);
    return;
  }

  if (!comments || comments.length === 0) {
    console.log('No comments found in the database at all.');
    return;
  }

  const perfumeId = comments[0].perfume_id;
  console.log(`Found perfume with comments: ${perfumeId}`);

  console.log('Testing RPC performance...');
  const start = Date.now();
  const { data: rpcData, error: rpcError } = await supabase
    .rpc('get_comments_with_upvotes', { 
      p_perfume_id: perfumeId, 
      p_order_by: 'created_at' 
    });
  const duration = Date.now() - start;

  if (rpcError) {
    console.error('RPC Error:', rpcError);
  } else {
    console.log(`RPC Success. Fetched ${rpcData.length} comments in ${duration}ms.`);
    console.log('First comment sample:', rpcData[0]);
  }
}

run();
