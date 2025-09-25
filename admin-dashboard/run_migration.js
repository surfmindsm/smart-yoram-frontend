const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://adzhdsajdamrflvybhxq.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemhkc2FqZGFtcmZsdnliaHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NDg5ODEsImV4cCI6MjA2OTQyNDk4MX0.pgn6M5_ihDFt3ojQmCoc3Qf8pc7LzRvQEIDT7g1nW3c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('Starting migration to fix serial_id values...');

    // First, check churches without serial_id
    const { data: churchesWithoutSerialId, error: checkError } = await supabase
      .from('churches')
      .select('id, name, created_at')
      .is('serial_id', null);

    if (checkError) {
      console.error('Error checking churches:', checkError);
      return;
    }

    console.log(`Found ${churchesWithoutSerialId.length} churches without serial_id`);

    if (churchesWithoutSerialId.length === 0) {
      console.log('No churches need serial_id updates');
      return;
    }

    // Sort by created_at to assign serial_id in order
    const sortedChurches = churchesWithoutSerialId.sort((a, b) =>
      new Date(a.created_at) - new Date(b.created_at)
    );

    // Get the maximum existing serial_id
    const { data: maxSerialIdResult, error: maxError } = await supabase
      .from('churches')
      .select('serial_id')
      .not('serial_id', 'is', null)
      .order('serial_id', { ascending: false })
      .limit(1);

    if (maxError) {
      console.error('Error getting max serial_id:', maxError);
      return;
    }

    let nextSerialId = (maxSerialIdResult && maxSerialIdResult[0])
      ? maxSerialIdResult[0].serial_id + 1
      : 1;

    console.log(`Starting serial_id assignment from: ${nextSerialId}`);

    // Update each church with sequential serial_id
    for (const church of sortedChurches) {
      console.log(`Updating church "${church.name}" with serial_id: ${nextSerialId}`);

      const { error: updateError } = await supabase
        .from('churches')
        .update({ serial_id: nextSerialId })
        .eq('id', church.id);

      if (updateError) {
        console.error(`Error updating church ${church.name}:`, updateError);
        continue;
      }

      nextSerialId++;
    }

    console.log('Migration completed successfully!');

    // Verify the results
    const { data: verificationData, error: verifyError } = await supabase
      .from('churches')
      .select('serial_id, name, subscription_status, subscription_plan')
      .order('serial_id');

    if (verifyError) {
      console.error('Error verifying results:', verifyError);
      return;
    }

    console.log('\nUpdated churches:');
    console.table(verificationData);

  } catch (error) {
    console.error('Migration failed:', error);
  }
}

runMigration();