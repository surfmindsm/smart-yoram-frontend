const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://adzhdsajdamrflvybhxq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemhkc2FqZGFtcmZsdnliaHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NDg5ODEsImV4cCI6MjA2OTQyNDk4MX0.pgn6M5_ihDFt3ojQmCoc3Qf8pc7LzRvQEIDT7g1nW3c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyMigration() {
  try {
    console.log('Verifying serial_id migration...');

    // Check if serial_id column exists and has values
    const { data: churches, error } = await supabase
      .from('churches')
      .select('id, serial_id, name, subscription_status, subscription_plan, created_at')
      .order('serial_id');

    if (error) {
      console.error('Error fetching churches:', error);
      return;
    }

    if (churches && churches.length > 0) {
      console.log('✅ Serial_id column exists!');
      console.log(`✅ Found ${churches.length} churches with serial_id values`);

      console.log('\nChurches with their serial_id:');
      churches.forEach(church => {
        console.log(`${church.serial_id}: ${church.name} (${church.subscription_status || 'inactive'})`);
      });

      // Check if any church has undefined serial_id
      const undefinedSerialIds = churches.filter(c => c.serial_id === null || c.serial_id === undefined);
      if (undefinedSerialIds.length === 0) {
        console.log('✅ All churches have valid serial_id values');
      } else {
        console.log(`❌ ${undefinedSerialIds.length} churches still have undefined serial_id`);
      }

      // Test the new function
      try {
        const { data: testResult, error: funcError } = await supabase.rpc('get_church_by_serial_id', {
          church_serial_id: 1
        });

        if (funcError) {
          console.log('❌ get_church_by_serial_id function not working:', funcError.message);
        } else {
          console.log('✅ get_church_by_serial_id function working correctly');
          if (testResult && testResult.length > 0) {
            console.log(`   Found church: ${testResult[0].name}`);
          }
        }
      } catch (funcError) {
        console.log('❌ get_church_by_serial_id function test failed:', funcError.message);
      }

    } else {
      console.log('❌ No churches found or serial_id column missing');
    }

  } catch (error) {
    console.error('Verification failed:', error);
  }
}

verifyMigration();