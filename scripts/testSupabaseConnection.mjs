import { createClient } from '../src/lib/supabase.ts';

async function testSupabaseConnection() {
  console.log('Attempting to connect to Supabase...');
  try {
    const supabase = createClient();

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

    if (error) {
      console.error('Error fetching data:', error.message);
      return;
    }

    if (data && data.length > 0) {
      console.log('Successfully connected to Supabase and fetched data!');
      console.log('First 5 rows from your_table_name:', data);
    } else {
      console.log('Connected to Supabase, but no data found in "your_table_name" or table does not exist.');
      console.log('Make sure "your_table_name" exists and has data, or change to an existing table name.');
    }
  } catch (err) {
    console.error('An unexpected error occurred:', err);
  }
  console.log('Supabase connection test complete.');
}

testSupabaseConnection();
