import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

async function testSupabaseConnection() {
  console.log('Attempting to connect to Supabase...');
  
  // Load environment variables from .env.local
  try {
    const envContent = readFileSync('.env.local', 'utf8');
    const envVars = {};
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim();
      }
    });
    
    const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    console.log('Supabase URL:', supabaseUrl ? '✓ Found' : '✗ Missing');
    console.log('Supabase Key:', supabaseAnonKey ? '✓ Found' : '✗ Missing');

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('CRITICAL ERROR: Supabase environment variables are missing');
      console.log('Make sure .env.local contains:');
      console.log('NEXT_PUBLIC_SUPABASE_URL=your_url_here');
      console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Test the brands table to check the tier column
    const { data: brandsData, error: brandsError } = await supabase.from('brands').select('id, name, tier').limit(10);
    
    if (brandsError) {
      console.error('Error fetching brands:', brandsError.message);
      return;
    }

    console.log('Brands with tier information:');
    console.log(brandsData);

    // Also check perfumes to see the relationship
    const { data: perfumesData, error: perfumesError } = await supabase.from('perfumes').select('id, name, brand_id').limit(5);
    
    if (perfumesError) {
      console.error('Error fetching perfumes:', perfumesError.message);
      return;
    }

    console.log('Sample perfumes with brand_id:');
    console.log(perfumesData);

  } catch (err) {
    console.error('An unexpected error occurred:', err);
  }
  console.log('Supabase connection test complete.');
}

testSupabaseConnection();