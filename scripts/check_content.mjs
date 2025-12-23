import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

async function checkContent() {
  console.log('Checking content format...');
  
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
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data } = await supabase
      .from('blog_posts')
      .select('content')
      .eq('slug', 'dolce-gabbana-the-one-edp-intense-review')
      .single();

    if (data) {
      console.log('Content sample:');
      console.log(data.content.substring(0, 500));
    }

  } catch (err) {
    console.error(err);
  }
}

checkContent();
