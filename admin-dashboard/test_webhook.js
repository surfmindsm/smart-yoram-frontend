const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://adzhdsajdamrflvybhxq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemhkc2FqZGFtcmZsdnliaHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NDg5ODEsImV4cCI6MjA2OTQyNDk4MX0.pgn6M5_ihDFt3ojQmCoc3Qf8pc7LzRvQEIDT7g1nW3c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRecentApplications() {
  const { data, error } = await supabase
    .from('community_applications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('최근 신청서 3건:');
    data.forEach((app, idx) => {
      console.log(`\n${idx + 1}. ID: ${app.id}`);
      console.log(`   조직명: ${app.organization_name}`);
      console.log(`   이메일: ${app.email}`);
      console.log(`   신청일시: ${app.submitted_at || app.created_at}`);
      console.log(`   상태: ${app.status}`);
    });
  }
}

checkRecentApplications();
