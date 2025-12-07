import { createClient } from '@supabase/supabase-js';

async function testSupabaseConnection() {
  console.log('Attempting to connect to Supabase...');
  
  // Load environment variables directly
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('Supabase URL:', supabaseUrl ? '✓ Found' : '✗ Missing');
  console.log('Supabase Key:', supabaseAnonKey ? '✓ Found' : '✗ Missing');

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('CRITICAL ERROR: Supabase environment variables are missing');
    console.log('Make sure .env.local contains:');
    console.log('NEXT_PUBLIC_SUPABASE_URL=your_url_here');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here');
    return;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Test a simple query to check connection
    const { data, error } = await supabase.from('perfumes').select('count').limit(1);

    if (error) {
      console.error('Error connecting to Supabase:', error.message);
      console.log('This could mean:');
      console.log('1. The table "perfumes" doesn\'t exist');
      console.log('2. Your Supabase URL or key is incorrect');
      console.log('3. Your Supabase project is not accessible');
      return;
    }

    console.log('✅ Successfully connected to Supabase!');
    console.log('Response:', data);

  } catch (err) {
    console.error('An unexpected error occurred:', err);
  }
  console.log('Supabase connection test complete.');
}

testSupabaseConnection();