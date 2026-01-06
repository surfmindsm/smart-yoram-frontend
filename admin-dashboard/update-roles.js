// 일회성 스크립트: church_admin을 church_super_admin으로 변경
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://adzhdsajdamrflvybhxq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY 환경 변수가 설정되지 않았습니다.');
  console.log('다음 명령어로 실행하세요:');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your-service-role-key node update-roles.js');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function updateRoles() {
  try {
    console.log('📋 church_admin 역할을 가진 사용자 조회 중...\n');

    // 1. church_admin 역할을 가진 사용자 조회
    const { data: users, error: fetchError } = await supabase
      .from('users')
      .select('id, email, username, full_name, church_id, role')
      .eq('role', 'church_admin')
      .neq('church_id', 0)  // Super Admin 제외
      .neq('church_id', 9998);  // 커뮤니티 사용자 제외

    if (fetchError) {
      throw fetchError;
    }

    if (!users || users.length === 0) {
      console.log('✅ church_admin 역할을 가진 사용자가 없습니다.');
      return;
    }

    console.log(`🔍 총 ${users.length}명의 사용자를 찾았습니다:\n`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}, 이름: ${user.full_name || user.username}, 이메일: ${user.email}, Church ID: ${user.church_id}`);
    });

    console.log('\n🔄 역할 변경 중...\n');

    // 2. church_super_admin으로 업데이트
    const { data: updatedData, error: updateError } = await supabase
      .from('users')
      .update({ role: 'church_super_admin' })
      .eq('role', 'church_admin')
      .neq('church_id', 0)
      .neq('church_id', 9998)
      .select();

    if (updateError) {
      throw updateError;
    }

    console.log(`✅ ${updatedData?.length || 0}명의 사용자 역할이 church_super_admin으로 변경되었습니다.\n`);

    // 3. 변경 결과 확인
    console.log('📋 변경된 사용자 목록:\n');
    updatedData?.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}, 이름: ${user.full_name || user.username}, 새 역할: ${user.role}`);
    });

    console.log('\n✅ 모든 작업이 완료되었습니다!');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error(error);
    process.exit(1);
  }
}

updateRoles();
