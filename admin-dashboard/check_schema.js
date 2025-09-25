const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://adzhdsajdamrflvybhxq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemhkc2FqZGFtcmZsdnliaHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NDg5ODEsImV4cCI6MjA2OTQyNDk4MX0.pgn6M5_ihDFt3ojQmCoc3Qf8pc7LzRvQEIDT7g1nW3c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  try {
    console.log('Checking churches table schema...');

    // Get all churches to see what columns exist
    const { data: churches, error } = await supabase
      .from('churches')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error fetching churches:', error);
      return;
    }

    if (churches && churches.length > 0) {
      console.log('Available columns in churches table:');
      console.log(Object.keys(churches[0]));
    } else {
      console.log('No churches found in table');
    }

    // Also check the current count
    const { count } = await supabase
      .from('churches')
      .select('*', { count: 'exact', head: true });

    console.log(`Total churches in database: ${count}`);

  } catch (error) {
    console.error('Schema check failed:', error);
  }
}

checkSchema();