const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

async function checkMemberSchema() {
  console.log('Checking members table schema...\n');

  // Get table columns from information_schema
  const { data, error } = await supabase.rpc('get_table_columns', {
    table_name: 'members'
  });

  if (error) {
    // Fallback: Query directly
    const { data: queryData, error: queryError } = await supabase
      .from('members')
      .select('*')
      .limit(1);

    if (queryError) {
      console.error('Error:', queryError);
      return;
    }

    if (queryData && queryData.length > 0) {
      const columns = Object.keys(queryData[0]);
      console.log('Members table columns (from data):');
      columns.forEach(col => console.log(`  - ${col}`));

      console.log('\n\nNow checking AddMemberWizard fields...\n');

      // Fields from AddMemberWizard
      const wizardFields = [
        'name', 'name_eng', 'email', 'gender', 'birthdate', 'phone',
        'position', 'district', 'department', 'position_code', 'appointed_on',
        'ordination_church', 'job_title', 'workplace', 'workplace_phone',
        'contacts', 'sacraments', 'transfers',
        'address', 'marital_status', 'spouse_name', 'married_on', 'vehicles'
      ];

      console.log('AddMemberWizard fields:');
      wizardFields.forEach(field => {
        const exists = columns.includes(field);
        console.log(`  ${exists ? '✓' : '✗'} ${field}`);
      });

      console.log('\n\nDatabase columns not in wizard:');
      columns.forEach(col => {
        if (!wizardFields.includes(col)) {
          console.log(`  + ${col}`);
        }
      });
    } else {
      console.log('No data in members table yet');
    }
  }
}

checkMemberSchema().then(() => process.exit(0));
