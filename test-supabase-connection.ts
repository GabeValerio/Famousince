// Test Supabase connection
import { supabase } from './lib/supabaseClient';

async function testConnection(): Promise<void> {
  console.log('Testing Supabase connection...');
  
  // Check if environment variables are loaded
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set');
  console.log('Supabase Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set');
  
  try {
    // Test a simple query
    const { data, error } = await supabase
      .from('consultations')
      .select('count(*)')
      .limit(1);
      
    if (error) {
      console.error('Connection test failed:', error);
    } else {
      console.log('Connection test successful:', data);
    }
  } catch (err) {
    console.error('Connection test error:', err);
  }
}

testConnection(); 