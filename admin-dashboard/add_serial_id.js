const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://adzhdsajdamrflvybhxq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemhkc2FqZGFtcmZsdnliaHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NDg5ODEsImV4cCI6MjA2OTQyNDk4MX0.pgn6M5_ihDFt3ojQmCoc3Qf8pc7LzRvQEIDT7g1nW3c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addSerialIdColumn() {
  try {
    console.log('Adding serial_id column and updating existing churches...');

    // First, let's run a SQL command to add the serial_id column
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        -- Add serial_id column as a SERIAL (auto-increment) column
        ALTER TABLE public.churches
        ADD COLUMN IF NOT EXISTS serial_id SERIAL UNIQUE;

        -- Update existing churches with sequential serial_id values
        WITH numbered_churches AS (
          SELECT
            id,
            ROW_NUMBER() OVER (ORDER BY created_at, id) as row_num
          FROM public.churches
          WHERE serial_id IS NULL
        )
        UPDATE public.churches
        SET serial_id = numbered_churches.row_num
        FROM numbered_churches
        WHERE public.churches.id = numbered_churches.id;

        -- Make serial_id NOT NULL for future inserts
        ALTER TABLE public.churches
        ALTER COLUMN serial_id SET NOT NULL;
      `
    });

    if (error) {
      console.error('Error executing SQL:', error);

      // Try a simpler approach if the RPC doesn't work
      console.log('Trying alternative approach...');

      // Get all churches first
      const { data: churches, error: fetchError } = await supabase
        .from('churches')
        .select('id, name, created_at')
        .order('created_at');

      if (fetchError) {
        console.error('Error fetching churches:', fetchError);
        return;
      }

      console.log('Found churches that need serial_id values:');
      churches.forEach((church, index) => {
        console.log(`${index + 1}: ${church.name}`);
      });

      console.log('\nYou need to manually add the serial_id column in the Supabase dashboard.');
      console.log('Run this SQL in the SQL Editor:');
      console.log(`
-- Add serial_id column
ALTER TABLE public.churches
ADD COLUMN serial_id SERIAL UNIQUE;

-- Update existing churches with sequential values
UPDATE public.churches
SET serial_id = subquery.row_num
FROM (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY created_at, id) as row_num
  FROM public.churches
) as subquery
WHERE public.churches.id = subquery.id;

-- Make serial_id NOT NULL
ALTER TABLE public.churches
ALTER COLUMN serial_id SET NOT NULL;
      `);

      return;
    }

    console.log('Successfully added serial_id column!');

    // Verify the results
    const { data: verificationData, error: verifyError } = await supabase
      .from('churches')
      .select('serial_id, name, subscription_status, subscription_plan')
      .order('serial_id');

    if (verifyError) {
      console.error('Error verifying results:', verifyError);
      return;
    }

    console.log('Churches with serial_id:');
    console.table(verificationData);

  } catch (error) {
    console.error('Operation failed:', error);
  }
}

addSerialIdColumn();