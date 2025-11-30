import { createClient } from '../src/lib/supabase.ts';

async function testSupabaseConnection() {
  console.log('Attempting to connect to Supabase...');
  try {
    const supabase = createClient();

    // IMPORTANT: Replace 'your_table_name' with an actual table name from your Supabase project
    // For example, if you have a 'perfumes' table, change it to:
    // const { data, error } = await supabase.from('perfumes').select('*').limit(5);
    const { data, error } = await supabase.from('your_table_name').select('*').limit(5);

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
