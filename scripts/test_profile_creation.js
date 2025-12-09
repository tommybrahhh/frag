// Simple test script to check if profiles are being created properly
import { createClient } from '../src/lib/supabase.ts';

async function testProfileCreation() {
  console.log('Testing profile creation...');
  
  try {
    const supabase = createClient();
    
    // Get the current session to test with a real user
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      console.log('No user session found. Please log in first.');
      return;
    }
    
    console.log('User ID:', session.user.id);
    console.log('User email:', session.user.email);
    
    // Check if profile exists
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }
    
    if (profile) {
      console.log('Profile found:', profile);
    } else {
      console.log('No profile found for this user.');
      console.log('This could mean:');
      console.log('1. The database trigger was not executed');
      console.log('2. The user was created before the trigger was set up');
      console.log('3. There was an error in profile creation');
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

testProfileCreation();