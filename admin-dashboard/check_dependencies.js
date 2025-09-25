const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://adzhdsajdamrflvybhxq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkemhkc2FqZGFtcmZsdnliaHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4NDg5ODEsImV4cCI6MjA2OTQyNDk4MX0.pgn6M5_ihDFt3ojQmCoc3Qf8pc7LzRvQEIDT7g1nW3c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDependencies() {
  console.log('🔍 church_id를 참조하는 테이블들 확인 중...\n');

  // 일반적으로 church_id를 참조할 수 있는 테이블들 체크
  const possibleTables = [
    'members', 'users', 'attendances', 'donations',
    'announcements', 'bulletins', 'prayer_requests',
    'pastoral_care', 'worship_services', 'community_sharing',
    'community_requests', 'job_posts', 'music_team_seekers'
  ];

  for (const tableName of possibleTables) {
    try {
      // 테이블이 존재하는지 확인하고 church_id 컬럼이 있는지 체크
      const { data, error } = await supabase
        .from(tableName)
        .select('church_id')
        .limit(1);

      if (!error) {
        const { count } = await supabase
          .from(tableName)
          .select('church_id', { count: 'exact', head: true })
          .not('church_id', 'is', null);

        console.log(`✅ ${tableName}: ${count || 0}개 레코드가 church_id 사용`);
      }
    } catch (err) {
      // 테이블이 없거나 church_id 컬럼이 없음
      console.log(`❌ ${tableName}: 테이블 없음 또는 church_id 컬럼 없음`);
    }
  }

  console.log('\n🔍 churches 테이블의 현재 참조 상태 확인...');

  try {
    // churches 테이블의 현재 데이터 확인
    const { data: churches } = await supabase
      .from('churches')
      .select('id, name, created_at')
      .order('created_at');

    console.log(`\n📊 현재 churches 테이블 상태:`);
    churches.forEach((church, index) => {
      console.log(`${index + 1}. ID: ${church.id.substring(0, 8)}... | 이름: ${church.name}`);
    });

    // members 테이블에서 church_id 사용 현황 체크
    try {
      const { data: membersByChurch } = await supabase
        .from('members')
        .select('church_id')
        .not('church_id', 'is', null);

      if (membersByChurch && membersByChurch.length > 0) {
        const churchUsage = {};
        membersByChurch.forEach(member => {
          const churchId = member.church_id;
          churchUsage[churchId] = (churchUsage[churchId] || 0) + 1;
        });

        console.log(`\n👥 교인들의 church_id 사용 현황:`);
        Object.entries(churchUsage).forEach(([churchId, count]) => {
          const church = churches.find(c => c.id === churchId);
          const churchName = church ? church.name : `알 수 없는 교회 (${churchId.substring(0, 8)}...)`;
          console.log(`   ${churchName}: ${count}명`);
        });
      }
    } catch (memberError) {
      console.log('❌ members 테이블 확인 실패');
    }

  } catch (error) {
    console.error('Churches 테이블 확인 실패:', error);
  }
}

checkDependencies();