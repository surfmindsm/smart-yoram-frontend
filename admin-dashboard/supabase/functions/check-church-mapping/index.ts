import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔍 church_applications와 churches 매핑 관계 확인...');

    // 1. 승인된 신청서 조회
    const { data: applications, error: appError } = await supabase
      .from('church_applications')
      .select('*')
      .eq('status', 'approved')
      .limit(10);

    if (appError) throw appError;

    // 2. 각 신청서에 대해 매칭되는 교회 찾기
    const mappings = [];

    for (const app of applications || []) {
      // email로 매칭 시도
      const { data: churchByEmail } = await supabase
        .from('churches')
        .select('serial_id, name, email, pastor_name')
        .eq('email', app.email)
        .single();

      // church_name으로 매칭 시도
      const { data: churchByName } = await supabase
        .from('churches')
        .select('serial_id, name, email, pastor_name')
        .eq('name', app.church_name)
        .single();

      mappings.push({
        application: {
          id: app.id,
          church_name: app.church_name,
          email: app.email,
          pastor_name: app.pastor_name,
          denomination: app.denomination,
        },
        matched_by_email: churchByEmail ? {
          serial_id: churchByEmail.serial_id,
          name: churchByEmail.name,
          email: churchByEmail.email,
        } : null,
        matched_by_name: churchByName ? {
          serial_id: churchByName.serial_id,
          name: churchByName.name,
          email: churchByName.email,
        } : null,
        same_match: churchByEmail?.serial_id === churchByName?.serial_id,
      });
    }

    // 3. 통계
    const stats = {
      total_approved_applications: applications?.length || 0,
      matched_by_email: mappings.filter(m => m.matched_by_email).length,
      matched_by_name: mappings.filter(m => m.matched_by_name).length,
      exact_match: mappings.filter(m => m.same_match && m.matched_by_email).length,
      no_match: mappings.filter(m => !m.matched_by_email && !m.matched_by_name).length,
    };

    const result = {
      success: true,
      stats,
      mappings,
      recommendation: stats.matched_by_email > stats.matched_by_name
        ? 'email을 기준으로 매핑하는 것이 더 정확합니다.'
        : 'church_name으로 매핑하거나, 수동 매핑이 필요할 수 있습니다.',
    };

    console.log('✅ 매핑 분석 완료:', result);

    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('❌ 매핑 확인 실패:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
