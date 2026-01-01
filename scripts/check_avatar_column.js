const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' }); 

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('Checking avatar_url column...');
  // Try to select avatar_url from profiles
  const { data, error } = await supabase
    .from('profiles')
    .select('avatar_url')
    .limit(1);

  if (error) {
    console.error('Error selecting avatar_url:', error);
  } else {
    console.log('Successfully selected avatar_url. Column exists.');
  }
}

checkSchema();